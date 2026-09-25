import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Flag,
  FileCode2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Assessment, AssessmentProblem } from '../../types/assessment';
import { assessmentService } from '../../services/assessmentService';

interface LiveSessionProps {
  assessmentId: string;
  onFinish: (completedAssessment: Assessment) => void;
  onExit: () => void;
}

export const AssessmentLiveSession: React.FC<LiveSessionProps> = ({
  assessmentId,
  onFinish,
  onExit,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeProblemIdx, setActiveProblemIdx] = useState<number>(0);

  // Attempt submission form
  const [attemptResult, setAttemptResult] = useState<'Solved' | 'Failed'>('Solved');
  const [timeTaken, setTimeTaken] = useState<number>(15);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Live timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentService.getAssessmentById(assessmentId);
      setAssessment(data.assessment);
      setRemainingSeconds(data.remainingSeconds);

      // Auto start if configured
      if (data.assessment.status === 'configured') {
        const started = await assessmentService.startAssessment(assessmentId);
        setAssessment(started.assessment);
        setRemainingSeconds(started.assessment.durationMinutes * 60);
      }
    } catch (err: unknown) {
      console.error('Failed to load assessment session:', err);
      setError('Unable to load mock interview session.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // Tick timer every second
  useEffect(() => {
    if (assessment?.status === 'in_progress' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessment?.status, remainingSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleSubmitAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    const currentProblem = assessment.problems[activeProblemIdx];
    if (!currentProblem) return;

    try {
      setSubmitting(true);
      setError(null);
      const updated = await assessmentService.submitAttempt(assessment._id, {
        problemId: currentProblem.problem._id,
        result: attemptResult,
        timeTakenMinutes: Number(timeTaken),
        notes,
      });

      setAssessment(updated.assessment);
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit attempt';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishContest = async () => {
    if (!assessment) return;
    if (
      window.confirm(
        'Are you ready to submit and conclude this mock interview contest? Your final score and readiness verdict will be computed.'
      )
    ) {
      try {
        setSubmitting(true);
        const finished = await assessmentService.finishAssessment(assessment._id);
        onFinish(finished.assessment);
      } catch (err: unknown) {
        console.error('Failed to finish assessment:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono">Initializing live contest sandbox &amp; timer...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-white">{error}</p>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  if (!assessment) return null;

  const currentProblemSub: AssessmentProblem = assessment.problems[activeProblemIdx];
  const problemDetails = currentProblemSub?.problem;

  const solvedCount = assessment.problems.filter((p) => p.status === 'solved').length;
  const isTimeCritical = remainingSeconds < 300; // < 5 mins
  const isTimeWarning = remainingSeconds < 900; // < 15 mins

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Session Command Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {assessment.title}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {solvedCount} of {assessment.problems.length} Problems Solved &bull;{' '}
              {assessment.maxScore} Max Points
            </span>
          </div>
        </div>

        {/* Live Timer Strip */}
        <div className="flex items-center gap-4">
          <div
            data-testid="live-timer-clock"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-extrabold transition-colors ${
              isTimeCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : isTimeWarning
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={handleFinishContest}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Finish Contest</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem Nav & Problem Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Problem Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {assessment.problems.map((p, idx) => {
              const isSolved = p.status === 'solved';
              const isFailed = p.status === 'failed';
              const isActive = idx === activeProblemIdx;

              return (
                <button
                  key={p._id || idx}
                  onClick={() => setActiveProblemIdx(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold transition shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white'
                  }`}
                >
                  {isSolved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isFailed ? (
                    <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>P{idx + 1}: {p.pointWeight}pts</span>
                </button>
              );
            })}
          </div>

          {/* Active Problem View Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {problemDetails?.topic || 'Algorithm'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      problemDetails?.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : problemDetails?.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {problemDetails?.difficulty || 'Medium'} ({currentProblemSub?.pointWeight} pts)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {problemDetails?.title || 'Problem Title'}
                </h3>
              </div>

              {problemDetails?.problemUrl && (
                <a
                  href={problemDetails.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition shrink-0"
                >
                  <span>Open in {problemDetails.platform}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {problemDetails?.description && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
                {problemDetails.description}
              </div>
            )}

            {/* Current Problem Status Indicator */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Logged Attempts: {currentProblemSub?.attempts || 0}</span>
              <span>Time Spent: {currentProblemSub?.timeTakenMinutes || 0} mins</span>
              <span
                className={`font-semibold capitalize ${
                  currentProblemSub?.status === 'solved'
                    ? 'text-emerald-400'
                    : currentProblemSub?.status === 'failed'
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                Status: {currentProblemSub?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Attempt Submission & Scratchpad (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Submission Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              Log Problem Result
            </h4>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitAttempt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Result Outcome
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttemptResult('Solved')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      attemptResult === 'Solved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solved</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttemptResult('Failed')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      attemptResult === 'Failed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Failed / TLE</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Time Spent on this Attempt (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={timeTaken}
                  onChange={(e) => setTimeTaken(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Approach / Complexity Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., O(N log N) sorting with two-pointer scan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Record Attempt</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AssessmentLiveSession;
