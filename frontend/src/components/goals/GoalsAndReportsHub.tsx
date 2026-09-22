import React, { useState, useEffect, useCallback } from 'react';
import { Target, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Goal, CreateGoalDto, GoalStatus } from '../../types/goal';
import { goalService } from '../../services/goalService';
import { GoalList } from './GoalList';
import { GoalModal } from './GoalModal';
import { WeeklyReportView } from './WeeklyReportView';

export const GoalsAndReportsHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'report'>('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await goalService.getGoals();
      setGoals(res.goals);
    } catch (err: unknown) {
      console.error('Failed to load goals:', err);
      setError('Unable to load personal goals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (dto: CreateGoalDto) => {
    if (editingGoal) {
      await goalService.updateGoal(editingGoal._id, dto);
    } else {
      await goalService.createGoal(dto);
    }
    await fetchGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await goalService.deleteGoal(goalId);
      await fetchGoals();
    }
  };

  const handleToggleGoalStatus = async (goal: Goal, newStatus: GoalStatus) => {
    await goalService.updateGoal(goal._id, { status: newStatus });
    await fetchGoals();
  };

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Personal Goals &amp; Weekly Performance Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure learning quotas, evaluate dynamic progress, and review week-over-week velocity.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'goals'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Personal Goals</span>
            {activeGoalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                {activeGoalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('report')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'report'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Weekly Report</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeSubTab === 'goals' ? (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-mono">Evaluating dynamic goal progress...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : (
          <GoalList
            goals={goals}
            onOpenCreateModal={handleOpenCreateModal}
            onEditGoal={handleOpenEditModal}
            onDeleteGoal={handleDeleteGoal}
            onToggleGoalStatus={handleToggleGoalStatus}
          />
        )
      ) : (
        <WeeklyReportView />
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialGoal={editingGoal}
      />
    </div>
  );
};
export default GoalsAndReportsHub;
