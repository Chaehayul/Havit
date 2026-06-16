import api from './axios';

export const wishlistApi = {
  getWishlist: () => api.get('/wishlist').then((r) => r.data),
  addToWishlist: (productId) => api.post('/wishlist', { productId }).then((r) => r.data),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
  checkWishlist: (productId) => api.get(`/wishlist/check/${productId}`).then((r) => r.data),
  subscribeRestock: (data) => api.post('/restock', data).then((r) => r.data),
};
