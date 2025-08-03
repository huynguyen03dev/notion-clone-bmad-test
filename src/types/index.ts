// Global type definitions for the Kanban Board Application

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy'
  database: 'connected' | 'disconnected'
  timestamp: string
  error?: string
}
