// Environment variable validation and configuration

interface DatabaseConfig {
  url: string
  connectionLimit: number
  poolTimeout: number
  connectTimeout: number
}

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test'
  nextAuthSecret: string
  nextAuthUrl: string
  database: DatabaseConfig
  enableMetrics: boolean
  logQueries: boolean
}

function validateDatabaseUrl(url: string): void {
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }
  
  if (!url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }
  
  // Basic URL validation
  try {
    new URL(url)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL')
  }
}

function parseConnectionLimit(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue
  
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > 100) {
    throw new Error(`Invalid connection limit: ${value}. Must be between 1 and 100`)
  }
  
  return parsed
}

function parseTimeout(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue
  
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > 300) {
    throw new Error(`Invalid timeout: ${value}. Must be between 1 and 300 seconds`)
  }
  
  return parsed
}

function validateEnvironment(): AppConfig {
  const nodeEnv = process.env.NODE_ENV as AppConfig['nodeEnv']
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test`)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  validateDatabaseUrl(databaseUrl)

  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  if (!nextAuthSecret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required')
  }
  
  if (nodeEnv === 'production' && nextAuthSecret.includes('your-secret-key-here')) {
    throw new Error('NEXTAUTH_SECRET must be changed from default value in production')
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (!nextAuthUrl) {
    throw new Error('NEXTAUTH_URL environment variable is required')
  }

  // Parse database configuration
  const connectionLimit = parseConnectionLimit(
    process.env.DB_CONNECTION_LIMIT,
    nodeEnv === 'production' ? 50 : 20
  )
  
  const poolTimeout = parseTimeout(
    process.env.DB_POOL_TIMEOUT,
    nodeEnv === 'production' ? 30 : 20
  )
  
  const connectTimeout = parseTimeout(
    process.env.DB_CONNECT_TIMEOUT,
    10
  )

  return {
    nodeEnv,
    nextAuthSecret,
    nextAuthUrl,
    database: {
      url: databaseUrl,
      connectionLimit,
      poolTimeout,
      connectTimeout,
    },
    enableMetrics: process.env.ENABLE_DB_METRICS === 'true',
    logQueries: process.env.PRISMA_LOG_QUERIES === 'true' && nodeEnv === 'development',
  }
}

// Validate environment on module load
let config: AppConfig

try {
  config = validateEnvironment()
  
  if (config.nodeEnv === 'development') {
    console.log('✅ Environment validation passed')
    console.log(`📊 Database connection limit: ${config.database.connectionLimit}`)
    console.log(`⏱️  Pool timeout: ${config.database.poolTimeout}s`)
    console.log(`🔗 Connect timeout: ${config.database.connectTimeout}s`)
  }
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}

export { config }
export type { AppConfig, DatabaseConfig }
