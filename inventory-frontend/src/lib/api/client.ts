import axios, { type AxiosError } from "axios";

/**
 * Centralized API client for the K.K Jewellers Spring Boot backend.
 *
 * Configured with `withCredentials: true` so the browser automatically
 * manages and transmits the HTTP session cookie (`JSESSIONID`) across requests.
 */
export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10_000,
});

// Intercept responses for session expiration and network timeouts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED") {
      console.warn("[api] timeout — is Spring Boot running on :8080?");
    }

    // Auto-redirect to /login on 401 Unauthorized if not on the login page
    // and not checking initial session status via /auth/me
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401
    ) {
      const url = error.config?.url ?? "";
      const isAuthCheck = url.includes("/auth/me") || url.includes("/auth/login");
      const isAlreadyOnLogin = window.location.pathname.startsWith("/login");

      if (!isAuthCheck && !isAlreadyOnLogin) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
