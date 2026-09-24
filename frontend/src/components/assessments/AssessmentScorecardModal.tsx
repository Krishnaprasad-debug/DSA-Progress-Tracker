import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Assessment, AssessmentVerdict } from '../../types/assessment';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
}

export const AssessmentScorecardModal: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  if (!isOpen || !assessment) return null;

  const getVerdictDetails = (verdict: AssessmentVerdict) => {
    switch (verdict) {
      case 'strong_hire':
        return {
          title: 'Strong Hire',
          subtitle: 'Exceptional problem-solving speed, minimal penalties, and complete accuracy.',
          color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
          icon: Flame,
        };
      case 'hire':
        return {
          title: 'Hire',
          subtitle: 'Solid interview performance meeting technical bar with proficient velocity.',
          color: 'text-sky-400 bg-sky-500/15 border-sky-500/40',
          icon: Award,
        };
      case 'leaning_hire':
        return {
          title: 'Leaning Hire',
          subtitle: 'Demonstrated correct logic but incurred penalties or exceeded average time limits.',
          color: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
          icon: Zap,
        };
      default:
        return {
          title: 'Needs Practice',
          subtitle: 'Review foundational patterns and timed speed drills before re-interviewing.',
          color: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
          icon: AlertTriangle,
        };
    }
  };

  const verdictInfo = getVerdictDetails(assessment.verdict);
  const VerdictIcon = verdictInfo.icon;
  const percentage =
    assessment.maxScore > 0
      ? Math.round((assessment.score / assessment.maxScore) * 100)
      : 0;

  const solvedCount = assessment.problems.filter((p) => p.status === 'solved').length;

  return (
    <div
      data-testid="scorecard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Interview Scorecard &amp; Readiness Evaluation
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {assessment.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Verdict Banner */}
        <div
          data-testid={`verdict-banner-${assessment.verdict}`}
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${verdictInfo.color}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950/40">
              <VerdictIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight block">
                {verdictInfo.title}
              </span>
              <p className="text-xs opacity-90 mt-0.5">
                {verdictInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="text-right self-end sm:self-auto">
            <span className="text-3xl font-mono font-extrabold block">
              {assessment.score}
              <span className="text-sm font-normal text-slate-300">
                {' '}/ {assessment.maxScore} pts
              </span>
            </span>
            <span className="text-xs font-mono font-semibold">
              {percentage}% Assessment Score
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Problems Solved
            </span>
            <span className="text-lg font-extrabold text-white font-mono">
              {solvedCount} / {assessment.problems.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Time Invested
            </span>
            <span className="text-lg font-extrabold text-white font-mono">
              {assessment.timeSpentMinutes}m / {assessment.durationMinutes}m
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Status
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono capitalize">
              {assessment.status}
            </span>
          </div>
        </div>

        {/* Problem Breakdown Table */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Problem Performance Breakdown
          </h4>

          <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
            {assessment.problems.map((p, idx) => {
              const isSolved = p.status === 'solved';
              const problemData = p.problem || {
                title: `Problem ${idx + 1}`,
                topic: 'General',
                difficulty: 'Medium',
                problemUrl: '',
              };

              return (
                <div
                  key={p._id || idx}
                  className="p-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {problemData.title}
                        </span>
                        {problemData.problemUrl && (
                          <a
                            href={problemData.problemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-emerald-400 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {problemData.topic} &bull; {problemData.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        Attempts
                      </span>
                      <span>{p.attempts}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        Time
                      </span>
                      <span>{p.timeTakenMinutes}m</span>
                    </div>

                    <div className="text-right min-w-[50px]">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        Weight
                      </span>
                      <span
                        className={`font-bold ${
                          isSolved ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {isSolved ? `${p.pointWeight} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};
export default AssessmentScorecardModal;
