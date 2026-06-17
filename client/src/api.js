import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

export const getTenants = () => API.get('/tenants');
export const getTenant = (id) => API.get(`/tenants/${id}`);
export const createTenant = (data) => API.post('/tenants', data);
export const updateTenant = (id, data) => API.put(`/tenants/${id}`, data);
export const deleteTenant = (id) => API.delete(`/tenants/${id}`);
export const generateBill = (id, month, currentUnit) =>
  API.post(`/tenants/${id}/generate-bill`, {
    month,
    ...(currentUnit !== undefined && { currentUnit }),
  });

export const updateBill = (tenantId, billId, data) =>
  API.patch(`/tenants/${tenantId}/bills/${billId}`, data);

export const getMonthlyHistory = (tenantId) =>
  API.get(`/tenants/${tenantId}/monthly-history`);

export const getAllMonthsSummary = () =>
  API.get('/tenants/summary/all-months');

export const autoSaveMonthlyBills = () =>
  API.post('/tenants/auto-save/monthly');
