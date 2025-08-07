import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { DashboardContent } from '../dashboard-content';

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

const mockBoardsResponse = {
  boards: [
    {
      id: 'board-1',
      name: 'Test Board',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: mockSession.user,
      _count: { tasks: 5, columns: 3 },
    },
  ],
  total: 1,
  filters: {},
};

describe('DashboardContent - Infinite Loop Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBoardsResponse),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should only make one API call on initial load', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    render(<DashboardContent />);

    // Wait for the component to settle
    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Verify only one API call was made
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards?')
    );
  });

  it('should not make API calls during loading state', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<DashboardContent />);

    // Wait a bit to ensure no API calls are made
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify no API calls were made during loading
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle session changes without infinite loops', async () => {
    const { rerender } = render(<DashboardContent />);

    // Start with loading state
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
    });
    rerender(<DashboardContent />);

    // Change to authenticated state
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    rerender(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Should only make one API call after authentication
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should prevent duplicate API calls with circuit breaker', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const { rerender } = render(<DashboardContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Force re-render multiple times
    rerender(<DashboardContent />);
    rerender(<DashboardContent />);
    rerender(<DashboardContent />);

    // Wait a bit more
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should still only have made one API call
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should reset circuit breaker when session changes', async () => {
    const { rerender } = render(<DashboardContent />);

    // First session
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    rerender(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Change to different session
    const newSession = {
      user: {
        id: 'user-2',
        name: 'New User',
        email: 'new@example.com',
      },
    };

    vi.mocked(useSession).mockReturnValue({
      data: newSession,
      status: 'authenticated',
    });
    rerender(<DashboardContent />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Should have made exactly 2 API calls (one for each session)
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle request deduplication for simultaneous calls', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    // Mock a slow API response
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValue(slowPromise as any);

    render(<DashboardContent />);

    // Wait a bit for the component to attempt the API call
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve(mockBoardsResponse),
    });

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Should only make one API call despite potential race conditions
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors without infinite retries', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    // Mock API error
    vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load boards/i)).toBeInTheDocument();
    });

    // Should only make one API call even on error
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
