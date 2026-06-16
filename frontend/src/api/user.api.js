import api from './axios';

export const userApi = {
  getProfile: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (data) => api.put('/users/me', data).then((r) => r.data),
  changePassword: (data) => api.put('/users/me/password', data).then((r) => r.data),
  getAddresses: () => api.get('/users/me/addresses').then((r) => r.data),
  createAddress: (data) => api.post('/users/me/addresses', data).then((r) => r.data),
  updateAddress: (id, data) => api.put(`/users/me/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`).then((r) => r.data),
  // 어드민
  getUsers: (params) => api.get('/users', { params }).then((r) => r.data),
  uploadImage: (formData) =>
    api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  uploadImages: (formData) =>
    api.post('/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};
