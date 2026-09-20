import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttemptModal } from '../components/attempts/AttemptModal';
import { AttemptHistoryModal } from '../components/attempts/AttemptHistoryModal';
import { attemptService } from '../services/attemptService';
import { Problem } from '../types/problem';

vi.mock('../services/attemptService', () => ({
  attemptService: {
    createAttempt: vi.fn(),
    getProblemAttempts: vi.fn(),
  },
}));

const mockProblem: Problem = {
  _id: 'problem-123',
  user: 'user-1',
  title: 'Binary Tree Level Order Traversal',
  description: 'Traverse binary tree level by level',
  topic: 'Trees',
  difficulty: 'Medium',
  platform: 'LeetCode',
  problemUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
  status: 'Attempted',
  notes: 'Queue BFS approach',
  tags: ['Tree', 'BFS'],
  estimatedTimeMinutes: 30,
  lastPracticedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Attempt Tracking Component Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AttemptModal', () => {
    it('renders problem title and practice form controls', () => {
      render(
        <AttemptModal
          isOpen={true}
          onClose={vi.fn()}
          problem={mockProblem}
          onAttemptLogged={vi.fn()}
        />
      );

      expect(screen.getByText('Log Practice Attempt')).toBeInTheDocument();
      expect(
        screen.getByText('Binary Tree Level Order Traversal')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /solved/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/time taken/i)).toHaveValue(30);
    });

    it('submits a logged attempt and triggers callback', async () => {
      const handleAttemptLogged = vi.fn();
      const handleClose = vi.fn();

      vi.mocked(attemptService.createAttempt).mockResolvedValue({
        message: 'Attempt logged successfully',
        attempt: {
          _id: 'attempt-1',
          problem: mockProblem._id,
          user: 'user-1',
          attemptNumber: 1,
          result: 'Solved',
          timeTakenMinutes: 45,
          notes: 'Queue BFS worked cleanly',
          attemptedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        problemStatus: 'Solved',
        struggleStatus: { isStruggle: false, reasons: [] },
      });

      render(
        <AttemptModal
          isOpen={true}
          onClose={handleClose}
          problem={mockProblem}
          onAttemptLogged={handleAttemptLogged}
        />
      );

      // Click 45m preset
      fireEvent.click(screen.getByRole('button', { name: '45m' }));
      expect(screen.getByLabelText(/time taken/i)).toHaveValue(45);

      // Add notes
      const notesInput = screen.getByPlaceholderText(/what approach did you take/i);
      fireEvent.change(notesInput, {
        target: { value: 'Queue BFS worked cleanly' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /save attempt/i }));

      await waitFor(() => {
        expect(attemptService.createAttempt).toHaveBeenCalledWith(
          mockProblem._id,
          {
            result: 'Solved',
            timeTakenMinutes: 45,
            notes: 'Queue BFS worked cleanly',
          }
        );
        expect(handleAttemptLogged).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('shows error banner when attempt submission fails', async () => {
      vi.mocked(attemptService.createAttempt).mockRejectedValue({
        response: { data: { error: 'Failed to record attempt' } },
      });

      render(
        <AttemptModal
          isOpen={true}
          onClose={vi.fn()}
          problem={mockProblem}
          onAttemptLogged={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save attempt/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to record attempt')).toBeInTheDocument();
      });
    });
  });

  describe('AttemptHistoryModal', () => {
    it('renders attempt history and struggle warning banner when struggle is detected', async () => {
      vi.mocked(attemptService.getProblemAttempts).mockResolvedValue({
        attempts: [
          {
            _id: 'att-3',
            problem: mockProblem._id,
            user: 'user-1',
            attemptNumber: 3,
            result: 'Failed',
            timeTakenMinutes: 45,
            notes: 'Stuck on null pointer in edge case',
            attemptedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'att-2',
            problem: mockProblem._id,
            user: 'user-1',
            attemptNumber: 2,
            result: 'Failed',
            timeTakenMinutes: 30,
            notes: 'Stack overflow',
            attemptedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'att-1',
            problem: mockProblem._id,
            user: 'user-1',
            attemptNumber: 1,
            result: 'Failed',
            timeTakenMinutes: 25,
            notes: 'Time limit exceeded',
            attemptedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        struggleStatus: {
          isStruggle: true,
          reasons: ['Problem has 3 failed attempts (threshold: 3).'],
        },
        problem: {
          _id: mockProblem._id,
          title: mockProblem.title,
          topic: mockProblem.topic,
          difficulty: mockProblem.difficulty,
          status: 'Attempted',
          lastPracticedAt: new Date().toISOString(),
        },
      });

      render(
        <AttemptHistoryModal
          isOpen={true}
          onClose={vi.fn()}
          problem={mockProblem}
          onOpenLogAttempt={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('struggle-warning-banner')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/struggle detected for this problem/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/problem has 3 failed attempts/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Total Attempts: 3')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
        expect(
          screen.getByText('Stuck on null pointer in edge case')
        ).toBeInTheDocument();
      });
    });

    it('renders empty state when no attempts have been logged', async () => {
      vi.mocked(attemptService.getProblemAttempts).mockResolvedValue({
        attempts: [],
        struggleStatus: { isStruggle: false, reasons: [] },
        problem: {
          _id: mockProblem._id,
          title: mockProblem.title,
          topic: mockProblem.topic,
          difficulty: mockProblem.difficulty,
          status: 'Not Started',
          lastPracticedAt: null,
        },
      });

      render(
        <AttemptHistoryModal
          isOpen={true}
          onClose={vi.fn()}
          problem={mockProblem}
          onOpenLogAttempt={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No Attempts Logged Yet')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /log first attempt/i })
        ).toBeInTheDocument();
      });
    });
  });
});
