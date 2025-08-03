// Database error handling and classification

import { Prisma } from '@prisma/client'

export enum DatabaseErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface DatabaseError {
  type: DatabaseErrorType
  message: string
  originalError: Error
  isRetryable: boolean
  context?: Record<string, unknown>
}

export function classifyDatabaseError(error: Error): DatabaseError {
  const baseError: DatabaseError = {
    type: DatabaseErrorType.UNKNOWN,
    message: error.message,
    originalError: error,
    isRetryable: false,
  }

  // Prisma-specific error handling
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P1001':
      case 'P1002':
      case 'P1008':
      case 'P1017':
        return {
          ...baseError,
          type: DatabaseErrorType.CONNECTION_FAILED,
          message: 'Database connection failed',
          isRetryable: true,
        }

      case 'P2002':
        return {
          ...baseError,
          type: DatabaseErrorType.CONSTRAINT_VIOLATION,
          message: 'Unique constraint violation',
          isRetryable: false,
          context: { constraint: error.meta?.target },
        }

      case 'P2025':
        return {
          ...baseError,
          type: DatabaseErrorType.NOT_FOUND,
          message: 'Record not found',
          isRetryable: false,
        }

      case 'P2024':
        return {
          ...baseError,
          type: DatabaseErrorType.TIMEOUT,
          message: 'Database operation timed out',
          isRetryable: true,
        }

      default:
        return {
          ...baseError,
          message: `Database error: ${error.message}`,
          isRetryable: false,
        }
    }
  }

  // Connection timeout errors
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return {
      ...baseError,
      type: DatabaseErrorType.TIMEOUT,
      message: 'Database operation timed out',
      isRetryable: true,
    }
  }

  // Connection refused errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
    return {
      ...baseError,
      type: DatabaseErrorType.CONNECTION_FAILED,
      message: 'Database connection refused',
      isRetryable: true,
    }
  }

  // Permission errors
  if (error.message.includes('permission denied') || error.message.includes('authentication failed')) {
    return {
      ...baseError,
      type: DatabaseErrorType.PERMISSION_DENIED,
      message: 'Database permission denied',
      isRetryable: false,
    }
  }

  return baseError
}

export function shouldRetryError(error: DatabaseError): boolean {
  return error.isRetryable && [
    DatabaseErrorType.CONNECTION_FAILED,
    DatabaseErrorType.TIMEOUT,
  ].includes(error.type)
}

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
}

export function logDatabaseError(error: DatabaseError, context?: Record<string, unknown>): void {
  const logLevel = error.isRetryable ? 'warn' : 'error'
  const logData = {
    type: error.type,
    message: error.message,
    isRetryable: error.isRetryable,
    context: { ...error.context, ...context },
    timestamp: new Date().toISOString(),
  }

  if (logLevel === 'error') {
    console.error('Database Error:', logData)
  } else {
    console.warn('Database Warning:', logData)
  }
}

// Graceful degradation strategies
export interface DegradationStrategy {
  enableReadOnlyMode(): Promise<void>
  enableCacheMode(): Promise<void>
  disableNonEssentialFeatures(): Promise<void>
}

export class DatabaseErrorHandler {
  private degradationStrategy?: DegradationStrategy

  constructor(degradationStrategy?: DegradationStrategy) {
    this.degradationStrategy = degradationStrategy
  }

  async handleError(error: Error, operation: string): Promise<void> {
    const dbError = classifyDatabaseError(error)
    
    logDatabaseError(dbError, { operation })

    // Implement graceful degradation for critical errors
    if (!dbError.isRetryable) {
      switch (dbError.type) {
        case DatabaseErrorType.CONNECTION_FAILED:
          await this.degradationStrategy?.enableCacheMode()
          break
        case DatabaseErrorType.PERMISSION_DENIED:
          await this.degradationStrategy?.enableReadOnlyMode()
          break
        default:
          await this.degradationStrategy?.disableNonEssentialFeatures()
      }
    }
  }
}

// Connection recovery mechanisms
export class ConnectionRecovery {
  private isRecovering = false
  private recoveryAttempts = 0
  private maxRecoveryAttempts = 5

  async attemptRecovery(prisma: { $disconnect: () => Promise<void>; $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }): Promise<boolean> {
    if (this.isRecovering || this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return false
    }

    this.isRecovering = true
    this.recoveryAttempts++

    try {
      console.log(`Attempting database connection recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`)
      
      // Disconnect and reconnect
      await prisma.$disconnect()
      await new Promise(resolve => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 100 : 2000)) // Wait 2 seconds (or 100ms in tests)
      
      // Test connection
      await prisma.$queryRaw`SELECT 1`
      
      console.log('Database connection recovery successful')
      this.recoveryAttempts = 0
      this.isRecovering = false
      return true
    } catch (error) {
      console.error(`Database recovery attempt ${this.recoveryAttempts} failed:`, error)
      this.isRecovering = false
      
      if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
        console.error('Maximum recovery attempts reached. Manual intervention required.')
      }
      
      return false
    }
  }

  reset(): void {
    this.recoveryAttempts = 0
    this.isRecovering = false
  }
}
