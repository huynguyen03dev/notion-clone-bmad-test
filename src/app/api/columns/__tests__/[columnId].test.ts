import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { PUT, DELETE } from '../[columnId]/route';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  prisma: {
    column: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    task: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);
const mockPrisma = vi.mocked(prisma);

describe('/api/columns/[columnId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  const mockColumn = {
    id: 'column-1',
    name: 'To Do',
    boardId: 'board-1',
    position: 0,
    color: '#3B82F6',
    board: {
      id: 'board-1',
      ownerId: 'user-1',
    },
    _count: {
      tasks: 3,
    },
  };

  describe('PUT /api/columns/[columnId]', () => {
    it('should update column name successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(mockColumn);
      mockPrisma.column.update.mockResolvedValue({
        ...mockColumn,
        name: 'Updated Name',
      });
      mockPrisma.column.findUnique.mockResolvedValue({
        ...mockColumn,
        name: 'Updated Name',
      });

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });

      const response = await PUT(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.column.name).toBe('Updated Name');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });

      const response = await PUT(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for column not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });

      const response = await PUT(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Column not found or access denied');
    });
  });

  describe('DELETE /api/columns/[columnId]', () => {
    it('should delete column and move tasks to target column', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(mockColumn);
      mockPrisma.column.count.mockResolvedValue(3);
      
      const targetColumn = { ...mockColumn, id: 'column-2', name: 'In Progress' };
      mockPrisma.column.findFirst
        .mockResolvedValueOnce(mockColumn) // First call for access check
        .mockResolvedValueOnce(targetColumn); // Second call for target column check

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'DELETE',
        body: JSON.stringify({
          taskAction: 'move',
          targetColumnId: 'column-2',
        }),
      });

      const response = await DELETE(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: { columnId: 'column-1' },
        data: { columnId: 'column-2' },
      });
    });

    it('should delete column and all tasks', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(mockColumn);
      mockPrisma.column.count.mockResolvedValue(3);
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'DELETE',
        body: JSON.stringify({
          taskAction: 'delete',
        }),
      });

      const response = await DELETE(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.task.updateMany).not.toHaveBeenCalled();
    });

    it('should return 400 when trying to delete last column', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(mockColumn);
      mockPrisma.column.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'DELETE',
        body: JSON.stringify({
          taskAction: 'delete',
        }),
      });

      const response = await DELETE(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot delete the last column. At least one column must remain.');
    });

    it('should return 400 when target column is missing for move action', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.column.findFirst.mockResolvedValue(mockColumn);
      mockPrisma.column.count.mockResolvedValue(3);

      const request = new NextRequest('http://localhost:3000/api/columns/column-1', {
        method: 'DELETE',
        body: JSON.stringify({
          taskAction: 'move',
        }),
      });

      const response = await DELETE(request, { params: { columnId: 'column-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Target column ID is required when moving tasks');
    });
  });
});
