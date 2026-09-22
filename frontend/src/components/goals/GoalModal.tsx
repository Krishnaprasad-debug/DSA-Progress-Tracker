import React, { useState, useEffect } from 'react';
import { X, Target, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Goal, CreateGoalDto, GoalType } from '../../types/goal';
import { TOPICS, Topic } from '../../types/problem';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateGoalDto) => Promise<void>;
  initialGoal?: Goal | null;
}

const PRESETS: Array<{
  label: string;
  type: GoalType;
  title: string;
  targetValue: number;
  topic?: Topic;
}> = [
  {
    label: '10 Problems This Week',
    type: 'weekly_problems',
    title: 'Solve 10 Problems This Week',
    targetValue: 10,
  },
  {
    label: '5 Hours Practice',
    type: 'practice_time',
    title: 'Practice 300 Minutes This Week',
    targetValue: 300,
  },
  {
    label: '75% DP Mastery',
    type: 'topic_mastery',
    title: 'Reach 75% Mastery in Dynamic Programming',
    targetValue: 75,
    topic: 'Dynamic Programming',
  },
  {
    label: '80% Trees Mastery',
    type: 'topic_mastery',
    title: 'Reach 80% Mastery in Trees',
    targetValue: 80,
    topic: 'Trees',
  },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialGoal,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('weekly_problems');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [topic, setTopic] = useState<Topic>('Dynamic Programming');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setType(initialGoal.type);
      setTargetValue(initialGoal.targetValue);
      setTopic(initialGoal.topic || 'Dynamic Programming');
      setDeadline(
        initialGoal.deadline
          ? new Date(initialGoal.deadline).toISOString().split('T')[0]
          : ''
      );
    } else {
      setTitle('');
      setDescription('');
      setType('weekly_problems');
      setTargetValue(10);
      setTopic('Dynamic Programming');
      setDeadline('');
    }
    setError(null);
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setType(preset.type);
    setTitle(preset.title);
    setTargetValue(preset.targetValue);
    if (preset.topic) {
      setTopic(preset.topic);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title');
      return;
    }
    if (targetValue < 1) {
      setError('Target value must be at least 1');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        targetValue: Number(targetValue),
        topic: type === 'topic_mastery' ? topic : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save goal';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="goal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialGoal ? 'Edit Learning Goal' : 'Create Personal Goal'}
              </h3>
              <p className="text-xs text-slate-400">
                Track weekly volume, topic mastery targets, and practice commitments.
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
        {!initialGoal && (
          <div className="my-4">
            <span className="text-[11px] font-mono text-slate-400 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700/80 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Goal Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Solve 10 problems this week"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Goal Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GoalType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="weekly_problems">Weekly Problems Solved</option>
                <option value="topic_mastery">Topic Mastery Target (%)</option>
                <option value="practice_time">Weekly Practice Time (Mins)</option>
                <option value="custom">Custom Problem Target</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Value <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {type === 'topic_mastery' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                DSA Topic <span className="text-rose-400">*</span>
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Deadline (Optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add personal motivation or strategy notes..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Action buttons */}
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
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialGoal ? 'Update Goal' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default GoalModal;
