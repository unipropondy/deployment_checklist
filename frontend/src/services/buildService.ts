import api from './api';

export const buildService = {
  getBuilds: async () => {
    return await api.get('/builds');
  },
  createBuild: async (data: { Version: string; Environment: string; Remarks?: string }) => {
    return await api.post('/builds', data);
  },
  updateBuild: async (id: number | string, data: any) => {
    return await api.put(`/builds/${id}`, data);
  }
};
