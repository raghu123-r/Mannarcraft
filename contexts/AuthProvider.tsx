// kk-frontend/contexts/AuthProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Profile } from "@/lib/supabase";
import {
  login as backendLogin,
  logout as backendLogout,
  getProfile as backendGetProfile,
} from "@/lib/api/auth.api";

type User = any;

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (payload: {
    email: string;
    otp?: string;
    password?: string;
    type?: "otp" | "password";
  }) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  loading: true,
  isAdmin: false,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Prevent double-fetch on mount
  const hasFetchedProfile = useRef(false);
  // ✅ Deduplicate concurrent in-flight calls
  const inFlightProfilePromise = useRef<Promise<void> | null>(null);

  /**
   * Fetch profile from backend.
   * ✅ backendGetProfile() returns null on 401 — never throws.
   * ✅ Deduplicates concurrent calls via inFlightProfilePromise ref.
   */
  const fetchProfileFromBackend = useCallback(async () => {
    if (inFlightProfilePromise.current) {
      return inFlightProfilePromise.current;
    }

    const promise = (async () => {
      try {
        // ✅ Never throws — returns null if not authenticated
        const p = await backendGetProfile();
        if (p) {
          setUser(p);
          setProfile(p as any);
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(p));
          }
        } else {
          // Not logged in — silent, no error overlay
          setUser(null);
          setProfile(null);
        }
      } catch {
        // Safety net — backendGetProfile should never throw
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();

    inFlightProfilePromise.current = promise;
    try {
      await promise;
    } finally {
      inFlightProfilePromise.current = null;
    }
  }, []);

  // ─── Init on mount (runs exactly once) ───────────────────────────────────
  useEffect(() => {
    if (hasFetchedProfile.current) return;
    hasFetchedProfile.current = true;

    async function init() {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const storedToken =
        localStorage.getItem("token") || localStorage.getItem("adminToken");

      if (storedToken) {
        setToken(storedToken);

        // Use cached user immediately to avoid loading flash
        const cached =
          localStorage.getItem("user") || localStorage.getItem("adminUser");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUser(parsed);
            setProfile(parsed);
            setLoading(false);
            // Refresh in background (non-blocking)
            fetchProfileFromBackend();
            return;
          } catch {
            // Corrupt cache — fetch fresh below
          }
        }

        await fetchProfileFromBackend();
        return;
      }

      // No backend token → try Supabase session
      try {
        const { data } = await supabase.auth.getUser();
        const supUser = data?.user ?? null;
        setUser(supUser);
        setProfile(null);
        setToken(null);
      } catch (err) {
        console.error("Supabase getUser fallback error:", err);
        setUser(null);
        setProfile(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [fetchProfileFromBackend, supabase]);

  // ─── Cross-tab storage sync ───────────────────────────────────────────────
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "adminToken") {
        const t =
          localStorage.getItem("token") || localStorage.getItem("adminToken");
        if (t) {
          setToken(t);
          if (!user) fetchProfileFromBackend();
        } else {
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      }

      if (e.key === "user" || e.key === "adminUser") {
        const u =
          localStorage.getItem("user") || localStorage.getItem("adminUser");
        if (u) {
          try {
            const parsed = JSON.parse(u);
            setUser(parsed);
            setProfile(parsed);
          } catch {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    };

    const onAuthUpdate = () => {
      const storedToken =
        localStorage.getItem("token") || localStorage.getItem("adminToken");
      const storedUser =
        localStorage.getItem("user") || localStorage.getItem("adminUser");

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setProfile(parsed);
        } catch {
          fetchProfileFromBackend();
        }
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:update", onAuthUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:update", onAuthUpdate);
    };
  }, [user, fetchProfileFromBackend]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (payload: {
    email: string;
    otp?: string;
    password?: string;
    type?: "otp" | "password";
  }) => {
    setLoading(true);
    try {
      const res = await backendLogin(payload as any);
      if (!res?.token) throw new Error("Login failed: no token returned");
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setProfile(res.user as any);
      return res;
    } finally {
      setLoading(false);
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      } catch (e) {
        console.error("localStorage clear error:", e);
      }
    }

    setToken(null);
    setUser(null);
    setProfile(null);
    // ✅ Reset fetch guard so re-login + re-mount works correctly
    hasFetchedProfile.current = false;

    try { await backendLogout(); } catch { }
    try { await supabase.auth.signOut(); } catch { }

    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };

  // ─── Refresh ──────────────────────────────────────────────────────────────
  const refreshUser = async () => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("adminToken")
        : null;

    if (storedToken) {
      setToken(storedToken);
      await fetchProfileFromBackend();
      return;
    }

    try {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      if (!data?.user) setProfile(null);
    } catch (err) {
      console.error("Supabase refresh error:", err);
    }
  };

  // ─── isAdmin ──────────────────────────────────────────────────────────────
  const isAdmin = useMemo(() => {
    const p = (profile || user) as any;
    if (!p) return false;
    if (p?.role) return p.role === "admin" || p.role === "superadmin";
    if (p?.isAdmin) return !!p.isAdmin;
    return false;
  }, [profile, user]);

  const value = useMemo(
    () => ({ user, profile, token, loading, isAdmin, login, logout, refreshUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, token, loading, isAdmin]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;