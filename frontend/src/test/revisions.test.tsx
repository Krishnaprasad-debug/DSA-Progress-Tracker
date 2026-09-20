import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RevisionDueBanner } from '../components/revisions/RevisionDueBanner';
import { RevisionList } from '../components/revisions/RevisionList';
import { revisionService } from '../services/revisionService';
import { Revision } from '../types/revision';

vi.mock('../services/revisionService', () => ({
  revisionService: {
    getRevisionsDueToday: vi.fn(),
    getAllRevisions: vi.fn(),
    completeRevision: vi.fn(),
    createRevision: vi.fn(),
  },
  default: {
    getRevisionsDueToday: vi.fn(),
    getAllRevisions: vi.fn(),
    completeRevision: vi.fn(),
    createRevision: vi.fn(),
  },
}));

const mockRevisions: Revision[] = [
  {
    _id: 'rev-1',
    user: 'user-1',
    problem: {
      _id: 'prob-1',
      user: 'user-1',
      title: 'Merge Two Sorted Lists',
      description: 'Merge two sorted linked lists',
      topic: 'Linked List',
      difficulty: 'Easy',
      platform: 'LeetCode',
      problemUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
      status: 'Solved',
      notes: '',
      tags: [],
      estimatedTimeMinutes: 15,
      lastPracticedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    intervalDays: 1,
    scheduledDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (due today)
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'rev-2',
    user: 'user-1',
    problem: {
      _id: 'prob-2',
      user: 'user-1',
      title: 'Course Schedule',
      description: 'Topological sort graph cycle detection',
      topic: 'Graphs',
      difficulty: 'Medium',
      platform: 'LeetCode',
      problemUrl: 'https://leetcode.com/problems/course-schedule/',
      status: 'Solved',
      notes: '',
      tags: [],
      estimatedTimeMinutes: 35,
      lastPracticedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    intervalDays: 7,
    scheduledDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString(), // 5 days in future (upcoming)
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Spaced Revision Component Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RevisionDueBanner', () => {
    it('renders banner with pending count and invokes callback on click', () => {
      const handleNavigate = vi.fn();
      render(
        <RevisionDueBanner dueCount={3} onNavigateToRevisions={handleNavigate} />
      );

      expect(screen.getByTestId('revision-due-banner')).toBeInTheDocument();
      expect(screen.getByText(/3 pending/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /review now/i }));
      expect(handleNavigate).toHaveBeenCalled();
    });

    it('renders nothing when dueCount is 0', () => {
      const { container } = render(
        <RevisionDueBanner dueCount={0} onNavigateToRevisions={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('RevisionList', () => {
    it('renders revisions due today with interval pills and handles 1-click completion', async () => {
      vi.mocked(revisionService.getRevisionsDueToday).mockResolvedValue({
        count: 1,
        revisions: [mockRevisions[0]],
      });

      vi.mocked(revisionService.getAllRevisions).mockResolvedValue({
        count: 2,
        revisions: mockRevisions,
      });

      vi.mocked(revisionService.completeRevision).mockResolvedValue({
        message: 'Revision completed! Next revision scheduled in 7 days.',
        completedRevision: {
          ...mockRevisions[0],
          completed: true,
          completedAt: new Date().toISOString(),
        },
        nextRevision: {
          ...mockRevisions[0],
          _id: 'rev-next',
          intervalDays: 7,
          scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
        mastered: false,
      });

      render(<RevisionList onRevisionCountChanged={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Merge Two Sorted Lists')).toBeInTheDocument();
        expect(screen.getByText('1d Interval')).toBeInTheDocument();
        expect(screen.getByText('Linked List')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /mark reviewed/i })
        ).toBeInTheDocument();
      });

      // Click Mark Reviewed
      fireEvent.click(screen.getByRole('button', { name: /mark reviewed/i }));

      await waitFor(() => {
        expect(revisionService.completeRevision).toHaveBeenCalledWith('rev-1');
        expect(
          screen.getByText(/next revision scheduled in 7 days/i)
        ).toBeInTheDocument();
      });
    });

    it('renders empty state when zero revisions are due today', async () => {
      vi.mocked(revisionService.getRevisionsDueToday).mockResolvedValue({
        count: 0,
        revisions: [],
      });

      vi.mocked(revisionService.getAllRevisions).mockResolvedValue({
        count: 0,
        revisions: [],
      });

      render(<RevisionList />);

      await waitFor(() => {
        expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
        expect(
          screen.getByText(/you have no revisions due today/i)
        ).toBeInTheDocument();
      });
    });
  });
});
