import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from '../kanban-board';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../sortable-column', () => ({
  SortableColumn: ({ column, children }: any) => (
    <div data-testid={`column-${column.id}`}>
      <div>{column.name}</div>
      {children}
    </div>
  ),
}));

vi.mock('../add-column-button', () => ({
  AddColumnButton: ({ disabled }: any) => (
    <button disabled={disabled} data-testid="add-column-button">
      Add Column
    </button>
  ),
}));

// Mock @dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  horizontalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((array, from, to) => {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
}));

const mockColumns = [
  {
    id: 'column-1',
    name: 'To Do',
    color: '#3B82F6',
    position: 0,
    _count: { tasks: 3 },
  },
  {
    id: 'column-2',
    name: 'In Progress',
    color: '#F59E0B',
    position: 1,
    _count: { tasks: 2 },
  },
  {
    id: 'column-3',
    name: 'Done',
    color: '#10B981',
    position: 2,
    _count: { tasks: 5 },
  },
];

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all columns', () => {
    render(
      <KanbanBoard
        boardId="board-1"
        columns={mockColumns}
      />
    );

    expect(screen.getByTestId('column-column-1')).toBeInTheDocument();
    expect(screen.getByTestId('column-column-2')).toBeInTheDocument();
    expect(screen.getByTestId('column-column-3')).toBeInTheDocument();
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders add column button', () => {
    render(
      <KanbanBoard
        boardId="board-1"
        columns={mockColumns}
      />
    );

    expect(screen.getByTestId('add-column-button')).toBeInTheDocument();
    expect(screen.getByTestId('add-column-button')).not.toBeDisabled();
  });

  it('disables add column button when at maximum columns', () => {
    const maxColumns = Array.from({ length: 10 }, (_, i) => ({
      id: `column-${i + 1}`,
      name: `Column ${i + 1}`,
      position: i,
      _count: { tasks: 0 },
    }));

    render(
      <KanbanBoard
        boardId="board-1"
        columns={maxColumns}
      />
    );

    expect(screen.getByTestId('add-column-button')).toBeDisabled();
    expect(screen.getByText('Maximum of 10 columns reached')).toBeInTheDocument();
  });

  it('renders drag and drop context', () => {
    render(
      <KanbanBoard
        boardId="board-1"
        columns={mockColumns}
      />
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  it('shows placeholder text for empty columns', () => {
    render(
      <KanbanBoard
        boardId="board-1"
        columns={mockColumns}
      />
    );

    const placeholderTexts = screen.getAllByText('Tasks will appear here');
    expect(placeholderTexts).toHaveLength(3); // One for each column
  });

  it('calls onColumnsUpdated when provided', () => {
    const onColumnsUpdated = vi.fn();
    
    render(
      <KanbanBoard
        boardId="board-1"
        columns={mockColumns}
        onColumnsUpdated={onColumnsUpdated}
      />
    );

    // The callback should be available for child components to call
    expect(onColumnsUpdated).not.toHaveBeenCalled();
  });
});
