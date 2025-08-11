import { NextRequest } from 'next/server'
import { PUT } from '../route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    column: {
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('/api/columns/[columnId] PUT', () => {
  const mockSession = {
    user: { id: 'user-1' },
  }

  const mockColumn = {
    id: 'column-1',
    name: 'Test Column',
    boardId: 'board-1',
    position: 1,
    board: { id: 'board-1' },
    _count: { tasks: 0 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.column.findFirst).mockResolvedValue(mockColumn)
    vi.mocked(prisma.column.count).mockResolvedValue(3)
    vi.mocked(prisma.column.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.column.findUnique).mockResolvedValue(mockColumn)
  })

  it('should handle position updates with cleanup of negative positions', async () => {
    const request = new NextRequest('http://localhost/api/columns/column-1', {
      method: 'PUT',
      body: JSON.stringify({ position: 2 }),
    })

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return await callback({
        column: {
          update: vi.fn().mockResolvedValue(mockColumn),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      } as any)
    })

    const response = await PUT(request, { params: { columnId: 'column-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.column).toEqual(mockColumn)
    
    // Verify cleanup of negative positions was called
    expect(prisma.column.updateMany).toHaveBeenCalledWith({
      where: {
        boardId: 'board-1',
        position: { lt: 0 },
      },
      data: {
        position: 0,
      },
    })
  })

  it('should handle unique constraint violations gracefully', async () => {
    const request = new NextRequest('http://localhost/api/columns/column-1', {
      method: 'PUT',
      body: JSON.stringify({ position: 2 }),
    })

    const constraintError = new Error('Unique constraint violation')
    ;(constraintError as any).code = 'P2002'

    vi.mocked(prisma.$transaction).mockRejectedValue(constraintError)

    const response = await PUT(request, { params: { columnId: 'column-1' } })
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Position conflict detected. Please try again.')
  })
})
