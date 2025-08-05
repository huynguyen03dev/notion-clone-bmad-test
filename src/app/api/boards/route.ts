import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { CreateBoardRequest, BoardFilters } from '@/types/board'

// Validation schemas
const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Board name is required')
    .max(100, 'Board name must be less than 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
})

const boardFiltersSchema = z.object({
  search: z.string().optional(),
  isPublic: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// GET /api/boards - Get user's boards with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: BoardFilters = {
      search: searchParams.get('search') || undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
      sortBy:
        (searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt') ||
        'updatedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    // Validate filters
    const validatedFilters = boardFiltersSchema.parse(filters)

    // Build where clause
    const whereClause: any = {
      ownerId: session.user.id,
    }

    if (validatedFilters.search) {
      whereClause.name = {
        contains: validatedFilters.search,
        mode: 'insensitive',
      }
    }

    if (validatedFilters.isPublic !== undefined) {
      whereClause.isPublic = validatedFilters.isPublic
    }

    // Get boards with task count
    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              columns: true,
            },
          },
        },
        orderBy: {
          [validatedFilters.sortBy]: validatedFilters.sortOrder,
        },
        take: validatedFilters.limit,
        skip: validatedFilters.offset,
      }),
      prisma.board.count({
        where: whereClause,
      }),
    ])

    return NextResponse.json({
      boards,
      total,
      filters: validatedFilters,
    })
  } catch (error) {
    console.error('Boards fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/boards - Create a new board
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Board creation attempt - Session user ID:', session.user.id)

    // Verify that the user exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })

    if (!existingUser) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 404 }
      )
    }

    console.log('User found:', existingUser)

    const body: CreateBoardRequest = await request.json()

    // Validate request body
    const validatedData = createBoardSchema.parse(body)

    console.log('Creating board with data:', {
      name: validatedData.name,
      description: validatedData.description,
      ownerId: session.user.id,
    })

    // Create board with default columns
    const board = await prisma.board.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        ownerId: session.user.id,
        columns: {
          create: [
            { name: 'To Do', position: 0 },
            { name: 'In Progress', position: 1 },
            { name: 'Done', position: 2 },
          ],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            columns: true,
          },
        },
      },
    })

    console.log('Board created successfully:', board.id)
    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    console.error('Board creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Prisma foreign key constraint errors specifically
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2003') {
        console.error(
          'Foreign key constraint violation - User ID not found:',
          error
        )
        return NextResponse.json(
          { error: 'Invalid user. Please log in again.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
