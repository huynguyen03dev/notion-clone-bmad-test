import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnHeader } from '../column-header';

// Mock the ColumnDeleteDialog component
vi.mock('../column-delete-dialog', () => ({
  ColumnDeleteDialog: ({ isOpen, onColumnDeleted }: any) =>
    isOpen ? (
      <div data-testid="delete-dialog">
        <button onClick={onColumnDeleted}>Confirm Delete</button>
      </div>
    ) : null,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockColumn = {
  id: 'column-1',
  name: 'To Do',
  color: '#3B82F6',
  position: 0,
  _count: {
    tasks: 5,
  },
};

describe('ColumnHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column name and task count', () => {
    render(<ColumnHeader column={mockColumn} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows color indicator when column has color', () => {
    render(<ColumnHeader column={mockColumn} />);

    const header = screen.getByText('To Do').closest('div')?.parentElement;
    expect(header).toHaveStyle({
      borderLeftColor: 'rgb(59, 130, 246)',
      borderLeftWidth: '4px',
    });
  });

  it('enters edit mode when column name is clicked', async () => {
    const user = userEvent.setup();
    render(<ColumnHeader column={mockColumn} />);
    
    await user.click(screen.getByText('To Do'));
    
    expect(screen.getByDisplayValue('To Do')).toBeInTheDocument();
  });

  it('saves column name on Enter key', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ column: { ...mockColumn, name: 'Updated Name' } }),
    } as Response);

    const onColumnUpdated = vi.fn();
    render(<ColumnHeader column={mockColumn} onColumnUpdated={onColumnUpdated} />);
    
    await user.click(screen.getByText('To Do'));
    const input = screen.getByDisplayValue('To Do');
    
    await user.clear(input);
    await user.type(input, 'Updated Name');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/column-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });
    });
    
    expect(onColumnUpdated).toHaveBeenCalled();
  });

  it('cancels edit on Escape key', async () => {
    const user = userEvent.setup();
    render(<ColumnHeader column={mockColumn} />);
    
    await user.click(screen.getByText('To Do'));
    const input = screen.getByDisplayValue('To Do');
    
    await user.clear(input);
    await user.type(input, 'Changed Name');
    await user.keyboard('{Escape}');
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
  });

  it('shows dropdown menu with options', async () => {
    const user = userEvent.setup();
    render(<ColumnHeader column={mockColumn} />);
    
    const menuButton = screen.getByLabelText('Column options');
    await user.click(menuButton);
    
    expect(screen.getByText('Rename Column')).toBeInTheDocument();
    expect(screen.getByText('Change Color')).toBeInTheDocument();
    expect(screen.getByText('Delete Column')).toBeInTheDocument();
  });

  it('calls onColorChange when color option is clicked', async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();
    render(<ColumnHeader column={mockColumn} onColorChange={onColorChange} />);
    
    const menuButton = screen.getByLabelText('Column options');
    await user.click(menuButton);
    await user.click(screen.getByText('Change Color'));
    
    expect(onColorChange).toHaveBeenCalledWith('column-1');
  });

  it('shows delete dialog when delete option is clicked', async () => {
    const user = userEvent.setup();
    const onColumnDeleted = vi.fn();
    render(<ColumnHeader column={mockColumn} onColumnDeleted={onColumnDeleted} />);

    const menuButton = screen.getByLabelText('Column options');
    await user.click(menuButton);
    await user.click(screen.getByText('Delete Column'));

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

    // Simulate confirming deletion
    await user.click(screen.getByText('Confirm Delete'));
    expect(onColumnDeleted).toHaveBeenCalled();
  });

  it('handles API error during name update', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Column name already exists' }),
    } as Response);

    render(<ColumnHeader column={mockColumn} />);
    
    await user.click(screen.getByText('To Do'));
    const input = screen.getByDisplayValue('To Do');
    
    await user.clear(input);
    await user.type(input, 'Duplicate Name');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Should revert to original name on error
    await waitFor(() => {
      expect(screen.getByDisplayValue('To Do')).toBeInTheDocument();
    });
  });
});
