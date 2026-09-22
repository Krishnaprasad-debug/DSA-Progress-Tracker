import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalsAndReportsHub } from '../components/goals/GoalsAndReportsHub';
import { GoalList } from '../components/goals/GoalList';
import { GoalModal } from '../components/goals/GoalModal';
import { WeeklyReportView } from '../components/goals/WeeklyReportView';
import { goalService } from '../services/goalService';
import { Goal, WeeklyReport } from '../types/goal';

vi.mock('../services/goalService', () => ({
  goalService: {
    getGoals: vi.fn(),
    getGoalById: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getWeeklyReport: vi.fn(),
  },
  default: {
    getGoals: vi.fn(),
    getGoalById: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getWeeklyReport: vi.fn(),
  },
}));

const mockGoals: Goal[] = [
  {
    _id: 'goal-1',
    user: 'user-1',
    title: 'Solve 10 Problems This Week',
    description: 'Focus on medium arrays and trees',
    type: 'weekly_problems',
    targetValue: 10,
    currentValue: 6,
    progressPercentage: 60,
    deadline: '2026-09-27T23:59:59.999Z',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'goal-2',
    user: 'user-1',
    title: 'Master Dynamic Programming',
    description: 'Reach 75% topic mastery',
    type: 'topic_mastery',
    topic: 'Dynamic Programming',
    targetValue: 75,
    currentValue: 75,
    progressPercentage: 100,
    deadline: null,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockReport: WeeklyReport = {
  weekRange: {
    start: '2026-09-21',
    end: '2026-09-27',
  },
  summary: {
    problemsSolved: 6,
    totalAttempts: 10,
    solvedAttempts: 7,
    successRate: 70,
    practiceTimeMinutes: 180,
    activeDaysCount: 4,
  },
  previousWeekComparison: {
    prevProblemsSolved: 4,
    prevPracticeTimeMinutes: 120,
    prevSuccessRate: 60,
    deltaProblemsSolved: 2,
    deltaPracticeTimeMinutes: 60,
    deltaSuccessRate: 10,
    velocityTrend: 'accelerating',
  },
  dailyBreakdown: [
    { date: '2026-09-21', dayName: 'Monday', solvedCount: 2, attemptCount: 3, practiceTimeMinutes: 50 },
    { date: '2026-09-22', dayName: 'Tuesday', solvedCount: 1, attemptCount: 2, practiceTimeMinutes: 30 },
    { date: '2026-09-23', dayName: 'Wednesday', solvedCount: 0, attemptCount: 0, practiceTimeMinutes: 0 },
    { date: '2026-09-24', dayName: 'Thursday', solvedCount: 3, attemptCount: 4, practiceTimeMinutes: 80 },
    { date: '2026-09-25', dayName: 'Friday', solvedCount: 0, attemptCount: 1, practiceTimeMinutes: 20 },
    { date: '2026-09-26', dayName: 'Saturday', solvedCount: 0, attemptCount: 0, practiceTimeMinutes: 0 },
    { date: '2026-09-27', dayName: 'Sunday', solvedCount: 0, attemptCount: 0, practiceTimeMinutes: 0 },
  ],
  neglectedWeakTopics: [
    {
      topic: 'Graphs',
      masteryScore: 35,
      successRate: 30,
      attemptsThisWeek: 0,
      recommendation: 'High Priority: You have not practiced Graphs this week. Dedicate your next session to foundational Easy problems.',
    },
  ],
  activeGoals: [mockGoals[0]],
};

describe('Personal Goals & Weekly Reports Frontend Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GoalsAndReportsHub', () => {
    it('loads and renders goals list by default with active badge count', async () => {
      vi.mocked(goalService.getGoals).mockResolvedValue({
        count: mockGoals.length,
        goals: mockGoals,
      });

      render(<GoalsAndReportsHub />);

      await waitFor(() => {
        expect(screen.getByText('Solve 10 Problems This Week')).toBeInTheDocument();
      });

      expect(screen.getByText('Master Dynamic Programming')).toBeInTheDocument();
      expect(screen.getByText('Personal Goals')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
    });

    it('switches to weekly performance report view on tab click', async () => {
      vi.mocked(goalService.getGoals).mockResolvedValue({
        count: mockGoals.length,
        goals: mockGoals,
      });
      vi.mocked(goalService.getWeeklyReport).mockResolvedValue(mockReport);

      render(<GoalsAndReportsHub />);

      await waitFor(() => {
        expect(screen.getByText('Personal Goals')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /weekly report/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Weekly Performance & Velocity Report/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/Calendar Week: 2026-09-21 to 2026-09-27/i)).toBeInTheDocument();
    });
  });

  describe('GoalList', () => {
    it('filters goals by active and completed tabs', () => {
      const handleOpen = vi.fn();
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleToggle = vi.fn();

      render(
        <GoalList
          goals={mockGoals}
          onOpenCreateModal={handleOpen}
          onEditGoal={handleEdit}
          onDeleteGoal={handleDelete}
          onToggleGoalStatus={handleToggle}
        />
      );

      expect(screen.getByText('Solve 10 Problems This Week')).toBeInTheDocument();
      expect(screen.getByText('Master Dynamic Programming')).toBeInTheDocument();

      // Click "Active" tab filter
      fireEvent.click(screen.getByRole('button', { name: /active \(1\)/i }));
      expect(screen.getByText('Solve 10 Problems This Week')).toBeInTheDocument();
      expect(screen.queryByText('Master Dynamic Programming')).not.toBeInTheDocument();

      // Click "Completed" tab filter
      fireEvent.click(screen.getByRole('button', { name: /completed \(1\)/i }));
      expect(screen.queryByText('Solve 10 Problems This Week')).not.toBeInTheDocument();
      expect(screen.getByText('Master Dynamic Programming')).toBeInTheDocument();
    });

    it('invokes callback when Mark Complete is clicked on active goal', () => {
      const handleToggle = vi.fn();
      render(
        <GoalList
          goals={[mockGoals[0]]}
          onOpenCreateModal={vi.fn()}
          onEditGoal={vi.fn()}
          onDeleteGoal={vi.fn()}
          onToggleGoalStatus={handleToggle}
        />
      );

      const completeBtn = screen.getByRole('button', { name: /mark complete/i });
      fireEvent.click(completeBtn);
      expect(handleToggle).toHaveBeenCalledWith(mockGoals[0], 'completed');
    });
  });

  describe('GoalModal', () => {
    it('applies quick template on template button click', () => {
      const handleSubmit = vi.fn();
      render(
        <GoalModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
          initialGoal={null}
        />
      );

      const templateBtn = screen.getByRole('button', { name: /5 hours practice/i });
      fireEvent.click(templateBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\., Solve 10 problems this week/i);
      expect((titleInput as HTMLInputElement).value).toBe('Practice 300 Minutes This Week');
    });

    it('submits form with entered goal details', async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <GoalModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          initialGoal={null}
        />
      );

      const titleInput = screen.getByPlaceholderText(/e\.g\., Solve 10 problems this week/i);
      fireEvent.change(titleInput, { target: { value: 'Solve 15 Hard Problems' } });

      const submitBtn = screen.getByRole('button', { name: /create goal/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Solve 15 Hard Problems',
            type: 'weekly_problems',
          })
        );
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('WeeklyReportView', () => {
    it('renders velocity metrics and comparisons', async () => {
      vi.mocked(goalService.getWeeklyReport).mockResolvedValue(mockReport);

      render(<WeeklyReportView />);

      await waitFor(() => {
        expect(screen.getByText('Problems Solved')).toBeInTheDocument();
      });

      // 6 solved, +2 vs last week
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();

      // Velocity trend badge
      expect(screen.getByText('Accelerating')).toBeInTheDocument();

      // Practice time: 180m = 3h 0m
      expect(screen.getByText('3h 0m')).toBeInTheDocument();
      expect(screen.getByText('+60m')).toBeInTheDocument();

      // 7-day breakdown bars
      expect(screen.getByTestId('daily-breakdown-Monday')).toBeInTheDocument();
      expect(screen.getByTestId('daily-breakdown-Sunday')).toBeInTheDocument();

      // Neglected weak topic diagnostic card
      expect(screen.getByTestId('neglected-topic-Graphs')).toBeInTheDocument();
      expect(screen.getByText(/You have not practiced Graphs this week/i)).toBeInTheDocument();
    });

    it('renders affirmative message when no weak topics are neglected', async () => {
      const healthyReport: WeeklyReport = {
        ...mockReport,
        neglectedWeakTopics: [],
      };
      vi.mocked(goalService.getWeeklyReport).mockResolvedValue(healthyReport);

      render(<WeeklyReportView />);

      await waitFor(() => {
        expect(
          screen.getByText(/All Weak Topics Received Attention!/i)
        ).toBeInTheDocument();
      });
    });
  });
});
