import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Goal, GoalStatus } from '../../types/goal';

interface GoalListProps {
  goals: Goal[];
  onOpenCreateModal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onToggleGoalStatus: (goal: Goal, newStatus: GoalStatus) => Promise<void>;
}

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  onOpenCreateModal,
  onEditGoal,
  onDeleteGoal,
  onToggleGoalStatus,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredGoals = goals.filter((g) => {
    if (filter === 'all') return true;
    return g.status === filter;
  });

  const getGoalTypeLabel = (type: Goal['type'], topic?: string) => {
    switch (type) {
      case 'weekly_problems':
        return { label: 'Weekly Problems', icon: BookOpen, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case 'topic_mastery':
        return { label: topic ? `${topic} Mastery` : 'Topic Mastery', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'practice_time':
        return { label: 'Practice Time', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'custom':
        return { label: 'Custom Target', icon: Target, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { label: 'Goal', icon: Target, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const formatProgressText = (goal: Goal) => {
    switch (goal.type) {
      case 'weekly_problems':
      case 'custom':
        return `${goal.currentValue} / ${goal.targetValue} solved`;
      case 'practice_time':
        return `${goal.currentValue} / ${goal.targetValue} mins`;
      case 'topic_mastery':
        return `${goal.currentValue}% / ${goal.targetValue}% mastery`;
      default:
        return `${goal.currentValue} / ${goal.targetValue}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({goals.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'active'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({goals.filter((g) => g.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'completed'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({goals.filter((g) => g.status === 'completed').length})
          </button>
        </div>

        {/* Create button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Personal Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Goals in this view</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'completed'
              ? 'Keep practicing and completing weekly quotas to see completed goals here!'
              : 'Set personal problem quotas, target practice durations, or topic mastery goals.'}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const typeInfo = getGoalTypeLabel(goal.type, goal.topic);
            const Icon = typeInfo.icon;
            const isCompleted = goal.status === 'completed';

            return (
              <div
                key={goal._id}
                data-testid={`goal-card-${goal._id}`}
                className={`p-5 rounded-2xl bg-slate-900/60 border transition space-y-3.5 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${typeInfo.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{typeInfo.label}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : goal.status === 'cancelled'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {goal.status}
                    </span>

                    <button
                      onClick={() => onEditGoal(goal)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar & Value */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">{formatProgressText(goal)}</span>
                    <span
                      className={`font-bold ${
                        isCompleted ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {goal.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-400'
                          : goal.progressPercentage >= 50
                          ? 'bg-sky-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Footer Controls: Deadline & Status Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    {goal.deadline ? (
                      <>
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <span>Weekly Goal</span>
                    )}
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={() => onToggleGoalStatus(goal, 'active')}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reactivate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleGoalStatus(goal, 'completed')}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Complete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default GoalList;
