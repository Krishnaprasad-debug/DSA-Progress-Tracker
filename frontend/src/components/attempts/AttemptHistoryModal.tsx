import React, { useEffect, useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  PlusCircle,
  Loader2,
  History,
} from 'lucide-react';
import { Problem } from '../../types/problem';
import { Attempt, StruggleStatus } from '../../types/attempt';
import { attemptService } from '../../services/attemptService';

interface AttemptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  onOpenLogAttempt: (problem: Problem) => void;
}

export const AttemptHistoryModal: React.FC<AttemptHistoryModalProps> = ({
  isOpen,
  onClose,
  problem,
  onOpenLogAttempt,
}) => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [struggleStatus, setStruggleStatus] = useState<StruggleStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !problem) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attemptService.getProblemAttempts(problem._id);
        setAttempts(data.attempts);
        setStruggleStatus(data.struggleStatus);
      } catch (err: unknown) {
        console.error('Failed to load attempt history:', err);
        setError('Failed to load attempt history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, problem]);

  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Attempt History
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {problem.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {problem.topic}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white truncate max-w-[420px]">
                {problem.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Struggle Alert Banner */}
          {struggleStatus && struggleStatus.isStruggle && (
            <div
              data-testid="struggle-warning-banner"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2 animate-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Struggle Detected for this Problem</span>
              </div>
              <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1 pl-1">
                {struggleStatus.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-300/80 italic pt-1">
                💡 Tip: Consider reviewing topic fundamentals, breaking the problem down into sub-goals, or reviewing the discussion section.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-mono">Loading attempt history...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && attempts.length === 0 && (
            <div className="text-center py-12 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <History className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Attempts Logged Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Track your solving time and test outcomes each time you practice this problem.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenLogAttempt(problem);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Log First Attempt
              </button>
            </div>
          )}

          {/* Timeline of Attempts */}
          {!loading && !error && attempts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                <span>Total Attempts: {attempts.length}</span>
                <span>
                  Success Rate:{' '}
                  {(
                    (attempts.filter((a) => a.result === 'Solved').length /
                      attempts.length) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>

              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-semibold border border-slate-700">
                          #{attempt.attemptNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            attempt.result === 'Solved'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {attempt.result === 'Solved' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {attempt.result}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {attempt.timeTakenMinutes} mins
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(attempt.attemptedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {attempt.notes && (
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <FileText className="w-3 h-3" />
                          <span>Notes</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{attempt.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogAttempt(problem);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log New Attempt
          </button>
        </div>
      </div>
    </div>
  );
};
