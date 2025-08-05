import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { CreateTaskRequest, TaskFilters, TASK_VALIDATION } from '@/types/task';
import { TaskPriority } from '@prisma/client';

// Validation schemas
const createTaskSchema = z.object({
  title: z.string()
    .min(TASK_VALIDATION.title.minLength, 'Task title is required')
    .max(TASK_VALIDATION.title.maxLength, `Task title must be less than ${TASK_VALIDATION.title.maxLength} characters`),
  description: z.string()
    .max(TASK_VALIDATION.description.maxLength, `Description must be less than ${TASK_VALIDATION.description.maxLength} characters`)
    .optional(),
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  assigneeId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  position: z.number().min(0).optional(),
});

const taskFiltersSchema = z.object({
  boardId: z.string().optional(),
  columnId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  sortBy: z.enum(['title', 'priority', 'dueDate', 'createdAt', 'updatedAt', 'position']).default('position'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Helper function to verify board access
async function verifyBoardAccess(userId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        { 
          collaborators: { 
            some: { 
              userId, 
              role: { in: ['EDITOR', 'ADMIN'] } 
            } 
          } 
        },
      ],
    },
  });
  return !!board;
}

// Helper function to verify column belongs to board
async function verifyColumnInBoard(columnId: string, boardId: string) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      boardId: boardId,
    },
  });
  return !!column;
}

// Helper function to get next position in column
async function getNextPosition(columnId: string): Promise<number> {
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (lastTask?.position ?? -1) + 1;
}

// GET /api/tasks - Get tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: TaskFilters = {
      boardId: searchParams.get('boardId') || undefined,
      columnId: searchParams.get('columnId') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      priority: searchParams.get('priority') as TaskPriority || undefined,
      search: searchParams.get('search') || undefined,
      dueDateFrom: searchParams.get('dueDateFrom') || undefined,
      dueDateTo: searchParams.get('dueDateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'position',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Validate filters
    const validatedFilters = taskFiltersSchema.parse(filters);

    // If boardId is provided, verify access
    if (validatedFilters.boardId) {
      const hasAccess = await verifyBoardAccess(session.user.id, validatedFilters.boardId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Board not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Build where clause
    const whereClause: any = {};

    if (validatedFilters.boardId) {
      whereClause.boardId = validatedFilters.boardId;
    } else {
      // If no specific board, only show tasks from boards user has access to
      whereClause.board = {
        OR: [
          { ownerId: session.user.id },
          { 
            collaborators: { 
              some: { 
                userId: session.user.id, 
                role: { in: ['VIEWER', 'EDITOR', 'ADMIN'] } 
              } 
            } 
          },
        ],
      };
    }

    if (validatedFilters.columnId) {
      whereClause.columnId = validatedFilters.columnId;
    }

    if (validatedFilters.assigneeId) {
      whereClause.assigneeId = validatedFilters.assigneeId;
    }

    if (validatedFilters.priority) {
      whereClause.priority = validatedFilters.priority;
    }

    if (validatedFilters.search) {
      whereClause.OR = [
        {
          title: {
            contains: validatedFilters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: validatedFilters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (validatedFilters.dueDateFrom || validatedFilters.dueDateTo) {
      whereClause.dueDate = {};
      if (validatedFilters.dueDateFrom) {
        whereClause.dueDate.gte = new Date(validatedFilters.dueDateFrom);
      }
      if (validatedFilters.dueDateTo) {
        whereClause.dueDate.lte = new Date(validatedFilters.dueDateTo);
      }
    }

    // Get tasks with related data
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          board: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          [validatedFilters.sortBy]: validatedFilters.sortOrder,
        },
        take: validatedFilters.limit,
        skip: validatedFilters.offset,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      tasks,
      total,
      filters: validatedFilters,
    });

  } catch (error) {
    console.error('Tasks fetch error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateTaskRequest = await request.json();
    
    // Validate request body
    const validatedData = createTaskSchema.parse(body);

    // Verify user has access to the board
    const hasAccess = await verifyBoardAccess(session.user.id, validatedData.boardId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Board not found or access denied' },
        { status: 404 }
      );
    }

    // Verify column belongs to board
    const columnInBoard = await verifyColumnInBoard(validatedData.columnId, validatedData.boardId);
    if (!columnInBoard) {
      return NextResponse.json(
        { error: 'Column not found in specified board' },
        { status: 400 }
      );
    }

    // Verify assignee exists if provided
    if (validatedData.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 400 }
        );
      }
    }

    // Get position if not provided
    const position = validatedData.position ?? await getNextPosition(validatedData.columnId);

    // Create task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        columnId: validatedData.columnId,
        boardId: validatedData.boardId,
        assigneeId: validatedData.assigneeId,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        position,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });

  } catch (error) {
    console.error('Task creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
