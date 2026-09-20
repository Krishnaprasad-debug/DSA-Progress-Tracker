import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { Revision } from '../../types/revision';
import { revisionService } from '../../services/revisionService';

interface RevisionListProps {
  onRevisionCountChanged?: (count: number) => void;
}

export const RevisionList: React.FC<RevisionListProps> = ({
  onRevisionCountChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'upcoming' | 'completed'>('due');
  const [dueRevisions, setDueRevisions] = useState<Revision[]>([]);
  const [allRevisions, setAllRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dueRes, allRes] = await Promise.all([
        revisionService.getRevisionsDueToday(),
        revisionService.getAllRevisions(),
      ]);

      setDueRevisions(dueRes.revisions);
      setAllRevisions(allRes.revisions);

      if (onRevisionCountChanged) {
        onRevisionCountChanged(dueRes.count);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch revisions:', err);
      setError('Unable to load revisions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [onRevisionCountChanged]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleComplete = async (revisionId: string) => {
    try {
      setCompletingId(revisionId);
      setActionSuccessMessage(null);

      const res = await revisionService.completeRevision(revisionId);

      setActionSuccessMessage(res.message);
      await fetchRevisions();

      // Clear success notification after 5 seconds
      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    } catch (err: unknown) {
      console.error('Failed to complete revision:', err);
      setError('Failed to mark revision complete. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getIntervalBadge = (intervalDays: number) => {
    switch (intervalDays) {
      case 1:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 7:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 30:
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Filter list based on tab
  const upcomingRevisions = allRevisions.filter(
    (r) =>
      !r.completed &&
      new Date(r.scheduledDate).getTime() > new Date().setHours(23, 59, 59, 999)
  );

  const completedRevisions = allRevisions.filter((r) => r.completed);

  const currentList =
    activeTab === 'due'
      ? dueRevisions
      : activeTab === 'upcoming'
      ? upcomingRevisions
      : completedRevisions;

  return (
    <div className="space-y-6">
      {/* Leitner Explanation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase font-mono tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Leitner Forgetting Curve Schedule</span>
          </div>
          <button
            onClick={fetchRevisions}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Revisions"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The spaced revision engine automatically schedules reviews at optimal intervals to convert active problem-solving into long-term intuition:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] font-mono text-sky-400 block font-semibold">Stage 1: Day 1</span>
            <span className="text-xs text-white font-medium">Initial Recall</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] font-mono text-indigo-400 block font-semibold">Stage 2: Day 7</span>
            <span className="text-xs text-white font-medium">Consolidation</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] font-mono text-purple-400 block font-semibold">Stage 3: Day 30</span>
            <span className="text-xs text-white font-medium">Long-term Retention</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <span className="text-[10px] font-mono text-emerald-400 block font-semibold">Stage 4: Complete</span>
            <span className="text-xs text-emerald-300 font-medium">Mastered Problem</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('due')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'due'
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Due Today / Overdue</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              dueRevisions.length > 0
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {dueRevisions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'upcoming'
              ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Upcoming Schedule</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
            {upcomingRevisions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'completed'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Completed History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
            {completedRevisions.length}
          </span>
        </button>
      </div>

      {/* Revision Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs font-mono">Loading revision schedule...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            {activeTab === 'due' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : activeTab === 'upcoming' ? (
              <Calendar className="w-6 h-6 text-indigo-400" />
            ) : (
              <Award className="w-6 h-6 text-purple-400" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white">
            {activeTab === 'due'
              ? 'All Caught Up!'
              : activeTab === 'upcoming'
              ? 'No Upcoming Revisions'
              : 'No Completed Revisions Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'due'
              ? 'You have no revisions due today. Solve more problems to schedule memory curve reinforcements!'
              : activeTab === 'upcoming'
              ? 'Complete today’s revisions to schedule the next intervals.'
              : 'Completed revisions will be logged here as you finish practice runs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {currentList.map((rev) => {
            const scheduled = new Date(rev.scheduledDate);
            const isOverdue =
              !rev.completed &&
              scheduled.getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={rev._id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate max-w-[340px]">
                      {rev.problem?.title || 'Untitled Problem'}
                    </span>

                    {rev.problem?.problemUrl && (
                      <a
                        href={rev.problem.problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-emerald-400 transition"
                        title="Open external problem link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {rev.problem?.difficulty && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                          rev.problem.difficulty
                        )}`}
                      >
                        {rev.problem.difficulty}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border font-mono ${getIntervalBadge(
                        rev.intervalDays
                      )}`}
                    >
                      {rev.intervalDays}d Interval
                    </span>

                    {isOverdue && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-300 border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    {rev.problem?.topic && (
                      <span className="font-mono text-slate-300">
                        {rev.problem.topic}
                      </span>
                    )}

                    <span className="text-slate-600">&bull;</span>

                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Scheduled:{' '}
                      {scheduled.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {rev.completed && rev.completedAt && (
                      <>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-emerald-400 text-[11px] font-mono">
                          Completed on{' '}
                          {new Date(rev.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                {!rev.completed && (
                  <button
                    onClick={() => handleComplete(rev._id)}
                    disabled={completingId === rev._id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/30 transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {completingId === rev._id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Reviewed
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
