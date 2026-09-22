import api from './api';
import {
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  GoalsResponse,
  WeeklyReport,
  GoalStatus,
} from '../types/goal';

export const goalService = {
  getGoals: async (status?: GoalStatus): Promise<GoalsResponse> => {
    const params = status ? { status } : {};
    const response = await api.get<GoalsResponse>('/goals', { params });
    return response.data;
  },

  getGoalById: async (id: string): Promise<Goal> => {
    const response = await api.get<Goal>(`/goals/${id}`);
    return response.data;
  },

  createGoal: async (dto: CreateGoalDto): Promise<{ message: string; goal: Goal }> => {
    const response = await api.post<{ message: string; goal: Goal }>('/goals', dto);
    return response.data;
  },

  updateGoal: async (
    id: string,
    dto: UpdateGoalDto
  ): Promise<{ message: string; goal: Goal }> => {
    const response = await api.put<{ message: string; goal: Goal }>(`/goals/${id}`, dto);
    return response.data;
  },

  deleteGoal: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/goals/${id}`);
    return response.data;
  },

  getWeeklyReport: async (): Promise<WeeklyReport> => {
    const response = await api.get<WeeklyReport>('/reports/weekly');
    return response.data;
  },
};

export default goalService;
