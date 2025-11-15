import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const companyApi = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor
companyApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('company_token');

    // Ensure headers exist
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }

    // Add Authorization header
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Handle FormData: remove Content-Type so Axios can set it
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    } else {
      // Set JSON Content-Type if not already set
      if (!config.headers.has('Content-Type')) {
        config.headers.set('Content-Type', 'application/json');
      }
    }

    return config;
  }
);

// Response interceptor
companyApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('company_token');
      localStorage.removeItem('company');
      window.location.href = '/company/login';
    }
    return Promise.reject(error);
  }
);

export default companyApi;
