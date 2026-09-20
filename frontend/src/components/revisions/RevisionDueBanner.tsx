import React from 'react';
import { Bell, ArrowRight } from 'lucide-react';

interface RevisionDueBannerProps {
  dueCount: number;
  onNavigateToRevisions: () => void;
}

export const RevisionDueBanner: React.FC<RevisionDueBannerProps> = ({
  dueCount,
  onNavigateToRevisions,
}) => {
  if (dueCount <= 0) return null;

  return (
    <div
      data-testid="revision-due-banner"
      className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 animate-pulse">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Spaced Revisions Due Today</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {dueCount} Pending
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Reinforce your memory curve (1d &rarr; 7d &rarr; 30d). Reviewing now maximizes long-term problem retention.
          </p>
        </div>
      </div>

      <button
        onClick={onNavigateToRevisions}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer flex-shrink-0"
      >
        <span>Review Now</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
