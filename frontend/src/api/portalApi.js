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

  submitChangeRequest: async (token, { lineId, changeType, newQuantity, description }) => {
    return apiClient.post(`portal/quote/${token}/change-request`, {
      lineId,
      changeType,
      newQuantity,
      description,
    });
  },

  confirmQuote: async (token) => {
    return apiClient.post(`portal/quote/${token}/confirm`);
  },

  acceptRepCounterOffer: async (token, remarks = null) => {
    return apiClient.post(`portal/quote/${token}/counter-offer/accept`, { remarks });
  },

  rejectRepCounterOffer: async (token, { reason, counterDiscountPercent = null } = {}) => {
    return apiClient.post(`portal/quote/${token}/counter-offer/reject`, {
      reason,
      counterDiscountPercent,
    });
  },

  downloadPdf: async (token, quotationNumber = 'Proposal') => {
    const filename = `DealFlow360_Quotation_${quotationNumber}.pdf`;
    return apiClient.download(`portal/quote/${token}/pdf`, filename, { token: null });
  },
};

export default portalApi;
