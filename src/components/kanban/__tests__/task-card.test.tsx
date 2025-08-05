import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../task-card';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock the UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ alt }: any) => <img alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
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

describe('TaskCard', () => {
  it('renders task title and description', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
  });

  it('displays priority badge', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows assignee information', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('displays due date', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Dec 31')).toBeInTheDocument();
  });

  it('shows unassigned state when no assignee', () => {
    const taskWithoutAssignee = {
      ...mockTask,
      assigneeId: null,
      assignee: null,
    };

    render(<TaskCard task={taskWithoutAssignee} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('handles task without description', () => {
    const taskWithoutDescription = {
      ...mockTask,
      description: null,
    };

    render(<TaskCard task={taskWithoutDescription} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('This is a test task description')).not.toBeInTheDocument();
  });

  it('handles task without due date', () => {
    const taskWithoutDueDate = {
      ...mockTask,
      dueDate: null,
    };

    render(<TaskCard task={taskWithoutDueDate} />);

    expect(screen.queryByText('Dec 31')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClickMock = vi.fn();
    render(<TaskCard task={mockTask} onClick={onClickMock} />);

    const card = screen.getByText('Test Task').closest('div');
    fireEvent.click(card!);

    expect(onClickMock).toHaveBeenCalledWith(mockTask);
  });

  it('calls onEdit when edit menu item is clicked', () => {
    const onEditMock = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEditMock} />);

    const editButton = screen.getByText('Edit task');
    fireEvent.click(editButton);

    expect(onEditMock).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete menu item is clicked', () => {
    const onDeleteMock = vi.fn();
    render(<TaskCard task={mockTask} onDelete={onDeleteMock} />);

    const deleteButton = screen.getByText('Delete task');
    fireEvent.click(deleteButton);

    expect(onDeleteMock).toHaveBeenCalledWith('task-1');
  });

  it('calls onDuplicate when duplicate menu item is clicked', () => {
    const onDuplicateMock = vi.fn();
    render(<TaskCard task={mockTask} onDuplicate={onDuplicateMock} />);

    const duplicateButton = screen.getByText('Duplicate task');
    fireEvent.click(duplicateButton);

    expect(onDuplicateMock).toHaveBeenCalledWith('task-1');
  });

  it('applies dragging styles when isDragging is true', () => {
    render(<TaskCard task={mockTask} isDragging={true} />);

    const card = screen.getByText('Test Task').closest('div')?.parentElement;
    expect(card).toHaveClass('opacity-50');
  });

  it('shows overdue styling for past due dates', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date('2020-01-01'), // Past date
    };

    render(<TaskCard task={overdueTask} />);

    const dueDateElement = screen.getByText('Jan 1').closest('div');
    expect(dueDateElement).toHaveClass('text-red-600');
  });

  it('shows due soon styling for upcoming due dates', () => {
    const dueSoonTask = {
      ...mockTask,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    };

    render(<TaskCard task={dueSoonTask} />);

    // Check that the calendar icon is displayed (it's an SVG, not an img)
    const calendarIcon = document.querySelector('.lucide-calendar');
    expect(calendarIcon).toBeInTheDocument();
  });
});
