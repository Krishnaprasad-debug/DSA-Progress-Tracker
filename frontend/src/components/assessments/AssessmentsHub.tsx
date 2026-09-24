import React, { useState, useEffect, useCallback } from 'react';
import { Award, Loader2, AlertCircle } from 'lucide-react';
import { Assessment, CreateAssessmentDto } from '../../types/assessment';
import { assessmentService } from '../../services/assessmentService';
import { AssessmentList } from './AssessmentList';
import { AssessmentModal } from './AssessmentModal';
import { AssessmentLiveSession } from './AssessmentLiveSession';
import { AssessmentScorecardModal } from './AssessmentScorecardModal';

export const AssessmentsHub: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [scorecardAssessment, setScorecardAssessment] = useState<Assessment | null>(null);

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentService.getAssessments();
      setAssessments(data.assessments);
    } catch (err: unknown) {
      console.error('Failed to load assessments:', err);
      setError('Unable to load mock interview assessments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleCreateAssessment = async (dto: CreateAssessmentDto) => {
    await assessmentService.createAssessment(dto);
    await fetchAssessments();
  };

  const handleStartAssessment = (assessmentId: string) => {
    setActiveSessionId(assessmentId);
  };

  const handleFinishSession = (completedAssessment: Assessment) => {
    setActiveSessionId(null);
    setScorecardAssessment(completedAssessment);
    fetchAssessments();
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (window.confirm('Are you sure you want to delete this mock interview contest?')) {
      await assessmentService.deleteAssessment(assessmentId);
      await fetchAssessments();
    }
  };

  if (activeSessionId) {
    return (
      <AssessmentLiveSession
        assessmentId={activeSessionId}
        onFinish={handleFinishSession}
        onExit={() => {
          setActiveSessionId(null);
          fetchAssessments();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Assessment Engine &amp; Mock Interview Contests
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate timed coding interview contests with live clocks, attempt penalties, and readiness verdicts.
          </p>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs font-mono">Loading mock interview assessments...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : (
        <AssessmentList
          assessments={assessments}
          onOpenCreateModal={() => setIsModalOpen(true)}
          onStartAssessment={handleStartAssessment}
          onViewScorecard={(a) => setScorecardAssessment(a)}
          onDeleteAssessment={handleDeleteAssessment}
        />
      )}

      {/* Create Contest Modal */}
      <AssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAssessment}
      />

      {/* Scorecard Modal */}
      <AssessmentScorecardModal
        isOpen={Boolean(scorecardAssessment)}
        onClose={() => setScorecardAssessment(null)}
        assessment={scorecardAssessment}
      />
    </div>
  );
};
export default AssessmentsHub;
