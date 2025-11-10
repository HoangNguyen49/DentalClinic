import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: { 'Content-Type': 'application/json' },
});

export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';

axiosClient.interceptors.request.use((config) => {
  // ném log từ request
  const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
  console.log('[API REQUEST]', config.method?.toUpperCase(), fullUrl);
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // log 
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('[API ERROR]', status, data ?? error?.message);
    // ném lại để UI biết có lỗi
    return Promise.reject(error);
  }
);

export default axiosClient;
