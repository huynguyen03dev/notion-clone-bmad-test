'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useBoard, useBoardColumns } from '@/hooks/use-board-data';

interface Board {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface Column {
  id: string;
  name: string;
  color?: string | null;
  position: number;
  _count: {
    tasks: number;
  };
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const boardId = params.boardId as string;

  // 🚀 REACT QUERY SOLUTION: Replace problematic useEffect with React Query
  const {
    data: boardData,
    isLoading: boardLoading,
    error: boardError,
    refetch: refetchBoard
  } = useBoard(boardId);

  const {
    data: columnsData,
    isLoading: columnsLoading,
    error: columnsError,
    refetch: refetchColumns
  } = useBoardColumns(boardId);

  // Extract data from React Query responses
  const board = boardData?.board || null;
  const columns = columnsData?.columns || [];
  const loading = boardLoading || columnsLoading;
  const error = boardError?.message || columnsError?.message || null;

  // Handle authentication redirect
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/signin');
    return null;
  }

  // 🎉 NO MORE PROBLEMATIC fetchBoard FUNCTION! React Query handles everything!

  const handleColumnsUpdated = () => {
    // 🚀 REACT QUERY SOLUTION: Use React Query's refetch instead of manual state management
    console.log('🔄 handleColumnsUpdated called - using React Query refetch');
    refetchColumns();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-80 h-96 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">{error}</h1>
          <p className="text-muted-foreground">
            {error === 'Board not found'
              ? 'The board you are looking for does not exist or has been deleted.'
              : 'Please try again or contact support if the problem persists.'
            }
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Board Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>

              <div>
                <h1 className="text-xl font-semibold">{board.name}</h1>
                {board.description && (
                  <p className="text-sm text-muted-foreground">{board.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {board.isPublic && (
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}

              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Collaborate
              </Button>

              {session?.user?.id === board.ownerId && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="container mx-auto px-4 py-6">
        <KanbanBoard
          boardId={boardId}
          columns={columns}
          onColumnsUpdated={handleColumnsUpdated}
        />
      </div>
    </div>
  );
}
