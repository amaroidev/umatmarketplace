import api from './api';

const growthService = {
  getSmartPricing: async (productId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`/growth/pricing/${productId}`);
    return response.data;
  },

  createCampaign: async (payload: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.post('/growth/campaigns', payload);
    return response.data;
  },

  listCampaigns: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get('/growth/campaigns');
    return response.data;
  },

  addTrustSignal: async (payload: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.post('/growth/trust/signals', payload);
    return response.data;
  },

  getTrustSummary: async (userId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`/growth/trust/${userId}`);
    return response.data;
  },

  getAnalyticsOverview: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/growth/analytics/overview');
    return response.data;
  },

  getOpsOverview: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/growth/ops/overview');
    return response.data;
  },
};

export default growthService;
