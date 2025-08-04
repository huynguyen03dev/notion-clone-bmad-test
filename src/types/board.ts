import { Board, Column, Task, User, TaskPriority } from '@prisma/client';

// Core Board types
export type BoardWithDetails = Board & {
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  _count: {
    tasks: number;
    columns: number;
  };
};

export type BoardWithColumns = Board & {
  columns: Column[];
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
};

export type BoardWithFullDetails = Board & {
  columns: (Column & {
    tasks: Task[];
  })[];
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  _count: {
    tasks: number;
    columns: number;
  };
};

// API Request/Response types
export interface CreateBoardRequest {
  name: string;
  description?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface BoardResponse {
  board: BoardWithDetails;
}

export interface BoardsResponse {
  boards: BoardWithDetails[];
  total: number;
}

// Board filters and search
export interface BoardFilters {
  search?: string;
  isPublic?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Board statistics
export interface BoardStats {
  totalBoards: number;
  recentBoards: BoardWithDetails[];
  mostActiveBoard?: BoardWithDetails;
}

// Error types
export interface BoardError {
  code: 'BOARD_NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
  message: string;
  field?: string;
}

// Validation schemas (for use with zod)
export const createBoardSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Board name must be between 1 and 100 characters'
  },
  description: {
    required: false,
    maxLength: 1000,
    message: 'Description must be less than 1000 characters'
  }
};

export const updateBoardSchema = {
  name: {
    required: false,
    minLength: 1,
    maxLength: 100,
    message: 'Board name must be between 1 and 100 characters'
  },
  description: {
    required: false,
    maxLength: 1000,
    message: 'Description must be less than 1000 characters'
  },
  isPublic: {
    required: false,
    type: 'boolean',
    message: 'isPublic must be a boolean value'
  }
};
