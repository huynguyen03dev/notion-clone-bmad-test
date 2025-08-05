import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickTaskModal } from '../quick-task-modal';

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
    const field = { onChange: vi.fn(), value: name === 'priority' ? TaskPriority.MEDIUM : '' };
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

describe('QuickTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateTask = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreateTask: mockOnCreateTask,
    columnId: 'column-1',
    boardId: 'board-1',
    columnName: 'To Do',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<QuickTaskModal {...defaultProps} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('in To Do')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<QuickTaskModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders without column name', () => {
    render(<QuickTaskModal {...defaultProps} columnName={undefined} />);

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.queryByText('in To Do')).not.toBeInTheDocument();
  });

  it('has form fields for task creation', () => {
    render(<QuickTaskModal {...defaultProps} />);

    expect(screen.getByText('Task Title')).toBeInTheDocument();
    expect(screen.getByText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('has create and cancel buttons', () => {
    render(<QuickTaskModal {...defaultProps} />);

    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<QuickTaskModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onCreateTask when form is submitted with valid data', async () => {
    mockOnCreateTask.mockResolvedValue(undefined);

    render(<QuickTaskModal {...defaultProps} />);

    // Fill in the title field
    const titleInput = screen.getByPlaceholderText('Enter task title...');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Submit the form
    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnCreateTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: '',
        priority: TaskPriority.MEDIUM,
        columnId: 'column-1',
        boardId: 'board-1',
      });
    });
  });

  it('shows creating state when submitting', async () => {
    // Mock a delayed response
    mockOnCreateTask.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<QuickTaskModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Enter task title...');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    // Should show creating state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  });

  it('closes modal after successful task creation', async () => {
    mockOnCreateTask.mockResolvedValue(undefined);

    render(<QuickTaskModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Enter task title...');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles task creation error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnCreateTask.mockRejectedValue(new Error('Creation failed'));

    render(<QuickTaskModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Enter task title...');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task:', expect.any(Error));
    });

    // Should not close modal on error
    expect(mockOnClose).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('disables form when isLoading is true', () => {
    render(<QuickTaskModal {...defaultProps} isLoading={true} />);

    const createButton = screen.getByText('Create Task');
    expect(createButton).toBeDisabled();
  });

  it('focuses title input when opened', () => {
    render(<QuickTaskModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Enter task title...');
    expect(titleInput).toHaveAttribute('autoFocus');
  });

  it('includes description in task creation when provided', async () => {
    mockOnCreateTask.mockResolvedValue(undefined);

    render(<QuickTaskModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Enter task title...');
    const descriptionInput = screen.getByPlaceholderText('Enter task description...');

    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'Task description' } });

    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnCreateTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.MEDIUM,
        columnId: 'column-1',
        boardId: 'board-1',
      });
    });
  });
});
