import React, { useState } from 'react';
import {
  Award,
  Play,
  Eye,
  Plus,
  Clock,
  Trash2,
  FileCode2,
  Flame,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Assessment, AssessmentVerdict } from '../../types/assessment';

interface AssessmentListProps {
  assessments: Assessment[];
  onOpenCreateModal: () => void;
  onStartAssessment: (assessmentId: string) => void;
  onViewScorecard: (assessment: Assessment) => void;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onOpenCreateModal,
  onStartAssessment,
  onViewScorecard,
  onDeleteAssessment,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = assessments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'active') return a.status === 'configured' || a.status === 'in_progress';
    return a.status === 'completed' || a.status === 'expired';
  });

  const getVerdictBadge = (verdict: AssessmentVerdict) => {
    switch (verdict) {
      case 'strong_hire':
        return { label: 'Strong Hire', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Flame };
      case 'hire':
        return { label: 'Hire', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: Award };
      case 'leaning_hire':
        return { label: 'Leaning Hire', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Zap };
      case 'needs_practice':
        return { label: 'Needs Practice', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: AlertTriangle };
      default:
        return null;
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
            All ({assessments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'active'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active &amp; Configured ({assessments.filter((a) => a.status === 'configured' || a.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'completed'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({assessments.filter((a) => a.status === 'completed' || a.status === 'expired').length})
          </button>
        </div>

        {/* Create button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Mock Interview</span>
        </button>
      </div>

      {/* Assessment Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Award className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Mock Interviews found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Simulate real timed interview conditions, track points, and receive readiness verdicts.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Your First Interview Contest</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const verdictBadge = getVerdictBadge(item.verdict);
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';
            const isConfigured = item.status === 'configured';

            return (
              <div
                key={item._id}
                data-testid={`assessment-card-${item._id}`}
                className={`p-5 rounded-2xl bg-slate-900/60 border transition space-y-3.5 ${
                  isInProgress
                    ? 'border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border capitalize ${
                        isInProgress
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>

                    {verdictBadge && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${verdictBadge.color}`}
                      >
                        <verdictBadge.icon className="w-3 h-3" />
                        <span>{verdictBadge.label}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteAssessment(item._id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Assessment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title & Info */}
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Meta Strip */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.durationMinutes}m
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Problems</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <FileCode2 className="w-3 h-3 text-slate-400" />
                      {item.problems.length} ({item.maxScore}pts)
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Score</span>
                    <span className="font-bold text-emerald-400">
                      {isCompleted ? `${item.score} pts` : '--'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  {isConfigured ? (
                    <button
                      onClick={() => onStartAssessment(item._id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Interview</span>
                    </button>
                  ) : isInProgress ? (
                    <button
                      onClick={() => onStartAssessment(item._id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume Live Contest</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewScorecard(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Scorecard</span>
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
export default AssessmentList;
