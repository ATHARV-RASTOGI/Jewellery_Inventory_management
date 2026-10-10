import { apiClient } from "./client";

export type AuthUser = {
  username: string;
  role: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Authenticates user credentials with Spring Boot backend.
 * Upon success, the server responds with a JSESSIONID Set-Cookie.
 */
export async function apiLogin(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/login", credentials);
  return data;
}

/**
 * Invalidates the current session on the backend.
 */
export async function apiLogout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

/**
 * Verifies whether the browser holds an active, authenticated session cookie.
 */
export async function apiGetMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}

/**
 * Allows the currently authenticated user to update their password.
 */
export async function apiChangePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post("/auth/change-password", payload);
}
