import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '../task-detail-modal';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render, control, name }: any) => {
    const field = { onChange: vi.fn(), value: '' };
    return render({ field });
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: () => <div data-testid="form-message"></div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: any) => (
    <select onChange={(e) => onValueChange?.(e.target.value)} defaultValue={defaultValue}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ alt }: any) => <img alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
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

const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
  },
];

describe('TaskDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnDuplicate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task details when open', () => {
    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('does not render when task is null', () => {
    render(
      <TaskDetailModal
        task={null}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('displays task metadata correctly', () => {
    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });

  it('shows unassigned when no assignee', () => {
    const taskWithoutAssignee = {
      ...mockTask,
      assigneeId: null,
      assignee: null,
    };

    render(
      <TaskDetailModal
        task={taskWithoutAssignee}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows no due date when dueDate is null', () => {
    const taskWithoutDueDate = {
      ...mockTask,
      dueDate: null,
    };

    render(
      <TaskDetailModal
        task={taskWithoutDueDate}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onDuplicate when duplicate button is clicked', async () => {
    mockOnDuplicate.mockResolvedValue(undefined);

    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(mockOnDuplicate).toHaveBeenCalledWith('task-1');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('enters edit mode when edit button is clicked', () => {
    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
      />
    );

    const editButton = screen.getByText('Edit Task');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter task title...')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <TaskDetailModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        availableUsers={mockUsers}
        isLoading={true}
      />
    );

    const editButton = screen.getByText('Edit Task');
    expect(editButton).toBeDisabled();
  });
});
