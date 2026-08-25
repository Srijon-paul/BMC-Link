import { apiGet, apiPost, BASE_URL } from "./api";
import type { User } from "./types";

const AUTH = "/api/v1/auth";

/**
 * Redirect the browser to initiate Google OAuth.
 * The backend handles the OAuth dance and sets HTTP-only cookies on success,
 * then redirects to FRONTEND_SUCCESS_URL (dashboard).
 */
export function initiateGoogleLogin(): void {
  window.location.href = `${BASE_URL}${AUTH}/google`;
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user (uses the accessToken cookie).
 * Throws ApiError(401) if not authenticated.
 */
export function getMe(): Promise<User> {
  return apiGet<User>(`${AUTH}/me`);
}

/**
 * POST /api/v1/auth/refresh
 * Silently rotate tokens — cookies are updated automatically by the server.
 */
export function refreshToken(): Promise<User> {
  return apiPost<User>(`${AUTH}/refresh`);
}

/**
 * POST /api/v1/auth/logout
 * Clears the session for the current device.
 */
export function logout(): Promise<null> {
  return apiPost<null>(`${AUTH}/logout`);
}

/**
 * POST /api/v1/auth/logout-all
 * Clears ALL sessions for the authenticated user (requires valid accessToken).
 */
export function logoutAll(): Promise<null> {
  return apiPost<null>(`${AUTH}/logout-all`);
}
