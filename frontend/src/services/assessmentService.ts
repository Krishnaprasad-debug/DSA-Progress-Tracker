import api from './api';
import {
  Assessment,
  AssessmentDetailsResponse,
  CreateAssessmentDto,
  SubmitAssessmentAttemptDto,
  AssessmentStatus,
} from '../types/assessment';

export const assessmentService = {
  getAssessments: async (
    status?: AssessmentStatus
  ): Promise<{ count: number; assessments: Assessment[] }> => {
    const params = status ? { status } : {};
    const response = await api.get<{ count: number; assessments: Assessment[] }>(
      '/assessments',
      { params }
    );
    return response.data;
  },

  getAssessmentById: async (id: string): Promise<AssessmentDetailsResponse> => {
    const response = await api.get<AssessmentDetailsResponse>(`/assessments/${id}`);
    return response.data;
  },

  createAssessment: async (
    dto: CreateAssessmentDto
  ): Promise<{ message: string; assessment: Assessment }> => {
    const response = await api.post<{ message: string; assessment: Assessment }>(
      '/assessments',
      dto
    );
    return response.data;
  },

  startAssessment: async (
    id: string
  ): Promise<{ message: string; assessment: Assessment }> => {
    const response = await api.post<{ message: string; assessment: Assessment }>(
      `/assessments/${id}/start`
    );
    return response.data;
  },

  submitAttempt: async (
    id: string,
    dto: SubmitAssessmentAttemptDto
  ): Promise<{ message: string; assessment: Assessment }> => {
    const response = await api.post<{ message: string; assessment: Assessment }>(
      `/assessments/${id}/submit`,
      dto
    );
    return response.data;
  },

  finishAssessment: async (
    id: string
  ): Promise<{ message: string; assessment: Assessment }> => {
    const response = await api.post<{ message: string; assessment: Assessment }>(
      `/assessments/${id}/finish`
    );
    return response.data;
  },

  deleteAssessment: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/assessments/${id}`);
    return response.data;
  },
};

export default assessmentService;
