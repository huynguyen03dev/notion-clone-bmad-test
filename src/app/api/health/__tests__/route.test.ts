import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '../route'

// Mock the database utilities
vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  getConnectionPoolStatus: vi.fn(),
  withRetry: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  config: {
    nodeEnv: 'test',
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return healthy status when all checks pass', async () => {
    const { prisma, getConnectionPoolStatus, withRetry } = await import('@/lib/db')

    // Mock successful database operations
    vi.mocked(withRetry).mockImplementation(async (operation) => {
      return await operation()
    })

    // Mock all database queries for health check
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ result: 1 }]) // Health check query
      .mockResolvedValueOnce([{ table_name: '_prisma_migrations' }]) // Migration table check
      .mockResolvedValueOnce([]) // No pending migrations

    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'healthy',
      metrics: { connections: { active: 5, idle: 10 } },
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.database.status).toBe('connected')
    expect(data.checks.database).toBe(true)
    expect(data.checks.connectionPool).toBe(true)
  })

  it('should return unhealthy status when database is disconnected', async () => {
    const { getConnectionPoolStatus, withRetry } = await import('@/lib/db')
    
    // Mock database connection failure
    vi.mocked(withRetry).mockRejectedValue(new Error('Connection failed'))
    
    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'unhealthy',
      error: 'Connection failed',
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.database.status).toBe('disconnected')
    expect(data.checks.database).toBe(false)
  })

  it('should return degraded status when database is slow', async () => {
    const { prisma, getConnectionPoolStatus, withRetry } = await import('@/lib/db')
    
    // Mock slow database response
    vi.mocked(withRetry).mockImplementation(async (operation) => {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 1100))
      return await operation()
    })
    
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }])
    
    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'healthy',
      metrics: { connections: { active: 15, idle: 5 } },
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('degraded')
    expect(data.database.status).toBe('slow')
    expect(data.database.responseTime).toBeGreaterThan(1000)
  })

  it('should include migration status in response', async () => {
    const { prisma, getConnectionPoolStatus, withRetry } = await import('@/lib/db')
    
    vi.mocked(withRetry).mockImplementation(async (operation) => {
      return await operation()
    })
    
    // Mock migration table queries
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ result: 1 }]) // Health check query
      .mockResolvedValueOnce([{ table_name: '_prisma_migrations' }]) // Migration table check
      .mockResolvedValueOnce([]) // No pending migrations
    
    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'healthy',
      metrics: null,
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(data.database.migrations).toBeDefined()
    expect(data.database.migrations.status).toBe('up-to-date')
    expect(data.checks.migrations).toBe(true)
  })

  it('should handle pending migrations', async () => {
    const { prisma, getConnectionPoolStatus, withRetry } = await import('@/lib/db')
    
    vi.mocked(withRetry).mockImplementation(async (operation) => {
      return await operation()
    })
    
    // Mock pending migrations
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ result: 1 }]) // Health check query
      .mockResolvedValueOnce([{ table_name: '_prisma_migrations' }]) // Migration table check
      .mockResolvedValueOnce([
        { migration_name: 'pending_migration_1', finished_at: null },
        { migration_name: 'pending_migration_2', finished_at: null },
      ]) // Pending migrations
    
    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'healthy',
      metrics: null,
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('degraded')
    expect(data.database.migrations.status).toBe('pending')
    expect(data.database.migrations.pendingCount).toBe(2)
  })

  it('should include application metadata', async () => {
    const { prisma, getConnectionPoolStatus, withRetry } = await import('@/lib/db')
    
    vi.mocked(withRetry).mockImplementation(async (operation) => {
      return await operation()
    })
    
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }])
    
    vi.mocked(getConnectionPoolStatus).mockResolvedValue({
      status: 'healthy',
      metrics: null,
      timestamp: new Date().toISOString(),
    })

    const response = await GET()
    const data = await response.json()

    expect(data.application).toBeDefined()
    expect(data.application.version).toBeDefined()
    expect(data.application.environment).toBe('test')
    expect(data.application.uptime).toBeGreaterThanOrEqual(0)
    expect(data.timestamp).toBeDefined()
  })

  it('should handle complete system failure gracefully', async () => {
    const { getConnectionPoolStatus, withRetry } = await import('@/lib/db')

    // Mock complete system failure
    vi.mocked(withRetry).mockRejectedValue(new Error('Database connection failed'))
    vi.mocked(getConnectionPoolStatus).mockRejectedValue(new Error('System failure'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database).toBe(false)
    expect(data.checks.migrations).toBe(false)
    expect(data.checks.connectionPool).toBe(false)
  })
})
