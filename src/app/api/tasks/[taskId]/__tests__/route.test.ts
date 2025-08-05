import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { TaskPriority } from '@prisma/client';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    column: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import mocked prisma after mocking
import { prisma } from '@/lib/db';

describe('/api/tasks/[taskId]', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    columnId: 'column-1',
    boardId: 'board-1',
    assigneeId: null,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    board: {
      id: 'board-1',
      name: 'Test Board',
      ownerId: 'user-1',
    },
    column: {
      id: 'column-1',
      name: 'To Do',
      boardId: 'board-1',
    },
    assignee: null,
  };

  const mockTaskWithDetails = {
    ...mockTask,
    assignee: null,
    column: {
      id: 'column-1',
      name: 'To Do',
      color: null,
    },
    board: {
      id: 'board-1',
      name: 'Test Board',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: mockUser,
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/tasks/[taskId]', () => {
    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1');
      const response = await GET(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return task when user has access', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTaskWithDetails);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1');
      const response = await GET(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task).toEqual(mockTaskWithDetails);
    });

    it('should return 404 when task not found or access denied', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1');
      const response = await GET(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found or access denied');
    });
  });

  describe('PATCH /api/tasks/[taskId]', () => {
    const updateData = {
      title: 'Updated Task',
      priority: TaskPriority.HIGH,
    };

    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      const response = await PATCH(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update task successfully', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.update).mockResolvedValue(mockTaskWithDetails);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      const response = await PATCH(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task).toEqual(mockTaskWithDetails);
    });

    it('should return 404 when task not found or access denied', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      const response = await PATCH(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found or access denied');
    });

    it('should validate title length', async () => {
      const invalidUpdate = {
        title: 'a'.repeat(201), // Exceeds max length
      };

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdate),
      });
      const response = await PATCH(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/tasks/[taskId]', () => {
    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should delete task successfully', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.delete).mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 404 when task not found or access denied', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { taskId: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found or access denied');
    });
  });
});
