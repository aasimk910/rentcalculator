import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

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
