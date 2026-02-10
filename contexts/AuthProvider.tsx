// kk-frontend/contexts/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
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
  login: (payload: { email: string; otp?: string; password?: string; type?: "otp" | "password" }) => Promise<{ token: string; user: User }>;
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

// Exponential backoff utility for 429 rate limiting
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Deduplication: track in-flight profile fetch to prevent concurrent calls
  const inFlightProfilePromise = useRef<Promise<void> | null>(null);

  const fetchProfileFromBackend = async (tok?: string) => {
    // If a fetch is already in flight, wait for it instead of creating a new one
    if (inFlightProfilePromise.current) {
      return inFlightProfilePromise.current;
    }

    const promise = (async () => {
      const delays = [100, 300, 1000]; // Exponential backoff delays for 429 retries
      let retries = 0;

      while (retries <= delays.length) {
        try {
          const p = await backendGetProfile();
          if (p) {
            setUser(p);
            setProfile(p as any);
            if (typeof window !== "undefined") {
              localStorage.setItem("user", JSON.stringify(p));
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          return; // Success, exit
        } catch (err: any) {
          // Check for 429 rate limit error
          if (err?.response?.status === 429 || err?.status === 429) {
            if (retries < delays.length) {
              console.warn(`Rate limited (429), retrying in ${delays[retries]}ms...`);
              await sleep(delays[retries]);
              retries++;
              continue;
            } else {
              console.error("Rate limit exceeded, max retries reached");
              setUser(null);
              setProfile(null);
              return;
            }
          }
          
          // Other errors
          if (!err?.message?.includes("session has expired")) {
            console.error("backendGetProfile error:", err);
          }
          setUser(null);
          setProfile(null);
          return;
        }
      }
    })();

    inFlightProfilePromise.current = promise;

    try {
      await promise;
    } finally {
      inFlightProfilePromise.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      // Check for both regular user token and admin token
      const storedToken = localStorage.getItem("token") || localStorage.getItem("adminToken");

      if (storedToken) {
        setToken(storedToken);
        const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUser(parsed);
            setProfile(parsed);
            setLoading(false);
            fetchProfileFromBackend(storedToken);
            return;
          } catch (e) {
            // ignore and fetch fresh
          }
        }
        await fetchProfileFromBackend(storedToken);
        return;
      }

      try {
        const { data } = await supabase.auth.getUser();
        const supUser = data?.user ?? null;
        if (supUser) {
          setUser(supUser);
          setProfile(null);
          setToken(null);
        } else {
          setUser(null);
          setProfile(null);
          setToken(null);
        }
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

    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "adminToken") {
        const t = typeof window !== "undefined" 
          ? (localStorage.getItem("token") || localStorage.getItem("adminToken"))
          : null;
        if (t) {
          setToken(t);
          // Only fetch if we don't already have user data
          if (!user) {
            fetchProfileFromBackend(t);
          }
        } else {
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      }
      if (e.key === "user" || e.key === "adminUser") {
        const u = typeof window !== "undefined" 
          ? (localStorage.getItem("user") || localStorage.getItem("adminUser"))
          : null;
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
      // Handle auth:update event dispatched by login flows
      const storedToken = typeof window !== "undefined" 
        ? (localStorage.getItem("token") || localStorage.getItem("adminToken"))
        : null;
      const storedUser = typeof window !== "undefined"
        ? (localStorage.getItem("user") || localStorage.getItem("adminUser"))
        : null;
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setProfile(parsed);
        } catch (e) {
          // If parse fails, fetch from backend
          fetchProfileFromBackend(storedToken);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:update", onAuthUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:update", onAuthUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: { email: string; otp?: string; password?: string; type?: "otp" | "password" }) => {
    setLoading(true);
    try {
      const res = await backendLogin(payload as any);
      if (!res || !res.token) throw new Error("Login failed: no token returned");
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

  const logout = async () => {
    // Clear localStorage FIRST to prevent rehydration
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
    
    // Clear state immediately
    setToken(null);
    setUser(null);
    setProfile(null);

    // Best-effort backend and Supabase logout
    try {
      await backendLogout();
    } catch (e) {
      console.error("Backend logout error:", e);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signOut error:", e);
    }

    // Redirect after everything is cleared
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };

  const refreshUser = async () => {
    // Don't set loading to true on refresh to prevent UI flicker
    const storedToken = typeof window !== "undefined" 
      ? (localStorage.getItem("token") || localStorage.getItem("adminToken"))
      : null;
    
    if (storedToken) {
      setToken(storedToken);
      await fetchProfileFromBackend(storedToken);
      return;
    }
    
    // Fallback to Supabase if no backend token
    try {
      const { data } = await supabase.auth.getUser();
      const supUser = data?.user ?? null;
      setUser(supUser);
      if (!supUser) {
        setProfile(null);
      }
    } catch (err) {
      console.error("Supabase refresh error:", err);
    }
  };

  const isAdmin = useMemo(() => {
    if (!profile && !user) return false;
    const p = (profile || user) as any;
    if (p?.role) return p.role === "admin" || p.role === "superadmin";
    if (p?.isAdmin) return !!p.isAdmin;
    return false;
  }, [profile, user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      token,
      loading,
      isAdmin,
      login,
      logout,
      refreshUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, token, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
