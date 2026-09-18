import api from './api';

export const shopService = {
  getShops: async () => {
    return await api.get('/shops');
  },
  createShop: async (data: { ShopCode: string; ShopName: string; Location?: string }) => {
    return await api.post('/shops', data);
  },
  updateShop: async (id: number | string, data: any) => {
    return await api.put(`/shops/${id}`, data);
  },
  updateShopStatus: async (id: number | string, IsActive: boolean) => {
    return await api.patch(`/shops/${id}/status`, { IsActive });
  }
};
