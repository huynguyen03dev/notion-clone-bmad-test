import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { TaskPriority } from '@prisma/client';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findFirst: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
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

describe('/api/tasks', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    ownerId: 'user-1',
  };

  const mockColumn = {
    id: 'column-1',
    name: 'To Do',
    boardId: 'board-1',
    position: 0,
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

  describe('GET /api/tasks', () => {
    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return tasks for authenticated user', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);
      vi.mocked(prisma.task.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.tasks[0]).toEqual(mockTask);
    });

    it('should filter tasks by boardId when provided', async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValue(mockBoard);
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);
      vi.mocked(prisma.task.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/tasks?boardId=board-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.task.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            boardId: 'board-1',
          }),
        })
      );
    });

    it('should return 404 when board access denied', async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks?boardId=board-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Board not found or access denied');
    });
  });

  describe('POST /api/tasks', () => {
    const validTaskData = {
      title: 'New Task',
      description: 'New Description',
      columnId: 'column-1',
      boardId: 'board-1',
      priority: TaskPriority.HIGH,
    };

    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(validTaskData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create task successfully', async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValue(mockBoard);
      vi.mocked(prisma.column.findFirst).mockResolvedValue(mockColumn);
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null); // No existing tasks
      vi.mocked(prisma.task.create).mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(validTaskData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task).toEqual(mockTask);
    });

    it('should return 404 when board access denied', async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(validTaskData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Board not found or access denied');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing title',
        columnId: 'column-1',
        boardId: 'board-1',
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should validate title length', async () => {
      const invalidData = {
        ...validTaskData,
        title: 'a'.repeat(201), // Exceeds max length
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });
});
