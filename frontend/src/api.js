import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 15000 });

API.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { error: err.message })
);

export const getHealth = () => API.get('/health');
export const getGestures = () => API.get('/gestures');
export const getStats = () => API.get('/stats');
export const getHistory = (limit = 20, type) => API.get('/history', { params: { limit, type } });
export const clearHistory = () => API.delete('/history');

export const recognizeFrame = (formData) => API.post('/recognize/frame', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const recognizeVideo = (formData) => API.post('/recognize/video', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const recognizeSequence = (frames) => API.post('/recognize/sequence', {
  frames
});

export default API;
