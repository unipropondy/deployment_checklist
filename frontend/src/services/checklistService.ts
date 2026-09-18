import api from './api';

export const checklistService = {
  getCategories: async () => {
    return await api.get('/checklist/categories');
  },
  getItems: async () => {
    return await api.get('/checklist/items');
  },
  getItemById: async (id: number | string) => {
    return await api.get(`/checklist/items/${id}`);
  },
  createItem: async (data: { CategoryId: number; ChecklistItem: string; ChecklistCode?: string; SNo?: number }) => {
    return await api.post('/checklist/items', data);
  },
  updateItem: async (id: number | string, data: { ChecklistItem?: string; CategoryId?: number; SNo?: number }) => {
    return await api.put(`/checklist/items/${id}`, data);
  },
};
