import axios, { type AxiosError } from "axios";

/**
 * Centralized API client for the K.K Jewellers Spring Boot backend.
 *
 * In development, requests to `/api/*` are proxied by Vite to
 * http://localhost:8080 (see vite.config.ts) to avoid CORS issues.
 * In production, set VITE_API_BASE_URL to the deployed Spring Boot URL.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kk_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED") {
      console.warn("[api] timeout — is Spring Boot running on :8080?");
    }
    return Promise.reject(error);
  },
);
