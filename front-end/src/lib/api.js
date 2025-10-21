import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach auth token from localStorage
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('bubbly-auth');
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (error) {
      // Failed to parse stored auth data - ignore and continue
    }
  }
  
  // If sending FormData, remove Content-Type to let browser set it automatically
  // (browser will add multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('bubbly-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
