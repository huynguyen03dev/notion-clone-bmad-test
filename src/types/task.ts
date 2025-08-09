import { Task, TaskPriority, User, Column, Board } from '@prisma/client'

// Core Task types
export type TaskWithDetails = Task & {
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null
  column: Pick<Column, 'id' | 'name' | 'color'>
  board: Pick<Board, 'id' | 'name'>
}

export type TaskWithAssignee = Task & {
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null
}

// API Request/Response types
export interface CreateTaskRequest {
  title: string
  description?: string
  columnId: string
  boardId: string
  assigneeId?: string
  priority?: TaskPriority
  dueDate?: string // ISO string
  position?: number // If not provided, will be set to end of column
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  columnId?: string
  assigneeId?: string
  priority?: TaskPriority
  dueDate?: string | null // ISO string or null to clear
  position?: number
}

export interface MoveTaskRequest {
  columnId: string
  position: number
}

export interface DuplicateTaskRequest {
  columnId?: string // If not provided, duplicates in same column
  position?: number // If not provided, places at end of column
}

export interface TaskResponse {
  task: TaskWithDetails
}

export interface TasksResponse {
  tasks: TaskWithDetails[]
  total: number
}

// Task filters and search
export interface TaskFilters {
  boardId?: string
  columnId?: string
  assigneeId?: string
  priority?: TaskPriority
  search?: string
  dueDateFrom?: string // ISO string
  dueDateTo?: string // ISO string
  sortBy?:
    | 'title'
    | 'priority'
    | 'dueDate'
    | 'createdAt'
    | 'updatedAt'
    | 'position'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Task statistics
export interface TaskStats {
  totalTasks: number
  tasksByPriority: {
    LOW: number
    MEDIUM: number
    HIGH: number
  }
  tasksByColumn: Array<{
    columnId: string
    columnName: string
    count: number
  }>
  overdueTasks: number
  dueSoon: number // Due within 7 days
}

// Error types
export interface TaskError {
  code:
    | 'TASK_NOT_FOUND'
    | 'COLUMN_NOT_FOUND'
    | 'BOARD_NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'VALIDATION_ERROR'
    | 'POSITION_CONFLICT'
    | 'INTERNAL_ERROR'
  message: string
  field?: string
}

// Validation constraints
export const TASK_VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 200,
    required: true,
  },
  description: {
    maxLength: 10000,
    required: false,
  },
  position: {
    min: 0,
    required: false,
  },
} as const

// Task priority display helpers
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30',
  MEDIUM:
    'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/30',
  HIGH: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30',
}

// Task position utilities
export interface PositionUpdate {
  taskId: string
  newPosition: number
}

export interface BulkPositionUpdate {
  columnId: string
  updates: PositionUpdate[]
}
