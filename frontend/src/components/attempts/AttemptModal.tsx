import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Problem } from '../../types/problem';
import { AttemptResult, CreateAttemptResponse } from '../../types/attempt';
import { attemptService } from '../../services/attemptService';

interface AttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  onAttemptLogged: (response: CreateAttemptResponse) => void;
}

export const AttemptModal: React.FC<AttemptModalProps> = ({
  isOpen,
  onClose,
  problem,
  onAttemptLogged,
}) => {
  const [result, setResult] = useState<AttemptResult>('Solved');
  const [timeTakenMinutes, setTimeTakenMinutes] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !problem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (timeTakenMinutes < 1) {
      setError('Time taken must be at least 1 minute');
      return;
    }

    try {
      setLoading(true);
      const response = await attemptService.createAttempt(problem._id, {
        result,
        timeTakenMinutes: Number(timeTakenMinutes),
        notes: notes.trim() || undefined,
      });

      onAttemptLogged(response);
      onClose();
      // Reset state for next open
      setNotes('');
      setTimeTakenMinutes(30);
      setResult('Solved');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string; details?: string[] } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { details?: string[] } } })?.response?.data
          ?.details?.[0] ||
        'Failed to log attempt. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const presetTimes = [15, 30, 45, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
              Log Practice Attempt
            </span>
            <h2 className="text-lg font-bold text-white truncate max-w-[380px]">
              {problem.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome / Result Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-2">
              Practice Outcome <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResult('Solved')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                  result === 'Solved'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Solved
              </button>
              <button
                type="button"
                onClick={() => setResult('Failed')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                  result === 'Failed'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Failed / Stuck
              </button>
            </div>
          </div>

          {/* Time Taken */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="timeTakenMinutes"
                className="block text-xs font-semibold text-slate-300 uppercase font-mono"
              >
                Time Taken (Minutes) <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {timeTakenMinutes} mins
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="timeTakenMinutes"
                type="number"
                min="1"
                max="600"
                value={timeTakenMinutes}
                onChange={(e) => setTimeTakenMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
              {presetTimes.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimeTakenMinutes(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition ${
                    timeTakenMinutes === preset
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Learnings */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-2"
            >
              Reflection &amp; Approach Notes
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-slate-500">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What approach did you take? Any tricky edge cases, time/space complexity insights, or mistakes made?"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Attempt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
