import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Zap,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { WeeklyReport } from '../../types/goal';
import { goalService } from '../../services/goalService';

export const WeeklyReportView: React.FC = () => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.getWeeklyReport();
      setReport(data);
    } catch (err: unknown) {
      console.error('Failed to fetch weekly report:', err);
      setError('Unable to load weekly performance report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono">Aggregating weekly performance and velocity trends...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-white">{error || 'Report Unavailable'}</p>
        <button
          onClick={fetchReport}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  const getDeltaBadge = (delta: number, suffix = '') => {
    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-emerald-400">
          <ArrowUpRight className="w-3 h-3" />
          +{delta}{suffix}
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-rose-400">
          <ArrowDownRight className="w-3 h-3" />
          {delta}{suffix}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-slate-400">
        <Minus className="w-3 h-3" />
        0{suffix}
      </span>
    );
  };

  const { summary, previousWeekComparison: prevComp, weekRange, dailyBreakdown, neglectedWeakTopics, activeGoals } = report;

  // Max daily minutes for scaling charts
  const maxDailyMinutes = Math.max(
    ...dailyBreakdown.map((d) => d.practiceTimeMinutes),
    30
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header with Week Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-emerald-400">
              Calendar Week: {weekRange.start} to {weekRange.end}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Weekly Performance &amp; Velocity Report
          </h2>
        </div>

        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Report</span>
        </button>
      </div>

      {/* Velocity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Problems Solved */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Problems Solved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary.problemsSolved}
            </span>
            <span className="text-xs text-slate-400">solved</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">vs. last week ({prevComp.prevProblemsSolved})</span>
            {getDeltaBadge(prevComp.deltaProblemsSolved)}
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
              {formatMinutes(summary.practiceTimeMinutes)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">vs. last week ({formatMinutes(prevComp.prevPracticeTimeMinutes)})</span>
            {getDeltaBadge(prevComp.deltaPracticeTimeMinutes, 'm')}
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
              {summary.successRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({summary.solvedAttempts}/{summary.totalAttempts} att.)
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">vs. last week ({prevComp.prevSuccessRate}%)</span>
            {getDeltaBadge(prevComp.deltaSuccessRate, '%')}
          </div>
        </div>

        {/* Velocity Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase font-semibold">Velocity Trend</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {prevComp.velocityTrend === 'accelerating' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                Accelerating
              </span>
            ) : prevComp.velocityTrend === 'declining' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Declining
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Minus className="w-3.5 h-3.5 text-sky-400" />
                Steady
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {summary.activeDaysCount} of 7 active days this week
          </p>
        </div>
      </div>

      {/* 7-Day Day-by-Day Activity Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Daily Practice Breakdown (Monday – Sunday)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {summary.activeDaysCount} active days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {dailyBreakdown.map((day) => {
            const hasActivity = day.attemptCount > 0;
            const barHeight = Math.max(
              8,
              Math.round((day.practiceTimeMinutes / maxDailyMinutes) * 80)
            );

            return (
              <div
                key={day.date}
                data-testid={`daily-breakdown-${day.dayName}`}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center transition min-h-[140px] ${
                  hasActivity
                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {day.dayName.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {day.date.slice(5)}
                  </span>
                </div>

                {/* Vertical Bar */}
                <div className="w-full flex justify-center items-end h-16 py-1">
                  <div
                    style={{ height: `${hasActivity ? barHeight : 4}px` }}
                    className={`w-4 rounded-t-sm transition-all ${
                      hasActivity
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/20'
                        : 'bg-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-0.5 text-[10px] font-mono">
                  <span className="font-semibold text-emerald-400 block">
                    {day.solvedCount} solved
                  </span>
                  <span className="text-slate-400 block">
                    {day.practiceTimeMinutes}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Neglected Weak Topics Diagnostic Alert Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Neglected Weak Topics Index
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Analytics weak topics with 0 practice this week
          </span>
        </div>

        {neglectedWeakTopics.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-semibold block">All Weak Topics Received Attention!</span>
              <span className="text-emerald-300/80">
                You actively practiced your diagnostic focus areas this week. Keep up the balanced distribution!
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {neglectedWeakTopics.map((wt) => (
              <div
                key={wt.topic}
                data-testid={`neglected-topic-${wt.topic}`}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{wt.topic}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    0 Practice This Week
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mastery</span>
                    <span className="font-bold text-amber-300">{wt.masteryScore}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Success Rate</span>
                    <span className="font-bold text-amber-300">{wt.successRate}%</span>
                  </div>
                </div>

                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {wt.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Weekly Goals Summary */}
      {activeGoals.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Active Goals Progress ({activeGoals.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Current Week</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGoals.map((g) => (
              <div
                key={g._id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate">{g.title}</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {g.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${g.progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default WeeklyReportView;
