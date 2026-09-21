import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  DashboardAnalytics,
  TopicAnalytics,
  StreakAnalytics,
} from '../../types/analytics';
import { analyticsService } from '../../services/analyticsService';

export const AnalyticsDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardAnalytics | null>(null);
  const [topics, setTopics] = useState<TopicAnalytics[]>([]);
  const [streak, setStreak] = useState<StreakAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, topicData, streakData] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        analyticsService.getTopicAnalytics(),
        analyticsService.getStreakAnalytics(),
      ]);

      setDashboard(dashData);
      // Sort topics by mastery score descending
      setTopics([...topicData.topics].sort((a, b) => b.masteryScore - a.masteryScore));
      setStreak(streakData);
    } catch (err: unknown) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono">Computing learning analytics &amp; topic mastery...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-white">{error || 'Analytics Unavailable'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const weakTopics = topics.filter((t) => t.isWeak);

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  const getMasteryBadge = (score: number) => {
    if (score >= 80) return { label: 'Mastered', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    if (score >= 50) return { label: 'Proficient', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
    if (score > 0) return { label: 'In Progress', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    return { label: 'Not Started', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  // Generate last 84 days (12 weeks) for heatmap
  const generateHeatmapDays = () => {
    const days: { dateStr: string; count: number }[] = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count = streak?.history?.[dateStr] || 0;
      days.push({ dateStr, count });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/80';
    if (count === 1) return 'bg-emerald-500/40 border border-emerald-500/50';
    if (count === 2) return 'bg-emerald-500/70 border border-emerald-400';
    return 'bg-emerald-400 border border-emerald-300';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Learning Analytics &amp; Mastery Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time evaluation of volume, success rate, difficulty weighting, and active streaks.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          title="Refresh Metrics"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solved Problems */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Problems Solved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {dashboard.totalSolved}
            </span>
            <span className="text-xs text-slate-400">/ {dashboard.totalProblems} total</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dashboard.totalProblems > 0
                    ? Math.round((dashboard.totalSolved / dashboard.totalProblems) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Coding Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Practice Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {dashboard.currentStreak}
            </span>
            <span className="text-xs text-slate-400">
              {dashboard.currentStreak === 1 ? 'day active' : 'days active'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
            <span>Longest: {dashboard.longestStreak}d</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                dashboard.activeToday
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {dashboard.activeToday ? 'Active Today' : 'Not Practiced Today'}
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Success Rate</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {dashboard.overallSuccessRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({dashboard.totalSolvedAttempts} of {dashboard.totalAttempts} attempts)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${dashboard.overallSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Practice Time */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Time Invested</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {formatMinutes(dashboard.totalPracticeTimeMinutes)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Across {dashboard.totalAttempts} logged sessions
          </p>
        </div>
      </div>

      {/* Difficulty Distribution Cards */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Difficulty Distribution</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Easy */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 font-mono">Easy</span>
              <span className="font-mono text-slate-300">
                {dashboard.byDifficulty.Easy.solved} / {dashboard.byDifficulty.Easy.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{
                  width: `${
                    dashboard.byDifficulty.Easy.total > 0
                      ? Math.round(
                          (dashboard.byDifficulty.Easy.solved /
                            dashboard.byDifficulty.Easy.total) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-400 font-mono">Medium</span>
              <span className="font-mono text-slate-300">
                {dashboard.byDifficulty.Medium.solved} / {dashboard.byDifficulty.Medium.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{
                  width: `${
                    dashboard.byDifficulty.Medium.total > 0
                      ? Math.round(
                          (dashboard.byDifficulty.Medium.solved /
                            dashboard.byDifficulty.Medium.total) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400 font-mono">Hard</span>
              <span className="font-mono text-slate-300">
                {dashboard.byDifficulty.Hard.solved} / {dashboard.byDifficulty.Hard.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all"
                style={{
                  width: `${
                    dashboard.byDifficulty.Hard.total > 0
                      ? Math.round(
                          (dashboard.byDifficulty.Hard.solved /
                            dashboard.byDifficulty.Hard.total) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics Diagnostic Alert Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Weak Topic Diagnostics
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Threshold: &ge; 3 attempts &amp; (&lt;50% Mastery OR &lt;50% Success)
          </span>
        </div>

        {weakTopics.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-semibold block">No Weak Topics Detected</span>
              <span className="text-emerald-300/80">
                You maintain balanced accuracy across all practiced topics. Keep up the consistent problem variety!
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((topic) => (
              <div
                key={topic.topic}
                data-testid={`weak-topic-${topic.topic}`}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{topic.topic}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Needs Attention
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mastery</span>
                    <span className="font-bold text-amber-300">{topic.masteryScore}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Success Rate</span>
                    <span className="font-bold text-amber-300">{topic.successRate}%</span>
                  </div>
                </div>

                <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1 pl-1">
                  {topic.weakReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>

                <p className="text-[11px] text-amber-300/70 italic pt-1">
                  💡 Recommendation: Solve 2-3 foundational Easy problems in {topic.topic} before attempting Medium variations.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Heatmap Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Practice Activity (Last 12 Weeks)</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-slate-800/80" />
            <div className="w-3 h-3 rounded bg-emerald-500/40" />
            <div className="w-3 h-3 rounded bg-emerald-500/70" />
            <div className="w-3 h-3 rounded bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          {heatmapDays.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.count} attempt(s)`}
              className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-white ${getHeatmapColor(
                day.count
              )}`}
            />
          ))}
        </div>
      </div>

      {/* Topic Mastery Full Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              DSA Topic Mastery Rankings ({topics.length} Topics)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Formula: S (40%) + R (35%) + D (25%)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {topics.map((t) => {
            const badge = getMasteryBadge(t.masteryScore);

            return (
              <div
                key={t.topic}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-white truncate">
                      {t.topic}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    {t.isWeak && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Weak
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-md">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.masteryScore >= 80
                          ? 'bg-emerald-400'
                          : t.masteryScore >= 50
                          ? 'bg-sky-400'
                          : t.masteryScore > 0
                          ? 'bg-amber-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${t.masteryScore}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="flex items-center gap-4 text-xs font-mono text-slate-300 shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Solved</span>
                    <span>{t.solvedCount} / 15</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Success</span>
                    <span>{t.successRate}%</span>
                  </div>

                  <div className="text-right min-w-[50px]">
                    <span className="text-[10px] text-slate-500 block uppercase">Mastery</span>
                    <span className="font-bold text-sm text-white">{t.masteryScore}%</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
