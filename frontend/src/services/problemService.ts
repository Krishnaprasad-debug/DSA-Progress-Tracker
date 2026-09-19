import api from './api';
import { Problem, ProblemFilters } from '../types/problem';

export const problemService = {
  getProblems: async (filters?: ProblemFilters): Promise<{ count: number; problems: Problem[] }> => {
    const response = await api.get<{ count: number; problems: Problem[] }>('/problems', {
      params: filters,
    });
    return response.data;
  },

  getProblemById: async (id: string): Promise<{ problem: Problem }> => {
    const response = await api.get<{ problem: Problem }>(`/problems/${id}`);
    return response.data;
  },

  createProblem: async (data: Partial<Problem>): Promise<{ message: string; problem: Problem }> => {
    const response = await api.post<{ message: string; problem: Problem }>('/problems', data);
    return response.data;
  },

  updateProblem: async (id: string, data: Partial<Problem>): Promise<{ message: string; problem: Problem }> => {
    const response = await api.put<{ message: string; problem: Problem }>(`/problems/${id}`, data);
    return response.data;
  },

  deleteProblem: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/problems/${id}`);
    return response.data;
  },
};

export default problemService;
