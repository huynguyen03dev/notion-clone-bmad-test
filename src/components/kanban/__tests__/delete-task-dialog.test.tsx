import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteTaskDialog } from '../delete-task-dialog';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock UI components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2 data-testid="alert-dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="alert-dialog-action">
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="alert-dialog-cancel">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const mockTask: TaskWithDetails = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  columnId: 'column-1',
  boardId: 'board-1',
  assigneeId: 'user-1',
  priority: TaskPriority.HIGH,
  dueDate: new Date('2024-12-31'),
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  assignee: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  },
  column: {
    id: 'column-1',
    name: 'To Do',
    color: '#3b82f6',
  },
  board: {
    id: 'board-1',
    name: 'Test Board',
  },
};

describe('DeleteTaskDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open with task', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Delete Task');
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('does not render when task is null', () => {
    render(
      <DeleteTaskDialog
        task={null}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('shows task description when available', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Task Description:')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
  });

  it('hides task description when not available', () => {
    const taskWithoutDescription = { ...mockTask, description: null };

    render(
      <DeleteTaskDialog
        task={taskWithoutDescription}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Task Description:')).not.toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByTestId('alert-dialog-action');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('task-1');
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByTestId('alert-dialog-cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state when deleting', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();

    const deleteButton = screen.getByTestId('alert-dialog-action');
    const cancelButton = screen.getByTestId('alert-dialog-cancel');

    expect(deleteButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('handles delete error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockOnConfirm.mockRejectedValue(new Error('Delete failed'));

    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByTestId('alert-dialog-action');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task:', expect.any(Error));
    });

    // Should not close dialog on error
    expect(mockOnClose).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('closes dialog after successful deletion', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByTestId('alert-dialog-action');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('prevents closing when processing', () => {
    render(
      <DeleteTaskDialog
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    // Try to close via onOpenChange (simulating dialog close)
    // This would normally be triggered by the AlertDialog component
    // Since we're mocking it, we can't test this behavior directly
    // But the component should prevent closing when isProcessing or isDeleting is true

    const cancelButton = screen.getByTestId('alert-dialog-cancel');
    expect(cancelButton).toBeDisabled();
  });
});
