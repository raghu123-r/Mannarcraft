// normalize base (remove trailing slashes)
export const API_BASE_RAW = process.env.NEXT_PUBLIC_API_URL!;
export const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

/**
 * buildUrl(path)
 */
export function buildUrl(path = ""): string {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;

  let normalizedPath = path.replace(/^\/+/, "");

  if (API_BASE.toLowerCase().endsWith("/api")) {
    normalizedPath = normalizedPath.replace(/^api\/?/i, "");
  }

  return `${API_BASE}/${normalizedPath}`;
}

// -------------------- ERROR CLASS --------------------
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status = 500, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// -------------------- ENVELOPE HANDLING --------------------
export function unwrapEnvelope(body: any): any {
  if (!body || typeof body !== "object") return body;

  if ("success" in body || "statusCode" in body) {
    if (!body.success) {
      throw new ApiError(
        body.error?.message || body.message || "Request failed",
        body.statusCode || 500,
        body.error?.details
      );
    }
    return body.data;
  }

  return body;
}

export function normalizeListResponse(payload: any, knownKeys: string[] = []): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const maybe =
    payload?.success !== undefined ? unwrapEnvelope(payload) : payload;

  if (Array.isArray(maybe)) return maybe;

  const keys = [...knownKeys, "items", "list", "rows", "products", "categories", "brands"];
  for (const k of keys) {
    if (Array.isArray(maybe?.[k])) return maybe[k];
  }

  return [];
}

export function ensureArray(payload: any, knownKeys: string[] = ["items", "data"]) {
  return normalizeListResponse(payload, knownKeys);
}

// -------------------- CORE FETCH --------------------
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(path);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken") || localStorage.getItem("token")
      : null;

  try {
    const res = await fetch(url, {
      mode: "cors",
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let body: any = null;

    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // If not JSON, treat as plain text error
      body = { message: text || res.statusText };
    }

    if (body && (body.success !== undefined || body.statusCode !== undefined)) {
      if (!body.success) {
        throw new ApiError(
          body.error?.message || body.message || "Request failed",
          body.statusCode || res.status,
          body.error?.details
        );
      }
      return body.data as T;
    }

    if (!res.ok) {
      throw new ApiError(
        body?.message || res.statusText,
        res.status,
        body
      );
    }

    return body as T;
  } catch (err: any) {
    console.error("❌ apiFetch network error:", err);

    throw new ApiError(
      err?.message || "Network error (CORS / server unreachable)",
      0,
      err
    );
  }
}

// -------------------- HELPERS --------------------
export const apiGet = <T = any>(path: string) =>
  apiFetch<T>(path, { method: "GET" });

export const apiPost = <T = any>(path: string, body?: any) =>
  apiFetch<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPut = <T = any>(path: string, body?: any) =>
  apiFetch<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T = any>(path: string) =>
  apiFetch<T>(path, { method: "DELETE" });

export function buildQueryString(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      sp.append(k, String(v));
    }
  });
  return sp.toString() ? `?${sp.toString()}` : "";
}
