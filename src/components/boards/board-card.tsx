'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calendar,
  CheckSquare,
  Columns
} from 'lucide-react';
import { BoardWithDetails } from '@/types/board';
import { BoardEditModal } from './board-edit-modal';
import { BoardDeleteDialog } from './board-delete-dialog';

interface BoardCardProps {
  board: BoardWithDetails;
  onBoardUpdated: (board: BoardWithDetails) => void;
  onBoardDeleted: (boardId: string) => void;
}

export function BoardCard({ board, onBoardUpdated, onBoardDeleted }: BoardCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link 
                href={`/boards/${board.id}`}
                className="block hover:underline"
              >
                <h3 className="font-semibold text-lg leading-tight truncate">
                  {board.name}
                </h3>
              </Link>
              {board.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {board.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/boards/${board.id}`} className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Board
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Board
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Board Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Columns className="h-4 w-4" />
                <span>{board._count.columns} columns</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                <span>{board._count.tasks} tasks</span>
              </div>
            </div>

            {/* Board Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Updated {formatDate(board.updatedAt)}</span>
              </div>
              
              {board.isPublic && (
                <Badge variant="secondary" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <BoardEditModal
        board={board}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onBoardUpdated={onBoardUpdated}
      />

      {/* Delete Dialog */}
      <BoardDeleteDialog
        board={board}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onBoardDeleted={onBoardDeleted}
      />
    </>
  );
}
