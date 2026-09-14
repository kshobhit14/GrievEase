import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Request Interceptor to add Bearer Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Authorization Middleware format[cite: 1]
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;