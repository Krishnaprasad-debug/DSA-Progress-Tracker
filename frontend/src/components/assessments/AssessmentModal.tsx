import React, { useState, useEffect } from 'react';
import { X, Award, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { CreateAssessmentDto } from '../../types/assessment';
import { Problem } from '../../types/problem';
import { problemService } from '../../services/problemService';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateAssessmentDto) => Promise<void>;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDurationMinutes(60);
      setSelectedProblemIds([]);
      setError(null);

      const fetchProblems = async () => {
        try {
          setLoadingProblems(true);
          const data = await problemService.getProblems();
          setAvailableProblems(data.problems);
        } catch (err: unknown) {
          console.error('Failed to load problems for assessment:', err);
        } finally {
          setLoadingProblems(false);
        }
      };

      fetchProblems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'faang_sprint') {
      setTitle('FAANG 60-min Sprint Contest');
      setDurationMinutes(60);
      // Auto-select 1 Easy, 1 Medium, 1 Hard if available
      const easy = availableProblems.find((p) => p.difficulty === 'Easy');
      const med = availableProblems.find((p) => p.difficulty === 'Medium');
      const hard = availableProblems.find((p) => p.difficulty === 'Hard');
      const ids: string[] = [];
      if (easy) ids.push(easy._id);
      if (med) ids.push(med._id);
      if (hard) ids.push(hard._id);
      setSelectedProblemIds(ids.length > 0 ? ids : availableProblems.slice(0, 3).map((p) => p._id));
    } else if (presetName === 'speed_run') {
      setTitle('Medium Speed Run 45-min');
      setDurationMinutes(45);
      const mediums = availableProblems.filter((p) => p.difficulty === 'Medium');
      setSelectedProblemIds(
        mediums.length >= 2
          ? mediums.slice(0, 2).map((p) => p._id)
          : availableProblems.slice(0, 2).map((p) => p._id)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Contest title is required');
      return;
    }
    if (selectedProblemIds.length === 0) {
      setError('Please select at least 1 problem for the mock interview');
      return;
    }
    if (selectedProblemIds.length > 10) {
      setError('An assessment cannot exceed 10 problems');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: Number(durationMinutes),
        problemIds: selectedProblemIds,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assessment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProblems = availableProblems.filter((p) =>
    selectedProblemIds.includes(p._id)
  );
  const totalPoints = selectedProblems.reduce((sum, p) => {
    const pts = p.difficulty === 'Easy' ? 20 : p.difficulty === 'Medium' ? 40 : 60;
    return sum + pts;
  }, 0);

  return (
    <div
      data-testid="assessment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Create Mock Interview Contest
              </h3>
              <p className="text-xs text-slate-400">
                Configure timed interview sessions with point weights and live countdowns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-mono text-slate-400 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Interview Presets
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('faang_sprint')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700/80 transition"
            >
              FAANG Sprint (60m &bull; 1E, 1M, 1H)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('speed_run')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700/80 transition"
            >
              Speed Run (45m &bull; 2M)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Contest Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Mock Interview #1"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Time Limit (Minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes (Full Length)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Selected Weight
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-emerald-400 font-semibold">
                {selectedProblemIds.length} problems &bull; {totalPoints} pts
              </div>
            </div>
          </div>

          {/* Problem Selector Checklist */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Problems from Your Library ({selectedProblemIds.length} selected)
            </label>

            {loadingProblems ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-400" />
                Loading problem library...
              </div>
            ) : availableProblems.length === 0 ? (
              <p className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 text-center">
                No problems in library. Add problems in the Problem Library tab first.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 rounded-xl bg-slate-950/70 border border-slate-800 p-1">
                {availableProblems.map((prob) => {
                  const isChecked = selectedProblemIds.includes(prob._id);
                  const pts = prob.difficulty === 'Easy' ? 20 : prob.difficulty === 'Medium' ? 40 : 60;

                  return (
                    <div
                      key={prob._id}
                      onClick={() => toggleProblem(prob._id)}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs text-white truncate font-medium">
                          {prob.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                        <span className="text-slate-400">{prob.topic}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full border ${
                            prob.difficulty === 'Easy'
                              ? 'text-emerald-400 border-emerald-500/30'
                              : prob.difficulty === 'Medium'
                              ? 'text-amber-400 border-amber-500/30'
                              : 'text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {prob.difficulty} ({pts}pts)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedProblemIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Contest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AssessmentModal;
