import api from './api';
import {
  DashboardAnalytics,
  TopicAnalyticsResponse,
  StreakAnalytics,
} from '../types/analytics';

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await api.get<DashboardAnalytics>('/analytics/dashboard');
    return response.data;
  },

  getTopicAnalytics: async (): Promise<TopicAnalyticsResponse> => {
    const response = await api.get<TopicAnalyticsResponse>('/analytics/topics');
    return response.data;
  },

  getStreakAnalytics: async (): Promise<StreakAnalytics> => {
    const response = await api.get<StreakAnalytics>('/analytics/streak');
    return response.data;
  },
};

export default analyticsService;
