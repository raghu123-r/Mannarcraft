/**
 * Authentication API client
 * Handles login, logout, and profile fetching
 */

import { apiGet, apiPost, ApiError, clearStoredTokens } from "@/lib/api";
import type { User, LoginPayload, LoginResponse } from "@/lib/types/user";
import {
  normalizeAuthResponse,
  normalizeUserResponse,
} from "@/lib/adapters/auth.adapter";

/**
 * Login user with email/phone and password/OTP
 */
export async function login(
  payload: LoginPayload,
): Promise<{ token: string; user: User }> {
  const hasEmailOrPhone = payload.email || payload.phone;
  const hasPasswordOrOTP = payload.password || payload.otp;

  if (!hasEmailOrPhone || !hasPasswordOrOTP) {
    throw new Error("Email/phone and password/OTP are required");
  }

  const endpoints = ["/auth/login", "/login"];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await apiPost<LoginResponse>(endpoint, payload);
      const normalized = normalizeAuthResponse(response);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", normalized.token);
      }
      return normalized;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Login request failed");
      continue;
    }
  }

  throw lastError || new Error("Login failed - all endpoints unreachable");
}

/**
 * Logout user by clearing ALL tokens and session data
 */
export function logout(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = [
      "token", "accessToken", "access_token", "access",
      "refreshToken", "refresh_token",
      "adminToken", "admin_token",
      "user", "userInfo", "adminUser",
    ];

    keys.forEach((key) => {
      try { localStorage.removeItem(key); } catch { }
      try { sessionStorage.removeItem(key); } catch { }
    });

    const cookieNames = [
      "accessToken", "refreshToken", "adminToken",
      "token", "kk_session", "kk_auth",
    ];
    cookieNames.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${name}=; path=/admin; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    });

    try { window.dispatchEvent(new Event("auth:logout")); } catch { }
  } catch (err) {
    console.warn("Logout cleanup error:", err);
  }
}

/**
 * Get current user profile from the API.
 * ✅ Returns null if not authenticated — NEVER throws on 401.
 */
export async function getProfile(): Promise<User | null> {
  // ✅ No token = skip network call entirely, return null silently
  if (typeof window !== "undefined") {
    const hasToken =
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken");
    if (!hasToken) {
      return null;
    }
  }

  const endpoints = [
    "/api/auth/me",
    "/api/me",
    "/api/auth/profile",
    "/api/profile",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiGet<any>(endpoint);
      const user = normalizeUserResponse(response);

      if (user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        return user;
      }
    } catch (error) {
      // ✅ 401 = session expired → clear tokens, stop trying, return null silently
      if (error instanceof ApiError && error.status === 401) {
        clearStoredTokens();
        return null;
      }
      // Other errors → try next endpoint
      continue;
    }
  }

  return null;
}

/**
 * Register a new user
 */
export async function register(payload: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const endpoints = ["/auth/register", "/register", "/auth/signup", "/signup"];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await apiPost<LoginResponse>(endpoint, payload);
      const normalized = normalizeAuthResponse(response);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", normalized.token);
      }
      return normalized;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Registration failed");
      continue;
    }
  }

  throw lastError || new Error("Registration failed - all endpoints unreachable");
}

/**
 * Request an OTP to be sent to the user's email
 * ✅ Lets ApiError propagate with real server message
 */
export async function requestOtp(
  email: string,
  purpose: "login" | "signup" | "forgot" = "login",
): Promise<{ message?: string; id?: string }> {
  const response = await apiPost<{ message?: string; id?: string }>(
    "/auth/request-otp",
    { email, purpose },
  );
  return response;
}

/**
 * Verify the OTP code and authenticate the user
 * ✅ Lets ApiError propagate with real server message
 */
export async function verifyOtp(payload: {
  email: string;
  code: string;
  purpose?: "login" | "signup" | "forgot";
  name?: string;
  redirectTo?: string;
}): Promise<{ token: string; user: any }> {
  const { email, code, purpose = "login", name } = payload;

  const response = await apiPost<any>("/auth/verify-otp", {
    email,
    code,
    purpose,
    name,
  });

  const token = response.access || response.token || response.data?.access;
  const user = response.user || response.data?.user || response.data;

  if (!token) {
    throw new Error("No authentication token received from server");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  return { token, user };
}