import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentsHub } from '../components/assessments/AssessmentsHub';
import { AssessmentList } from '../components/assessments/AssessmentList';
import { AssessmentModal } from '../components/assessments/AssessmentModal';
import { AssessmentLiveSession } from '../components/assessments/AssessmentLiveSession';
import { AssessmentScorecardModal } from '../components/assessments/AssessmentScorecardModal';
import { assessmentService } from '../services/assessmentService';
import { problemService } from '../services/problemService';
import { Assessment } from '../types/assessment';
import { Problem } from '../types/problem';

vi.mock('../services/assessmentService', () => ({
  assessmentService: {
    getAssessments: vi.fn(),
    getAssessmentById: vi.fn(),
    createAssessment: vi.fn(),
    startAssessment: vi.fn(),
    submitAttempt: vi.fn(),
    finishAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
  },
  default: {
    getAssessments: vi.fn(),
    getAssessmentById: vi.fn(),
    createAssessment: vi.fn(),
    startAssessment: vi.fn(),
    submitAttempt: vi.fn(),
    finishAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
  },
}));

vi.mock('../services/problemService', () => ({
  problemService: {
    getProblems: vi.fn(),
  },
  default: {
    getProblems: vi.fn(),
  },
}));

const mockProblem1: Problem = {
  _id: 'prob-1',
  user: 'user-1',
  title: 'Two Sum',
  description: 'Find two indices that sum up to target',
  topic: 'Arrays',
  difficulty: 'Easy',
  platform: 'LeetCode',
  problemUrl: 'https://leetcode.com/problems/two-sum',
  status: 'Solved',
  notes: 'Hash map solution',
  tags: ['array', 'hash'],
  estimatedTimeMinutes: 15,
  lastPracticedAt: '2026-09-20T00:00:00Z',
  createdAt: '2026-09-20T00:00:00Z',
  updatedAt: '2026-09-20T00:00:00Z',
};

const mockProblem2: Problem = {
  _id: 'prob-2',
  user: 'user-1',
  title: 'Coin Change',
  description: 'Minimum coins needed for amount',
  topic: 'Dynamic Programming',
  difficulty: 'Medium',
  platform: 'LeetCode',
  problemUrl: 'https://leetcode.com/problems/coin-change',
  status: 'Attempted',
  notes: 'DP bottom-up',
  tags: ['dp'],
  estimatedTimeMinutes: 30,
  lastPracticedAt: null,
  createdAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
};

const mockProblem3: Problem = {
  _id: 'prob-3',
  user: 'user-1',
  title: 'Trapping Rain Water',
  description: 'Calculate trapped water between bars',
  topic: 'Arrays',
  difficulty: 'Hard',
  platform: 'LeetCode',
  problemUrl: 'https://leetcode.com/problems/trapping-rain-water',
  status: 'Not Started',
  notes: 'Two pointers approach',
  tags: ['two-pointer', 'hard'],
  estimatedTimeMinutes: 45,
  lastPracticedAt: null,
  createdAt: '2026-09-22T00:00:00Z',
  updatedAt: '2026-09-22T00:00:00Z',
};

const mockAssessments: Assessment[] = [
  {
    _id: 'assess-1',
    user: 'user-1',
    title: 'Google Technical Mock Interview',
    description: 'Timed round for Google L4 candidate',
    durationMinutes: 60,
    status: 'in_progress',
    problems: [
      {
        _id: 'sub-1',
        problem: mockProblem1,
        pointWeight: 20,
        status: 'solved',
        attempts: 1,
        timeTakenMinutes: 12,
        solvedAt: '2026-09-24T08:15:00Z',
      },
      {
        _id: 'sub-2',
        problem: mockProblem2,
        pointWeight: 40,
        status: 'unsolved',
        attempts: 0,
        timeTakenMinutes: 0,
        solvedAt: null,
      },
    ],
    startTime: '2026-09-24T08:00:00Z',
    endTime: null,
    score: 20,
    maxScore: 60,
    timeSpentMinutes: 12,
    verdict: 'pending',
    createdAt: '2026-09-24T08:00:00Z',
    updatedAt: '2026-09-24T08:15:00Z',
  },
  {
    _id: 'assess-2',
    user: 'user-1',
    title: 'Meta Staff Mock Contest',
    description: 'High velocity contest with early bonus',
    durationMinutes: 60,
    status: 'completed',
    problems: [
      {
        _id: 'sub-3',
        problem: mockProblem1,
        pointWeight: 20,
        status: 'solved',
        attempts: 1,
        timeTakenMinutes: 8,
        solvedAt: '2026-09-23T10:08:00Z',
      },
      {
        _id: 'sub-4',
        problem: mockProblem2,
        pointWeight: 40,
        status: 'solved',
        attempts: 1,
        timeTakenMinutes: 20,
        solvedAt: '2026-09-23T10:28:00Z',
      },
      {
        _id: 'sub-5',
        problem: mockProblem3,
        pointWeight: 60,
        status: 'solved',
        attempts: 1,
        timeTakenMinutes: 15,
        solvedAt: '2026-09-23T10:43:00Z',
      },
    ],
    startTime: '2026-09-23T10:00:00Z',
    endTime: '2026-09-23T10:43:00Z',
    score: 135, // 120 + 15 early bonus
    maxScore: 120,
    timeSpentMinutes: 43,
    verdict: 'strong_hire',
    createdAt: '2026-09-23T10:00:00Z',
    updatedAt: '2026-09-23T10:43:00Z',
  },
];

