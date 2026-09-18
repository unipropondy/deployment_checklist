import api from './api';

export const authService = {
  login: async (credentials: { Username?: string; name?: string; Password?: string; password?: string }) => {
    return await api.post('/auth/login', credentials);
  },
  getMe: async () => {
    return await api.get('/auth/me');
  },
  register: async (data: any) => {
    return await api.post('/auth/register', data);
  }
};
