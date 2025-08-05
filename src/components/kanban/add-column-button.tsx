'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddColumnModal } from './add-column-modal';

interface AddColumnButtonProps {
  boardId: string;
  onColumnAdded?: () => void;
  disabled?: boolean;
}

export function AddColumnButton({ boardId, onColumnAdded, disabled }: AddColumnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleColumnAdded = () => {
    setIsModalOpen(false);
    onColumnAdded?.();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="h-10 min-w-[200px] border-dashed border-2 hover:border-solid"
        aria-label="Add new column"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Column
      </Button>

      <AddColumnModal
        boardId={boardId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onColumnAdded={handleColumnAdded}
      />
    </>
  );
}
