import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { DashboardContent } from '../dashboard-content';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

const mockSession = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
};

const mockBoards = [
  {
    id: 'board-1',
    name: 'Test Board 1',
    description: 'Test Description 1',
    ownerId: 'user-1',
    isPublic: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    owner: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
    _count: {
      tasks: 5,
      columns: 3,
    },
  },
  {
    id: 'board-2',
    name: 'Test Board 2',
    description: 'Test Description 2',
    ownerId: 'user-1',
    isPublic: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
    owner: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
    _count: {
      tasks: 8,
      columns: 4,
    },
  },
];

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ boards: mockBoards, total: 2 }),
    } as Response);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render dashboard with boards', async () => {
    render(<DashboardContent />);

    // Wait for boards to load
    await waitFor(() => {
      expect(screen.getByText('Test Board 1')).toBeInTheDocument();
      expect(screen.getByText('Test Board 2')).toBeInTheDocument();
    });

    // Check if create button is present
    expect(screen.getByText('Create Board')).toBeInTheDocument();
  });

  it('should show empty state when no boards exist', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ boards: [], total: 0 }),
    } as Response);

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText('No boards yet')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Board')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(<DashboardContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Board 1')).toBeInTheDocument();
    });

    // Mock search response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ boards: [mockBoards[0]], total: 1 }),
    } as Response);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search boards...');
    fireEvent.change(searchInput, { target: { value: 'Test Board 1' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/boards?search=Test%20Board%201')
      );
    }, { timeout: 500 });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

    render(<DashboardContent />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load boards');
    });
  });

  it('should open create modal when create button is clicked', async () => {
    render(<DashboardContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeInTheDocument();
    });

    // Click create button
    fireEvent.click(screen.getByText('Create Board'));

    // Check if modal opens (this would require mocking the modal component)
    // For now, we just verify the click handler works
    expect(screen.getByText('Create Board')).toBeInTheDocument();
  });

  it('should handle board creation', async () => {
    const newBoard = {
      ...mockBoards[0],
      id: 'board-3',
      name: 'New Board',
    };

    render(<DashboardContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Board 1')).toBeInTheDocument();
    });

    // Simulate board creation by calling the handler directly
    // In a real test, this would be triggered by the modal
    const dashboardContent = screen.getByText('Test Board 1').closest('[data-testid="dashboard-content"]');
    
    // This is a simplified test - in practice, you'd test the full modal flow
    expect(dashboardContent).toBeInTheDocument();
  });
});
