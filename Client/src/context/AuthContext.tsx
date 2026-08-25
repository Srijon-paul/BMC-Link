import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMe, logout as apiLogout, refreshToken } from "@/lib/auth";
import { getProfile } from "@/lib/account";
import { ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Re-fetch the current user from /api/v1/account or /api/v1/auth/me */
  refresh: () => Promise<void>;
  /** Logout and clear user state */
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = sessionStorage.getItem("bmc_user_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem("bmc_user_cache");
    } catch {
      return true;
    }
  });

  const fetchUser = useCallback(async () => {
    /** Build a merged User from /auth/me + /account */
    const buildUserData = (me: User, profile: User | null): User => {
      const avatarUrl =
        profile?.creatorProfile?.avatar ||
        profile?.profilePicture ||
        me?.profilePicture ||
        null;

      return {
        ...me,
        ...(profile || {}),
        profilePicture: avatarUrl || me?.profilePicture || profile?.profilePicture || null,
        creatorProfile: profile?.creatorProfile
          ? {
              ...profile.creatorProfile,
              avatar: avatarUrl || profile.creatorProfile.avatar || null,
            }
          : null,
        role: me.role,
        status: me.status,
        isVerified: me.isVerified ?? profile?.isVerified ?? false,
      };
    };

    /** Fetch /auth/me + /account and set user state */
    const fetchAndSetUser = async (): Promise<boolean> => {
      const [me, profile] = await Promise.all([
        getMe(),
        getProfile().catch(() => null),
      ]);
      const userData = buildUserData(me, profile);
      setUser(userData);
      try {
        sessionStorage.setItem("bmc_user_cache", JSON.stringify(userData));
      } catch {
        // ignore storage error
      }
      return true;
    };

    try {
      try {
        await fetchAndSetUser();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Access token expired or missing — try to silently refresh
          // Attempt refresh regardless of sessionStorage cache so new tabs
          // can recover from an expired access token using the refresh cookie
          try {
            await refreshToken();
            await fetchAndSetUser();
          } catch {
            // Both access and refresh token invalid — user is logged out
            setUser(null);
            try {
              sessionStorage.removeItem("bmc_user_cache");
            } catch {
              // ignore
            }
          }
        } else {
          // Guest visitor or non-401 error — resolve immediately without retry
          setUser(null);
          try {
            sessionStorage.removeItem("bmc_user_cache");
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount, restore/validate session from HTTP-only cookies
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem("bmc_user_cache");
    } catch {
      // ignore
    }
    try {
      await apiLogout();
    } catch {
      // Even if the API call fails, clear client state
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
