import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, POST } from '../route';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const mockSession = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
};

const mockBoard = {
  id: 'board-1',
  name: 'Test Board',
  description: 'Test Description',
  ownerId: 'user-1',
  isPublic: false,
  createdAt: '2025-08-04T15:43:49.292Z',
  updatedAt: '2025-08-04T15:43:49.293Z',
  owner: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
  },
  _count: {
    tasks: 5,
    columns: 3,
  },
};

describe('/api/boards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/boards', () => {
    it('should return boards for authenticated user', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.findMany).mockResolvedValue([mockBoard]);
      vi.mocked(prisma.board.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/boards');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.boards).toHaveLength(1);
      expect(data.boards[0]).toEqual(mockBoard);
      expect(data.total).toBe(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/boards');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle search filtering', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.findMany).mockResolvedValue([mockBoard]);
      vi.mocked(prisma.board.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/boards?search=Test');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(prisma.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'Test',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.findMany).mockResolvedValue([mockBoard]);
      vi.mocked(prisma.board.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/boards?limit=10&offset=20');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(prisma.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.findMany).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/boards');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.create).mockResolvedValue(mockBoard);

      const request = new NextRequest('http://localhost:3000/api/boards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Board',
          description: 'Test Description',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.board).toEqual(mockBoard);
      expect(prisma.board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Board',
            description: 'Test Description',
            ownerId: 'user-1',
            columns: {
              create: [
                { name: 'To Do', position: 0 },
                { name: 'In Progress', position: 1 },
                { name: 'Done', position: 2 },
              ],
            },
          }),
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Board' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate board name', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should handle database errors', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.board.create).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Board' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
