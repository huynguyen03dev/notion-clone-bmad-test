import { describe, it, expect, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import {
  classifyDatabaseError,
  shouldRetryError,
  getRetryDelay,
  DatabaseErrorType,
  DatabaseErrorHandler,
  ConnectionRecovery,
} from '../database-errors'

describe('Database Error Handling', () => {
  describe('classifyDatabaseError', () => {
    it('should classify connection failed errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        { code: 'P1001', clientVersion: '5.0.0' }
      )

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.CONNECTION_FAILED)
      expect(result.isRetryable).toBe(true)
      expect(result.message).toBe('Database connection failed')
    })

    it('should classify unique constraint violations', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { 
          code: 'P2002', 
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      )

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.CONSTRAINT_VIOLATION)
      expect(result.isRetryable).toBe(false)
      expect(result.context?.constraint).toEqual(['email'])
    })

    it('should classify record not found errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0.0' }
      )

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.NOT_FOUND)
      expect(result.isRetryable).toBe(false)
    })

    it('should classify timeout errors', () => {
      const error = new Error('Connection timeout occurred')

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.TIMEOUT)
      expect(result.isRetryable).toBe(true)
    })

    it('should classify connection refused errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused')

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.CONNECTION_FAILED)
      expect(result.isRetryable).toBe(true)
    })

    it('should classify unknown errors', () => {
      const error = new Error('Some unknown error')

      const result = classifyDatabaseError(error)

      expect(result.type).toBe(DatabaseErrorType.UNKNOWN)
      expect(result.isRetryable).toBe(false)
    })
  })

  describe('shouldRetryError', () => {
    it('should return true for retryable connection errors', () => {
      const error = {
        type: DatabaseErrorType.CONNECTION_FAILED,
        message: 'Connection failed',
        originalError: new Error(),
        isRetryable: true,
      }

      expect(shouldRetryError(error)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const error = {
        type: DatabaseErrorType.CONSTRAINT_VIOLATION,
        message: 'Constraint violation',
        originalError: new Error(),
        isRetryable: false,
      }

      expect(shouldRetryError(error)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      expect(getRetryDelay(1, 1000)).toBeGreaterThanOrEqual(1000)
      expect(getRetryDelay(2, 1000)).toBeGreaterThanOrEqual(2000)
      expect(getRetryDelay(3, 1000)).toBeGreaterThanOrEqual(4000)
    })

    it('should cap delay at maximum value', () => {
      const delay = getRetryDelay(10, 1000)
      expect(delay).toBeLessThanOrEqual(30000)
    })
  })

  describe('DatabaseErrorHandler', () => {
    it('should handle errors with degradation strategy', async () => {
      const mockStrategy = {
        enableReadOnlyMode: vi.fn(),
        enableCacheMode: vi.fn(),
        disableNonEssentialFeatures: vi.fn(),
      }

      const handler = new DatabaseErrorHandler(mockStrategy)
      const error = new Prisma.PrismaClientKnownRequestError(
        'Permission denied',
        { code: 'P1010', clientVersion: '5.0.0' }
      )

      await handler.handleError(error, 'test-operation')

      expect(mockStrategy.disableNonEssentialFeatures).toHaveBeenCalled()
    })
  })

  describe('ConnectionRecovery', () => {
    it('should attempt connection recovery', async () => {
      const mockPrisma = {
        $disconnect: vi.fn().mockResolvedValue(undefined),
        $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
      }

      const recovery = new ConnectionRecovery()
      const result = await recovery.attemptRecovery(mockPrisma)

      expect(result).toBe(true)
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
    })

    it('should fail recovery after max attempts', async () => {
      const mockPrisma = {
        $disconnect: vi.fn().mockResolvedValue(undefined),
        $queryRaw: vi.fn().mockRejectedValue(new Error('Still failing')),
      }

      const recovery = new ConnectionRecovery()

      // Attempt recovery multiple times
      for (let i = 0; i < 5; i++) {
        await recovery.attemptRecovery(mockPrisma)
      }

      // Should not attempt recovery after max attempts
      const result = await recovery.attemptRecovery(mockPrisma)
      expect(result).toBe(false)
    }, 10000)

    it('should reset recovery attempts', () => {
      const recovery = new ConnectionRecovery()
      
      // Simulate failed attempts
      recovery['recoveryAttempts'] = 3
      
      recovery.reset()
      
      expect(recovery['recoveryAttempts']).toBe(0)
      expect(recovery['isRecovering']).toBe(false)
    })
  })
})
