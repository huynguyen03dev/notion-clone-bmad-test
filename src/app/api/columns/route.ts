import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Constants
const MAX_COLUMNS_PER_BOARD = 10;
const MAX_COLUMN_NAME_LENGTH = 100;

// Validation schemas
const createColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(MAX_COLUMN_NAME_LENGTH, `Column name must be less than ${MAX_COLUMN_NAME_LENGTH} characters`),
  boardId: z.string().min(1, 'Board ID is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
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

// POST /api/columns - Create a new column
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createColumnSchema.parse(body);

    // Verify user has access to the board
    const hasAccess = await verifyBoardAccess(session.user.id, validatedData.boardId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Board not found or access denied' },
        { status: 404 }
      );
    }

    // Check column limit (max 10 columns per board)
    const columnCount = await prisma.column.count({
      where: { boardId: validatedData.boardId },
    });

    if (columnCount >= MAX_COLUMNS_PER_BOARD) {
      return NextResponse.json(
        { error: `Maximum column limit (${MAX_COLUMNS_PER_BOARD}) reached for this board` },
        { status: 400 }
      );
    }

    // Get the next position
    const lastColumn = await prisma.column.findFirst({
      where: { boardId: validatedData.boardId },
      orderBy: { position: 'desc' },
    });

    const nextPosition = lastColumn ? lastColumn.position + 1 : 0;

    // Create the column
    const column = await prisma.column.create({
      data: {
        name: validatedData.name,
        boardId: validatedData.boardId,
        position: nextPosition,
        color: validatedData.color,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ column }, { status: 201 });

  } catch (error) {
    console.error('Column creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
