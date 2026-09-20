import api from './api';
import {
  CreateAttemptInput,
  CreateAttemptResponse,
  ProblemAttemptsResponse,
} from '../types/attempt';

export const attemptService = {
  getProblemAttempts: async (problemId: string): Promise<ProblemAttemptsResponse> => {
    const response = await api.get<ProblemAttemptsResponse>(
      `/problems/${problemId}/attempts`
    );
    return response.data;
  },

  createAttempt: async (
    problemId: string,
    data: CreateAttemptInput
  ): Promise<CreateAttemptResponse> => {
    const response = await api.post<CreateAttemptResponse>(
      `/problems/${problemId}/attempts`,
      data
    );
    return response.data;
  },
};