describe('Assessment Engine & Mock Interview Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  describe('AssessmentList Component', () => {
    it('renders list of assessments with correct titles and statuses', () => {
      render(
        <AssessmentList
          assessments={mockAssessments}
          onOpenCreateModal={vi.fn()}
          onStartAssessment={vi.fn()}
          onViewScorecard={vi.fn()}
          onDeleteAssessment={vi.fn()}
        />
      );

      expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
      expect(screen.getByText('Meta Staff Mock Contest')).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Strong Hire/i)).toBeInTheDocument();
    });

    it('filters assessments by Active and Completed', () => {
      render(
        <AssessmentList
          assessments={mockAssessments}
          onOpenCreateModal={vi.fn()}
          onStartAssessment={vi.fn()}
          onViewScorecard={vi.fn()}
          onDeleteAssessment={vi.fn()}
        />
      );

      // Initially shows All (2)
      expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
      expect(screen.getByText('Meta Staff Mock Contest')).toBeInTheDocument();

      // Click Completed filter
      const completedBtn = screen.getByRole('button', { name: /Completed \(1\)/i });
      fireEvent.click(completedBtn);

      expect(screen.queryByText('Google Technical Mock Interview')).not.toBeInTheDocument();
      expect(screen.getByText('Meta Staff Mock Contest')).toBeInTheDocument();

      // Click Active filter
      const activeBtn = screen.getByRole('button', { name: /Active & Configured \(1\)/i });
      fireEvent.click(activeBtn);

      expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
      expect(screen.queryByText('Meta Staff Mock Contest')).not.toBeInTheDocument();
    });

    it('calls onOpenCreateModal when clicking New Mock Interview button', () => {
      const handleOpen = vi.fn();
      render(
        <AssessmentList
          assessments={mockAssessments}
          onOpenCreateModal={handleOpen}
          onStartAssessment={vi.fn()}
          onViewScorecard={vi.fn()}
          onDeleteAssessment={vi.fn()}
        />
      );

      const createBtn = screen.getByRole('button', { name: /New Mock Interview/i });
      fireEvent.click(createBtn);
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });

    it('triggers onStartAssessment and onViewScorecard', () => {
      const handleStart = vi.fn();
      const handleScorecard = vi.fn();

      render(
        <AssessmentList
          assessments={mockAssessments}
          onOpenCreateModal={vi.fn()}
          onStartAssessment={handleStart}
          onViewScorecard={handleScorecard}
          onDeleteAssessment={vi.fn()}
        />
      );

      // Assessment 1 is in_progress -> has Resume Live Contest button
      const resumeBtn = screen.getByRole('button', { name: /Resume Live Contest/i });
      fireEvent.click(resumeBtn);
      expect(handleStart).toHaveBeenCalledWith('assess-1');

      // Assessment 2 is completed -> has View Scorecard button
      const scorecardBtn = screen.getByRole('button', { name: /View Scorecard/i });
      fireEvent.click(scorecardBtn);
      expect(handleScorecard).toHaveBeenCalledWith(mockAssessments[1]);
    });

    it('handles delete confirmation and call', async () => {
      const handleDelete = vi.fn();
      render(
        <AssessmentList
          assessments={mockAssessments}
          onOpenCreateModal={vi.fn()}
          onStartAssessment={vi.fn()}
          onViewScorecard={vi.fn()}
          onDeleteAssessment={handleDelete}
        />
      );

      const deleteBtns = screen.getAllByTitle(/Delete Assessment/i);
      fireEvent.click(deleteBtns[0]);
      expect(handleDelete).toHaveBeenCalledWith('assess-1');
    });
  });

  describe('AssessmentModal Component', () => {
    it('fetches problems and renders selection list when opened', async () => {
      vi.mocked(problemService.getProblems).mockResolvedValue({
        count: 3,
        problems: [mockProblem1, mockProblem2, mockProblem3],
      });

      render(<AssessmentModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('Coin Change')).toBeInTheDocument();
        expect(screen.getByText('Trapping Rain Water')).toBeInTheDocument();
      });
    });

    it('applies FAANG Sprint preset and submits correctly', async () => {
      vi.mocked(problemService.getProblems).mockResolvedValue({
        count: 3,
        problems: [mockProblem1, mockProblem2, mockProblem3],
      });
      const handleSubmit = vi.fn().mockResolvedValue(undefined);

      render(<AssessmentModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
      });

      // Click preset
      const presetBtn = screen.getByRole('button', { name: /FAANG Sprint/i });
      fireEvent.click(presetBtn);

      const titleInput = screen.getByDisplayValue('FAANG 60-min Sprint Contest');
      expect(titleInput).toBeInTheDocument();

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /Create Contest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'FAANG 60-min Sprint Contest',
            durationMinutes: 60,
            problemIds: expect.arrayContaining(['prob-1', 'prob-2', 'prob-3']),
          })
        );
      });
    });
  });

  describe('AssessmentLiveSession Component', () => {
    it('loads assessment session and displays timer clock and problems', async () => {
      vi.mocked(assessmentService.getAssessmentById).mockResolvedValue({
        assessment: mockAssessments[0],
        remainingSeconds: 2880, // 48 mins
      });

      render(
        <AssessmentLiveSession
          assessmentId="assess-1"
          onFinish={vi.fn()}
          onExit={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
        expect(screen.getByText('48:00')).toBeInTheDocument();
        expect(screen.getByText(/Find two indices that sum up to target/i)).toBeInTheDocument();
      });
    });

    it('submits attempt for active problem', async () => {
      vi.mocked(assessmentService.getAssessmentById).mockResolvedValue({
        assessment: mockAssessments[0],
        remainingSeconds: 2880,
      });

      const updatedAssessment = { ...mockAssessments[0], score: 60 };
      vi.mocked(assessmentService.submitAttempt).mockResolvedValue({
        message: 'Attempt logged',
        assessment: updatedAssessment,
      });

      render(
        <AssessmentLiveSession
          assessmentId="assess-1"
          onFinish={vi.fn()}
          onExit={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
      });

      const submitAttemptBtn = screen.getByRole('button', { name: /Record Attempt/i });
      fireEvent.click(submitAttemptBtn);

      await waitFor(() => {
        expect(assessmentService.submitAttempt).toHaveBeenCalledWith(
          'assess-1',
          expect.objectContaining({
            problemId: 'prob-1',
            result: 'Solved',
          })
        );
      });
    });

    it('finishes assessment and invokes onFinish', async () => {
      vi.mocked(assessmentService.getAssessmentById).mockResolvedValue({
        assessment: mockAssessments[0],
        remainingSeconds: 2880,
      });

      const finishedAssessment: Assessment = {
        ...mockAssessments[0],
        status: 'completed',
        verdict: 'hire',
      };
      vi.mocked(assessmentService.finishAssessment).mockResolvedValue({
        message: 'Contest completed',
        assessment: finishedAssessment,
      });

      const handleFinish = vi.fn();
      render(
        <AssessmentLiveSession
          assessmentId="assess-1"
          onFinish={handleFinish}
          onExit={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
      });

      const finishBtn = screen.getByRole('button', { name: /Finish Contest/i });
      fireEvent.click(finishBtn);

      await waitFor(() => {
        expect(assessmentService.finishAssessment).toHaveBeenCalledWith('assess-1');
        expect(handleFinish).toHaveBeenCalledWith(finishedAssessment);
      });
    });
  });

  describe('AssessmentScorecardModal Component', () => {
    it('displays verdict details, scores, and problem breakdown', () => {
      const handleClose = vi.fn();
      render(
        <AssessmentScorecardModal
          isOpen={true}
          onClose={handleClose}
          assessment={mockAssessments[1]}
        />
      );

      expect(screen.getAllByText('Strong Hire').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('135')).toBeInTheDocument();
      expect(screen.getByText(/\/ 120 pts/i)).toBeInTheDocument();
      expect(screen.getByText('Meta Staff Mock Contest')).toBeInTheDocument();
      expect(screen.getByText('Trapping Rain Water')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close Scorecard/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when closed or null', () => {
      const { container } = render(
        <AssessmentScorecardModal isOpen={false} onClose={vi.fn()} assessment={mockAssessments[1]} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('AssessmentsHub Component', () => {
    it('fetches assessments on mount and renders list', async () => {
      vi.mocked(assessmentService.getAssessments).mockResolvedValue({
        count: 2,
        assessments: mockAssessments,
      });

      render(<AssessmentsHub />);

      expect(screen.getByText(/Loading mock interview assessments.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Assessment Engine & Mock Interview Contests')).toBeInTheDocument();
        expect(screen.getByText('Google Technical Mock Interview')).toBeInTheDocument();
        expect(screen.getByText('Meta Staff Mock Contest')).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      vi.mocked(assessmentService.getAssessments).mockRejectedValue(new Error('Network error'));

      render(<AssessmentsHub />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load mock interview assessments.')).toBeInTheDocument();
      });
    });
  });
});
