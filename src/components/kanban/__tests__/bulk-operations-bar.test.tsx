import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkOperationsBar } from '../bulk-operations-bar';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="dropdown-item">{children}</button>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, disabled }: any) => (
    <select
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      data-testid="move-select"
      defaultValue=""
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
}));

const mockTasks: TaskWithDetails[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    columnId: 'column-1',
    boardId: 'board-1',
    assigneeId: null,
    priority: TaskPriority.HIGH,
    dueDate: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    column: { id: 'column-1', name: 'To Do', color: '#3b82f6' },
    board: { id: 'board-1', name: 'Test Board' },
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    columnId: 'column-2',
    boardId: 'board-1',
    assigneeId: null,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    column: { id: 'column-2', name: 'In Progress', color: '#f59e0b' },
    board: { id: 'board-1', name: 'Test Board' },
  },
];

const mockColumns = [
  { id: 'column-1', name: 'To Do', color: '#3b82f6' },
  { id: 'column-2', name: 'In Progress', color: '#f59e0b' },
  { id: 'column-3', name: 'Done', color: '#10b981' },
];

describe('BulkOperationsBar', () => {
  const mockOnClearSelection = vi.fn();
  const mockOnDeleteTasks = vi.fn();
  const mockOnDuplicateTasks = vi.fn();
  const mockOnMoveTasks = vi.fn();

  const defaultProps = {
    selectedTasks: mockTasks,
    onClearSelection: mockOnClearSelection,
    onDeleteTasks: mockOnDeleteTasks,
    onDuplicateTasks: mockOnDuplicateTasks,
    onMoveTasks: mockOnMoveTasks,
    availableColumns: mockColumns,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when tasks are selected', () => {
    render(<BulkOperationsBar {...defaultProps} />);

    expect(screen.getByText('2 tasks selected')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render when no tasks are selected', () => {
    render(<BulkOperationsBar {...defaultProps} selectedTasks={[]} />);

    expect(screen.queryByText('tasks selected')).not.toBeInTheDocument();
  });

  it('shows correct count for single task', () => {
    render(<BulkOperationsBar {...defaultProps} selectedTasks={[mockTasks[0]]} />);

    expect(screen.getByText('1 task selected')).toBeInTheDocument();
  });

  it('calls onDuplicateTasks when duplicate button is clicked', async () => {
    mockOnDuplicateTasks.mockResolvedValue(undefined);

    render(<BulkOperationsBar {...defaultProps} />);

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(mockOnDuplicateTasks).toHaveBeenCalledWith(['task-1', 'task-2']);
      expect(mockOnClearSelection).toHaveBeenCalled();
    });
  });

  it('calls onDeleteTasks when delete button is clicked', async () => {
    mockOnDeleteTasks.mockResolvedValue(undefined);

    render(<BulkOperationsBar {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDeleteTasks).toHaveBeenCalledWith(['task-1', 'task-2']);
      expect(mockOnClearSelection).toHaveBeenCalled();
    });
  });

  it('calls onMoveTasks when column is selected', async () => {
    mockOnMoveTasks.mockResolvedValue(undefined);

    render(<BulkOperationsBar {...defaultProps} />);

    // Find the select element by test ID and set its value
    const moveSelect = screen.getByTestId('move-select');

    // Set the value directly on the element and trigger change
    Object.defineProperty(moveSelect, 'value', {
      writable: true,
      value: 'column-3'
    });

    fireEvent.change(moveSelect, { target: { value: 'column-3' } });

    await waitFor(() => {
      expect(mockOnMoveTasks).toHaveBeenCalledWith(['task-1', 'task-2'], 'column-3');
      expect(mockOnClearSelection).toHaveBeenCalled();
    });
  });

  it('calls onClearSelection when clear button is clicked', () => {
    render(<BulkOperationsBar {...defaultProps} />);

    const clearButton = screen.getByRole('button', { name: /clear selection/i });
    fireEvent.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(<BulkOperationsBar {...defaultProps} isLoading={true} />);

    const duplicateButton = screen.getByText('Duplicate');
    const deleteButton = screen.getByText('Delete');
    const clearButton = screen.getByRole('button', { name: /clear selection/i });

    expect(duplicateButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('shows processing state when operations are running', async () => {
    // Mock a delayed response
    mockOnDuplicateTasks.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<BulkOperationsBar {...defaultProps} />);

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('handles operation errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockOnDeleteTasks.mockRejectedValue(new Error('Delete failed'));

    render(<BulkOperationsBar {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete tasks:', expect.any(Error));
    });

    // Should not clear selection on error
    expect(mockOnClearSelection).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('renders available columns in move dropdown', () => {
    render(<BulkOperationsBar {...defaultProps} />);

    // Check that columns are available as options
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows badge with task count', () => {
    render(<BulkOperationsBar {...defaultProps} />);

    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('positions itself as fixed at bottom center', () => {
    const { container } = render(<BulkOperationsBar {...defaultProps} />);

    const bulkBar = container.firstChild as HTMLElement;
    expect(bulkBar).toHaveClass('fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2');
  });
});
