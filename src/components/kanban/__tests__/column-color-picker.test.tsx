import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnColorPicker } from '../column-color-picker';

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
};

describe('ColumnColorPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders color picker dialog when open', () => {
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('Change Column Color')).toBeInTheDocument();
    expect(screen.getByText('Choose a color for the "To Do" column to help organize your board.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={false}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    expect(screen.queryByText('Change Column Color')).not.toBeInTheDocument();
  });

  it('displays preset colors', () => {
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('Preset Colors')).toBeInTheDocument();
    
    // Check for some preset color buttons
    const colorButtons = screen.getAllByRole('button');
    const presetColorButtons = colorButtons.filter(button => 
      button.getAttribute('aria-label')?.includes('Select') && 
      button.getAttribute('aria-label')?.includes('color')
    );
    
    expect(presetColorButtons.length).toBeGreaterThan(0);
  });

  it('allows custom color input', async () => {
    const user = userEvent.setup();
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    const customColorInput = screen.getByPlaceholderText('#3B82F6');
    await user.type(customColorInput, '#FF5733');

    expect(customColorInput).toHaveValue('#FF5733');
  });

  it('shows preview when color is selected', async () => {
    const user = userEvent.setup();
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    // Select a preset color
    const blueColorButton = screen.getByLabelText('Select Blue color');
    await user.click(blueColorButton);

    expect(screen.getAllByText('Preview')).toHaveLength(2); // Label and badge
  });

  it('saves color successfully', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ column: { ...mockColumn, color: '#10B981' } }),
    } as Response);

    const onColorUpdated = vi.fn();
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={onColorUpdated}
      />
    );

    // Select green color
    const greenColorButton = screen.getByLabelText('Select Green color');
    await user.click(greenColorButton);

    // Save color
    const saveButton = screen.getByText('Save Color');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/column-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: '#10B981',
        }),
      });
    });

    expect(onColorUpdated).toHaveBeenCalled();
  });

  it('removes color when remove button is clicked', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ column: { ...mockColumn, color: null } }),
    } as Response);

    const onColorUpdated = vi.fn();
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={onColorUpdated}
      />
    );

    // Click remove color button
    const removeButton = screen.getByText('Remove Color (Use Default)');
    await user.click(removeButton);

    // Save changes
    const saveButton = screen.getByText('Save Color');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/column-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: null,
        }),
      });
    });

    expect(onColorUpdated).toHaveBeenCalled();
  });

  it('handles API error during color update', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update color' }),
    } as Response);

    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={vi.fn()}
        onColorUpdated={vi.fn()}
      />
    );

    // Select a color and save
    const greenColorButton = screen.getByLabelText('Select Green color');
    await user.click(greenColorButton);

    const saveButton = screen.getByText('Save Color');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Dialog should still be open on error
    expect(screen.getByText('Change Column Color')).toBeInTheDocument();
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(
      <ColumnColorPicker
        column={mockColumn}
        isOpen={true}
        onClose={onClose}
        onColorUpdated={vi.fn()}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
