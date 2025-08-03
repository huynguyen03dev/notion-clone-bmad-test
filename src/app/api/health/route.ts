import { NextResponse } from 'next/server'
import { prisma, getConnectionPoolStatus, withRetry } from '@/lib/db'
import { config } from '@/lib/env'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: {
    status: 'connected' | 'disconnected' | 'slow'
    responseTime: number
    connectionPool?: Record<string, unknown>
    migrations?: {
      status: 'up-to-date' | 'pending' | 'unknown'
      pendingCount?: number
    }
  }
  application: {
    version: string
    environment: string
    uptime: number
  }
  timestamp: string
  checks: {
    database: boolean
    migrations: boolean
    connectionPool: boolean
  }
}

async function checkDatabaseConnection(): Promise<{ status: string; responseTime: number; error?: string }> {
  const start = Date.now()

  try {
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`
    }, 2, 500)

    const responseTime = Date.now() - start

    return {
      status: responseTime > 1000 ? 'slow' : 'connected',
      responseTime,
    }
  } catch (error) {
    return {
      status: 'disconnected',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkMigrationStatus(): Promise<{ status: 'up-to-date' | 'pending' | 'unknown'; pendingCount?: number }> {
  try {
    // Check if there are pending migrations
    // Note: This is a simplified check - in production you might want to use Prisma's migration status API
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
    `

    if (tables.length === 0) {
      return { status: 'unknown' }
    }

    // Check for unapplied migrations
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL
    `

    return {
      status: migrations.length > 0 ? 'pending' : 'up-to-date',
      pendingCount: migrations.length,
    }
  } catch {
    return { status: 'unknown' }
  }
}

export async function GET() {
  const startTime = Date.now()
  const checks = {
    database: false,
    migrations: false,
    connectionPool: false,
  }

  try {
    // Check database connection
    const dbCheck = await checkDatabaseConnection()
    checks.database = dbCheck.status !== 'disconnected'

    // Check migration status
    const migrationCheck = await checkMigrationStatus()
    checks.migrations = migrationCheck.status !== 'unknown'

    // Check connection pool status
    const poolStatus = await getConnectionPoolStatus()
    checks.connectionPool = poolStatus.status === 'healthy'

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (!checks.database) {
      overallStatus = 'unhealthy'
    } else if (dbCheck.status === 'slow' || migrationCheck.status === 'pending' || !checks.connectionPool) {
      overallStatus = 'degraded'
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      database: {
        status: dbCheck.status as 'connected' | 'disconnected' | 'slow',
        responseTime: dbCheck.responseTime,
        connectionPool: poolStatus.metrics,
        migrations: migrationCheck,
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: Date.now() - startTime,
      },
      timestamp: new Date().toISOString(),
      checks,
    }

    // Add error details if database is disconnected
    if (dbCheck.error) {
      (response.database as Record<string, unknown>).error = dbCheck.error
    }

    const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200

    return NextResponse.json(response, { status: statusCode })

  } catch (healthCheckError) {
    console.error('Health check failed:', healthCheckError)

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      database: {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: 0,
      },
      timestamp: new Date().toISOString(),
      checks,
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}
