import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { POST } from '../route';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findFirst: vi.fn(),
    },
    column: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);
const mockPrisma = vi.mocked(prisma);

describe('/api/columns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/columns', () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
    };

    const mockBoard = {
      id: 'board-1',
      name: 'Test Board',
      ownerId: 'user-1',
    };

    it('should create a new column successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.board.findFirst.mockResolvedValue(mockBoard);
      mockPrisma.column.count.mockResolvedValue(3);
      mockPrisma.column.findFirst.mockResolvedValue({ position: 2 });
      mockPrisma.column.create.mockResolvedValue({
        id: 'column-1',
        name: 'New Column',
        boardId: 'board-1',
        position: 3,
        color: '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { tasks: 0 },
      });

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
          color: '#3B82F6',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.column.name).toBe('New Column');
      expect(data.column.position).toBe(3);
      expect(mockPrisma.column.create).toHaveBeenCalledWith({
        data: {
          name: 'New Column',
          boardId: 'board-1',
          position: 3,
          color: '#3B82F6',
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for board not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.board.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Board not found or access denied');
    });

    it('should return 400 when column limit is reached', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.board.findFirst.mockResolvedValue(mockBoard);
      mockPrisma.column.count.mockResolvedValue(10);

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Maximum column limit (10) reached for this board');
    });

    it('should validate column name', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          boardId: 'board-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should validate color format', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
          color: 'invalid-color',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should handle database errors', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.board.findFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
