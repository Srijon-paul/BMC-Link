import type { ApiResponse } from "./types";

// ─── Base URL ─────────────────────────────────────────────────────────────────

export const BASE_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  // In production builds, if VITE_API_URL is unset, points to localhost, or points to onrender.com directly,
  // use relative "" so requests route through the Vercel proxy rewrite to prevent cross-site cookie blocking
  if (
    import.meta.env.PROD &&
    (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || envUrl.includes("onrender.com"))
  ) {
    return "";
  }
  return envUrl.replace(/\/+$/, "");
})();

// ─── CSRF Token ───────────────────────────────────────────────────────────────
// The backend sets a non-HttpOnly `csrfToken` cookie that JS can read.
// We forward it as `x-csrf-token` on every request so the CSRF middleware
// accepts mutations (PATCH / POST / DELETE) in production.
function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrfToken="))
      ?.split("=")[1] ?? ""
  );
}


// ─── Custom Error Class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── Core Fetch Helper ────────────────────────────────────────────────────────

/**
 * Wraps `fetch` with:
 * - Base URL prepended automatically
 * - `credentials: "include"` so HTTP-only cookies (accessToken / refreshToken) are sent
 * - JSON Content-Type header on mutation requests
 * - Typed response deserialization
 * - Structured error thrown on non-2xx status
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    "x-csrf-token": getCsrfToken(),
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // critical for HTTP-only cookie auth
  });

  // Parse JSON regardless of success/error to extract the message field
  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(res.status, res.statusText || "Unexpected server error");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body as unknown as { message?: string })?.message ??
        "Something went wrong"
    );
  }

  return (body as ApiResponse<T>).data;
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

export const apiGet = <T>(path: string, init?: RequestInit) =>
  apiFetch<T>(path, { method: "GET", ...init });

export const apiPost = <T>(path: string, body?: unknown, init?: RequestInit) =>
  apiFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

export const apiPatch = <T>(path: string, body?: unknown, init?: RequestInit) =>
  apiFetch<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

export const apiDelete = <T>(path: string, init?: RequestInit) =>
  apiFetch<T>(path, { method: "DELETE", ...init });
