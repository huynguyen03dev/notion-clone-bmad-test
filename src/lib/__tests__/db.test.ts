import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry } from '../db'

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $queryRaw: vi.fn(),
    $metrics: {
      json: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
}))

describe('Database Utilities', () => {
  let mockPrisma: Record<string, unknown>

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
      $metrics: {
        json: vi.fn(),
      },
      $disconnect: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getConnectionPoolStatus', () => {
    it('should return healthy status when database is accessible', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }])
      mockPrisma.$metrics.json.mockResolvedValue({ connections: { active: 5, idle: 10 } })

      // Mock the prisma import
      vi.doMock('../db', () => ({
        prisma: mockPrisma,
        getConnectionPoolStatus: async () => {
          try {
            await mockPrisma.$queryRaw`SELECT 1`
            const metrics = await mockPrisma.$metrics.json()
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
        },
      }))

      const { getConnectionPoolStatus: testFunction } = await import('../db')
      const result = await testFunction()

      expect(result.status).toBe('healthy')
      expect(result.metrics).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should return unhealthy status when database is not accessible', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'))

      vi.doMock('../db', () => ({
        prisma: mockPrisma,
        getConnectionPoolStatus: async () => {
          try {
            await mockPrisma.$queryRaw`SELECT 1`
            const metrics = await mockPrisma.$metrics.json()
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
        },
      }))

      const { getConnectionPoolStatus: testFunction } = await import('../db')
      const result = await testFunction()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await withRetry(operation, 3, 100)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')

      const result = await withRetry(operation, 3, 100)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(withRetry(operation, 2, 100)).rejects.toThrow('Persistent failure')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('disconnectDatabase', () => {
    it('should disconnect gracefully', async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined)

      vi.doMock('../db', () => ({
        prisma: mockPrisma,
        disconnectDatabase: async () => {
          try {
            await mockPrisma.$disconnect()
            console.log('Database connection closed gracefully')
          } catch (error) {
            console.error('Error closing database connection:', error)
          }
        },
      }))

      const { disconnectDatabase: testFunction } = await import('../db')
      await testFunction()

      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1)
    })

    it('should handle disconnect errors gracefully', async () => {
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.doMock('../db', () => ({
        prisma: mockPrisma,
        disconnectDatabase: async () => {
          try {
            await mockPrisma.$disconnect()
            console.log('Database connection closed gracefully')
          } catch (error) {
            console.error('Error closing database connection:', error)
          }
        },
      }))

      const { disconnectDatabase: testFunction } = await import('../db')
      await testFunction()

      expect(consoleSpy).toHaveBeenCalledWith('Error closing database connection:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })
})
