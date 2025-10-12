import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// request interceptor example (attach auth token from cookies/localStorage)
api.interceptors.request.use((config) => {
  // const token = localStorage.getItem('access_token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
