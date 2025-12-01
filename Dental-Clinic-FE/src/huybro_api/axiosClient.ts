// src/huybro_api/axiosClient.ts
import axios from "axios";

import { getToken } from "../app/routes/shared/auth"; 

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

// REQUEST interceptor: gắn Authorization + log request
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    // Gắn JWT vào header
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // ném log từ request
  const fullUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;
  console.log("[API REQUEST]", config.method?.toUpperCase(), fullUrl);

  return config;
});

// RESPONSE interceptor: log error
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("[API ERROR]", status, data ?? error?.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
