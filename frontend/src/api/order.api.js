import api from './axios';

export const orderApi = {
  createOrder: (data) => api.post('/orders', data).then((r) => r.data),
  verifyPayment: (data) => api.post('/orders/verify-payment', data).then((r) => r.data),
  getOrders: (params) => api.get('/orders/my', { params }).then((r) => r.data),
  getOrder: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
  getAllOrders: (params) => api.get('/orders', { params }).then((r) => r.data),
  getAdminStats: (params) => api.get('/orders/admin/stats', { params }).then((r) => r.data),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
