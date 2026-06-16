import api from './axios';

export const productApi = {
  getProducts: (params) => api.get('/products', { params }).then((r) => r.data),
  getProduct: (id) => api.get(`/products/${id}`).then((r) => r.data),
  createProduct: (data) => api.post('/products', data).then((r) => r.data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  updateVariantStock: (productId, variantId, stock) =>
    api.patch(`/products/${productId}/variants/${variantId}/stock`, { stock }).then((r) => r.data),
  getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }).then((r) => r.data),
  createReview: (productId, data) => api.post(`/products/${productId}/reviews`, data).then((r) => r.data),
  updateReview: (productId, id, data) => api.put(`/products/${productId}/reviews/${id}`, data).then((r) => r.data),
  deleteReview: (productId, id) => api.delete(`/products/${productId}/reviews/${id}`).then((r) => r.data),
};

export const categoryApi = {
  getCategories: () => api.get('/categories').then((r) => r.data),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`).then((r) => r.data),
  createCategory: (data) => api.post('/categories', data).then((r) => r.data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
