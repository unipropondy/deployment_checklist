import api from './api';

export const userService = {
  getUsers: async () => {
    return await api.get('/users');
  },
  createUser: async (data: { Name: string; Password?: string }) => {
    return await api.post('/users', data);
  },
  updateUser: async (id: number | string, data: any) => {
    return await api.put(`/users/${id}`, data);
  },
  updateUserStatus: async (id: number | string, IsActive: boolean) => {
    return await api.patch(`/users/${id}/status`, { IsActive });
  }
};
