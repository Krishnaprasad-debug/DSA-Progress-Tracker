import api from './api';
import {
  Revision,
  RevisionsResponse,
  CompleteRevisionResponse,
  CreateRevisionInput,
} from '../types/revision';

export const revisionService = {
  getRevisionsDueToday: async (): Promise<RevisionsResponse> => {
    const response = await api.get<RevisionsResponse>('/revisions/today');
    return response.data;
  },

  getAllRevisions: async (completed?: boolean): Promise<RevisionsResponse> => {
    const params = completed !== undefined ? { completed } : {};
    const response = await api.get<RevisionsResponse>('/revisions', { params });
    return response.data;
  },

  createRevision: async (
    data: CreateRevisionInput
  ): Promise<{ revision: Revision; message: string }> => {
    const response = await api.post<{ revision: Revision; message: string }>(
      '/revisions',
      data
    );
    return response.data;
  },

  completeRevision: async (
    revisionId: string
  ): Promise<CompleteRevisionResponse> => {
    const response = await api.put<CompleteRevisionResponse>(
      `/revisions/${revisionId}/complete`
    );
    return response.data;
  },
};

export default revisionService;
