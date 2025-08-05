import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import mocked prisma after mocking
import { prisma } from '@/lib/db';

describe('/api/users', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar1.jpg',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: mockUser,
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return unauthorized when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return users for authenticated user', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual(mockUsers);
      expect(vi.mocked(prisma.user.findMany)).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should return empty array when no users found', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual([]);
    });

    it('should handle database errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(consoleSpy).toHaveBeenCalledWith('Users fetch error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should order users by name ascending', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const request = new NextRequest('http://localhost:3000/api/users');
      await GET(request);

      expect(vi.mocked(prisma.user.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            name: 'asc',
          },
        })
      );
    });

    it('should only select required user fields', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const request = new NextRequest('http://localhost:3000/api/users');
      await GET(request);

      expect(vi.mocked(prisma.user.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        })
      );
    });

    it('should handle users with null avatar', async () => {
      const usersWithNullAvatar = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(usersWithNullAvatar);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual(usersWithNullAvatar);
    });

    it('should handle session without user id', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' }, // No id
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
