import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pooling configuration for production scalability
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration for 100+ concurrent users
    // Note: These are passed via DATABASE_URL connection string parameters
    // Example: postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=20
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection pool monitoring utilities
export async function getConnectionPoolStatus() {
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`

    // Get connection pool metrics (if available)
    // Note: $metrics is not available in all Prisma versions
    let metrics = null
    try {
      // @ts-expect-error - $metrics may not be available in all versions
      if (prisma.$metrics) {
        // @ts-expect-error - $metrics API may not be available
        metrics = await prisma.$metrics.json()
      }
    } catch {
      // Metrics not available, continue without them
    }

    return {
      status: 'healthy',
      metrics,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Graceful shutdown helper
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('Database connection closed gracefully')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Connection retry logic for transient failures
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}
