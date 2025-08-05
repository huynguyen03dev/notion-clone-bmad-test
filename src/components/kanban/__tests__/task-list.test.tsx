import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskList } from '../task-list';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock the hooks
const mockGetTasks = vi.fn();
const mockDeleteTask = vi.fn();
const mockDuplicateTask = vi.fn();

vi.mock('@/hooks/use-task-api', () => ({
  useTaskApi: () => ({
    getTasks: mockGetTasks,
    deleteTask: mockDeleteTask,
    duplicateTask: mockDuplicateTask,
    isLoading: false,
  }),
}));

// Mock the sortable components
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}));

// Mock the task card components
vi.mock('../sortable-task-card', () => ({
  SortableTaskCard: ({ task, onEdit, onDelete, onDuplicate, onClick }: any) => (
    <div data-testid={`task-${task.id}`}>
      <span>{task.title}</span>
      <button onClick={() => onEdit?.(task)}>Edit</button>
      <button onClick={() => onDelete?.(task.id)}>Delete</button>
      <button onClick={() => onDuplicate?.(task.id)}>Duplicate</button>
      <button onClick={() => onClick?.(task)}>Click</button>
    </div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const mockTasks: TaskWithDetails[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    columnId: 'column-1',
    boardId: 'board-1',
    assigneeId: null,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    column: {
      id: 'column-1',
      name: 'To Do',
      color: null,
    },
    board: {
      id: 'board-1',
      name: 'Test Board',
    },
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    columnId: 'column-1',
    boardId: 'board-1',
    assigneeId: null,
    priority: TaskPriority.HIGH,
    dueDate: null,
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    column: {
      id: 'column-1',
      name: 'To Do',
      color: null,
    },
    board: {
      id: 'board-1',
      name: 'Test Board',
    },
  },
];

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays tasks', async () => {
    mockGetTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    expect(mockGetTasks).toHaveBeenCalledWith({
      columnId: 'column-1',
      boardId: 'board-1',
      sortBy: 'position',
      sortOrder: 'asc',
    });
  });

  it('shows loading skeleton while loading tasks', () => {
    mockGetTasks.mockImplementation(() => new Promise(() => { })); // Never resolves

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
      />
    );

    const skeletons = screen.getAllByRole('generic').filter(el =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no tasks', async () => {
    mockGetTasks.mockResolvedValue({
      tasks: [],
      total: 0,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Click "Add a task" to get started')).toBeInTheDocument();
    });
  });

  it('shows add task button', async () => {
    mockGetTasks.mockResolvedValue({
      tasks: [],
      total: 0,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Add a task')).toBeInTheDocument();
    });
  });

  it('calls onAddTask when add button is clicked', async () => {
    const onAddTaskMock = vi.fn();
    mockGetTasks.mockResolvedValue({
      tasks: [],
      total: 0,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
        onAddTask={onAddTaskMock}
      />
    );

    await waitFor(() => {
      const addButton = screen.getByText('Add a task');
      fireEvent.click(addButton);
    });

    expect(onAddTaskMock).toHaveBeenCalledWith('column-1');
  });

  it('calls onTaskEdit when task edit is triggered', async () => {
    const onTaskEditMock = vi.fn();
    mockGetTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
        onTaskEdit={onTaskEditMock}
      />
    );

    await waitFor(() => {
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);
    });

    expect(onTaskEditMock).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls onTaskClick when task is clicked', async () => {
    const onTaskClickMock = vi.fn();
    mockGetTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
    });

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
        onTaskClick={onTaskClickMock}
      />
    );

    await waitFor(() => {
      const clickButton = screen.getAllByText('Click')[0];
      fireEvent.click(clickButton);
    });

    expect(onTaskClickMock).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('deletes task when delete is triggered', async () => {
    const onTasksUpdatedMock = vi.fn();
    mockGetTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
    });
    mockDeleteTask.mockResolvedValue(true);

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
        onTasksUpdated={onTasksUpdatedMock}
      />
    );

    await waitFor(() => {
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
    });

    expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
    expect(onTasksUpdatedMock).toHaveBeenCalled();
  });

  it('duplicates task when duplicate is triggered', async () => {
    const onTasksUpdatedMock = vi.fn();
    const duplicatedTask = { ...mockTasks[0], id: 'task-3', title: 'Task 1 (Copy)' };

    mockGetTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
    });
    mockDuplicateTask.mockResolvedValue(duplicatedTask);

    render(
      <TaskList
        columnId="column-1"
        boardId="board-1"
        onTasksUpdated={onTasksUpdatedMock}
      />
    );

    await waitFor(() => {
      const duplicateButton = screen.getAllByText('Duplicate')[0];
      fireEvent.click(duplicateButton);
    });

    expect(mockDuplicateTask).toHaveBeenCalledWith('task-1', 'column-1');
    expect(onTasksUpdatedMock).toHaveBeenCalled();
  });
});
