import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import {
  Problem,
  TOPICS,
  DIFFICULTIES,
  PLATFORMS,
  STATUSES,
  Topic,
  Difficulty,
  Platform,
  ProblemStatus,
} from '../../types/problem';

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (problemData: Partial<Problem>) => Promise<void>;
  initialData?: Problem | null;
}

export const ProblemModal: React.FC<ProblemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<Topic>('Arrays');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [platform, setPlatform] = useState<Platform>('LeetCode');
  const [status, setStatus] = useState<ProblemStatus>('Not Started');
  const [problemUrl, setProblemUrl] = useState('');
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTopic(initialData.topic);
      setDifficulty(initialData.difficulty);
      setPlatform(initialData.platform);
      setStatus(initialData.status);
      setProblemUrl(initialData.problemUrl || '');
      setEstimatedTimeMinutes(initialData.estimatedTimeMinutes || 30);
      setNotes(initialData.notes || '');
      setTags(initialData.tags?.join(', ') || '');
    } else {
      setTitle('');
      setTopic('Arrays');
      setDifficulty('Medium');
      setPlatform('LeetCode');
      setStatus('Not Started');
      setProblemUrl('');
      setEstimatedTimeMinutes(30);
      setNotes('');
      setTags('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError('Title must be at least 2 characters long');
      return;
    }

    if (estimatedTimeMinutes < 1 || estimatedTimeMinutes > 600) {
      setError('Estimated time must be between 1 and 600 minutes');
      return;
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        topic,
        difficulty,
        platform,
        status,
        problemUrl: problemUrl.trim(),
        estimatedTimeMinutes: Number(estimatedTimeMinutes),
        notes: notes.trim(),
        tags: parsedTags,
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as {
        response?: { data?: { error?: string; details?: string[] } };
      };
      setError(
        errObj.response?.data?.details?.[0] ||
          errObj.response?.data?.error ||
          'Failed to save problem. Please check inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="problem-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <h2 id="problem-modal-title" className="text-xl font-bold text-white tracking-tight">
            {initialData ? 'Edit Problem' : 'Add New Problem'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {initialData
              ? 'Update problem parameters, status, and revision notes'
              : 'Add a new DSA challenge to track your learning journey'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-title">
              Problem Title *
            </label>
            <input
              id="problem-title"
              type="text"
              required
              placeholder="e.g. Merge Intervals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-topic">
                Topic Category *
              </label>
              <select
                id="problem-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-difficulty">
                Difficulty Level *
              </label>
              <select
                id="problem-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-platform">
                Platform
              </label>
              <select
                id="problem-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-status">
                Status
              </label>
              <select
                id="problem-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProblemStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-url">
                Problem URL
              </label>
              <input
                id="problem-url"
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={problemUrl}
                onChange={(e) => setProblemUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-time">
                Est. Minutes
              </label>
              <input
                id="problem-time"
                type="number"
                min="1"
                max="600"
                value={estimatedTimeMinutes}
                onChange={(e) => setEstimatedTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-tags">
              Tags (comma separated)
            </label>
            <input
              id="problem-tags"
              type="text"
              placeholder="Two Pointers, Sliding Window, Greedy"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="problem-notes">
              Notes &amp; Complexity
            </label>
            <textarea
              id="problem-notes"
              rows={3}
              placeholder="Key insights, edge cases, time/space complexity O(n)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                'Update Problem'
              ) : (
                'Add Problem'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemModal;
