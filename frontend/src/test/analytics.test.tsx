import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { analyticsService } from '../services/analyticsService';
import {
  DashboardAnalytics,
  TopicAnalyticsResponse,
  StreakAnalytics,
} from '../types/analytics';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getDashboardAnalytics: vi.fn(),
    getTopicAnalytics: vi.fn(),
    getStreakAnalytics: vi.fn(),
  },
  default: {
    getDashboardAnalytics: vi.fn(),
    getTopicAnalytics: vi.fn(),
    getStreakAnalytics: vi.fn(),
  },
}));

const mockDashboard: DashboardAnalytics = {
  totalProblems: 25,
  totalSolved: 15,
  totalAttempted: 18,
  totalMastered: 3,
  byDifficulty: {
    Easy: { total: 10, solved: 8 },
    Medium: { total: 12, solved: 6 },
    Hard: { total: 3, solved: 1 },
  },
  totalAttempts: 24,
  totalSolvedAttempts: 18,
  overallSuccessRate: 75,
  totalPracticeTimeMinutes: 165, // 2h 45m
  currentStreak: 5,
  longestStreak: 12,
  activeToday: true,
  weakTopicsCount: 1,
  recentActivity: [
    {
      _id: 'act-1',
      problemTitle: 'Two Sum',
      topic: 'Arrays',
      difficulty: 'Easy',
      result: 'Solved',
      timeTakenMinutes: 15,
      attemptedAt: new Date().toISOString(),
    },
  ],
};

const mockTopicResponse: TopicAnalyticsResponse = {
  count: 3,
  topics: [
    {
      topic: 'Arrays',
      totalProblems: 8,
      solvedCount: 6,
      attemptCount: 10,
      successfulAttempts: 8,
      successRate: 80,
      masteryScore: 82,
      volumeScore: 40,
      difficultyWeight: 22,
      isWeak: false,
      weakReasons: [],
    },
    {
      topic: 'Dynamic Programming',
      totalProblems: 5,
      solvedCount: 1,
      attemptCount: 6,
      successfulAttempts: 2,
      successRate: 33,
      masteryScore: 35,
      volumeScore: 7,
      difficultyWeight: 15,
      isWeak: true,
      weakReasons: [
        'Success rate 33% is below 50% threshold with 6 attempts',
        'Mastery score 35% is below 50% threshold',
      ],
    },
    {
      topic: 'Trees',
      totalProblems: 6,
      solvedCount: 4,
      attemptCount: 5,
      successfulAttempts: 4,
      successRate: 80,
      masteryScore: 65,
      volumeScore: 27,
      difficultyWeight: 20,
      isWeak: false,
      weakReasons: [],
    },
  ],
};

const mockStreak: StreakAnalytics = {
  currentStreak: 5,
  longestStreak: 12,
  activeToday: true,
  history: {
    [new Date().toISOString().split('T')[0]]: 3,
  },
};

describe('AnalyticsDashboard Component Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially while fetching data', () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockReturnValue(
      new Promise(() => {}) // never resolves
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockReturnValue(
      new Promise(() => {})
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockReturnValue(
      new Promise(() => {})
    );

    render(<AnalyticsDashboard />);

    expect(
      screen.getByText(/Computing learning analytics & topic mastery/i)
    ).toBeInTheDocument();
  });

  it('renders error state when API request fails and allows retry', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockRejectedValueOnce(
      new Error('Network error')
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValueOnce(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValueOnce(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load analytics/i)
      ).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // Now mock success for retry
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValueOnce(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValueOnce(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValueOnce(
      mockStreak
    );

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Learning Analytics & Mastery Engine/i)
      ).toBeInTheDocument();
    });
  });

  it('renders KPI metrics cards correctly', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    });

    // Check Solved count
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('/ 25 total')).toBeInTheDocument();

    // Check Streak
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('days active')).toBeInTheDocument();
    expect(screen.getByText('Longest: 12d')).toBeInTheDocument();
    expect(screen.getByText('Active Today')).toBeInTheDocument();

    // Check Success rate
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('(18 of 24 attempts)')).toBeInTheDocument();

    // Check Time invested: 165 mins = 2h 45m
    expect(screen.getByText('2h 45m')).toBeInTheDocument();
    expect(screen.getByText(/Across 24 logged sessions/i)).toBeInTheDocument();
  });

  it('renders difficulty distribution statistics', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Difficulty Distribution')).toBeInTheDocument();
    });

    expect(screen.getByText('8 / 10')).toBeInTheDocument(); // Easy
    expect(screen.getByText('6 / 12')).toBeInTheDocument(); // Medium
    expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Hard
  });

  it('renders weak topics diagnostics panel with recommendations', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByTestId('weak-topic-Dynamic Programming')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    expect(
      screen.getByText(/Success rate 33% is below 50% threshold with 6 attempts/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Solve 2-3 foundational Easy problems in Dynamic Programming/i)
    ).toBeInTheDocument();
  });

  it('renders healthy state when no weak topics are detected', async () => {
    const noWeakTopics: TopicAnalyticsResponse = {
      count: 1,
      topics: [mockTopicResponse.topics[0]], // Only Arrays (healthy)
    };

    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      noWeakTopics
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No Weak Topics Detected')).toBeInTheDocument();
    });
  });

  it('renders topic mastery rankings table sorted by score', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/DSA Topic Mastery Rankings \(3 Topics\)/i)
      ).toBeInTheDocument();
    });

    // Verify badges and score percentages
    expect(screen.getByText('Mastered')).toBeInTheDocument(); // Arrays (82%)
    expect(screen.getByText('Proficient')).toBeInTheDocument(); // Trees (65%)
    expect(screen.getByText('In Progress')).toBeInTheDocument(); // DP (35%)
  });

  it('triggers refresh when refresh button is clicked', async () => {
    vi.mocked(analyticsService.getDashboardAnalytics).mockResolvedValue(
      mockDashboard
    );
    vi.mocked(analyticsService.getTopicAnalytics).mockResolvedValue(
      mockTopicResponse
    );
    vi.mocked(analyticsService.getStreakAnalytics).mockResolvedValue(
      mockStreak
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(analyticsService.getDashboardAnalytics).toHaveBeenCalledTimes(2);
      expect(analyticsService.getTopicAnalytics).toHaveBeenCalledTimes(2);
      expect(analyticsService.getStreakAnalytics).toHaveBeenCalledTimes(2);
    });
  });
});
