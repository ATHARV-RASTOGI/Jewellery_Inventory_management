import axios, { type AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auravault_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auravault_token");
      window.location.href = "/login";
    }
    if (error.response?.status === 403) {
      console.error("Forbidden: insufficient permissions");
    }
    if (error.code === "ECONNABORTED") {
      console.error("Request timed out — is Spring Boot running on :8080?");
    }
    return Promise.reject(error);
  }
);