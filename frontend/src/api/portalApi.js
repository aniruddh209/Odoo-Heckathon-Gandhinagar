import { apiClient } from './apiClient';

export const portalApi = {
  getQuoteByToken: async (token) => {
    return apiClient.get(`portal/quote/${token}`);
  },

  submitLineComment: async (token, lineId, comment) => {
    return apiClient.post(`portal/quote/${token}/lines/${lineId}/comment`, JSON.stringify(comment));
  },

  submitCounterOffer: async (token, { lineId, proposedDiscountPercent, reason }) => {
    return apiClient.post(`portal/quote/${token}/counter-offer`, {
      lineId,
      proposedDiscountPercent,
      reason,
    });
  },

  confirmQuote: async (token) => {
    return apiClient.post(`portal/quote/${token}/confirm`);
  },
};

export default portalApi;
