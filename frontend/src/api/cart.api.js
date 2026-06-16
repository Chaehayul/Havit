import api from './axios';

export const cartApi = {
  getCart: () => api.get('/cart').then((r) => r.data),
  addItem: (data) => api.post('/cart/items', data).then((r) => r.data),
  updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  clearCart: () => api.delete('/cart').then((r) => r.data),
  mergeCart: (sessionId) => api.post('/cart/merge', { sessionId }).then((r) => r.data),
};
