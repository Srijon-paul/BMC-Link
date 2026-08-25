import {
  apiGet,
  apiPost,
  BASE_URL,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
} from "./api";
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
 * Returns the currently authenticated user (uses the accessToken cookie or Bearer header).
 * Throws ApiError(401) if not authenticated.
 */
export function getMe(): Promise<User> {
  return apiGet<User>(`${AUTH}/me`);
}

/**
 * POST /api/v1/auth/refresh
 * Silently rotate tokens — cookies are updated automatically by the server,
 * and Bearer token storage is updated if tokens are returned in the payload.
 */
export async function refreshToken(): Promise<User> {
  const storedRefreshToken = getStoredRefreshToken();
  const res = await apiPost<User & { accessToken?: string; refreshToken?: string }>(
    `${AUTH}/refresh`,
    {
      refreshToken: storedRefreshToken || undefined,
    }
  );

  if (res && res.accessToken) {
    setStoredTokens(res.accessToken, res.refreshToken);
  }

  return res;
}

/**
 * POST /api/v1/auth/logout
 * Clears the session for the current device.
 */
export async function logout(): Promise<null> {
  try {
    return await apiPost<null>(`${AUTH}/logout`);
  } finally {
    clearStoredTokens();
  }
}

/**
 * POST /api/v1/auth/logout-all
 * Clears ALL sessions for the authenticated user (requires valid accessToken).
 */
export async function logoutAll(): Promise<null> {
  try {
    return await apiPost<null>(`${AUTH}/logout-all`);
  } finally {
    clearStoredTokens();
  }
}
