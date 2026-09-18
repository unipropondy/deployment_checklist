import api from './api';

export const testRunService = {
  getTestRuns: async () => {
    return await api.get('/test-runs');
  },
  getTestRunById: async (id: number | string) => {
    return await api.get(`/test-runs/${id}`);
  },
  createTestRun: async (data: { ShopId: number; BuildId: number; CheckDate?: string }) => {
    return await api.post('/test-runs', data);
  },
  updateTestRunItem: async (testRunId: number | string, itemId: number | string, data: { Status?: string; Remarks?: string }) => {
    return await api.put(`/test-runs/${testRunId}/items/${itemId}`, data);
  },
  completeTestRun: async (id: number | string) => {
    return await api.post(`/test-runs/${id}/complete`);
  }
};
