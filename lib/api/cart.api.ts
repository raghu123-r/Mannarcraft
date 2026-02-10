/**
 * Cart API client
 * Handles all cart-related API calls to backend /api/cart endpoints
 */

import { getAccessToken } from "@/lib/utils/auth";
import { ApiError, buildUrl } from "@/lib/api";

// ❗️IMPORTANT: use the SAME env + builder as the rest of the app

/**
 * Cart item from backend
 */
export interface BackendCartItem {
  productId: string;
  qty: number;
  price: number;
  title: string;
  image: string;
  variantId?: string;
  variantName?: string;
}

/**
 * Cart response from backend
 */
export interface BackendCart {
  items: BackendCartItem[];
  total: number;
}

/**
 * Fetch with authentication that understands backend envelope
 * { statusCode, success, error, data }
 */
async function fetchWithAuth(
  path: string,
  opts: RequestInit = {},
): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("No authentication token found", 401);
  }

  // ✅ build URL using shared helper (respects localhost / prod)
  const url = buildUrl(path);

  const response = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

  const text = await response.text().catch(() => null);
  let body: any = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  // Handle backend envelope
  if (body && typeof body === "object" && ("statusCode" in body || "success" in body)) {
    const statusCode = body.statusCode ?? response.status;

    if (!body.success) {
      const errMsg =
        body.error?.message ||
        body.message ||
        `Request failed (${statusCode})`;

      throw new ApiError(errMsg, statusCode, body.error?.details);
    }

    return body.data;
  }

  // Fallback (non-envelope)
  if (!response.ok) {
    throw new ApiError(
      body?.message || `API error (${response.status})`,
      response.status,
      body
    );
  }

  return body;
}

/**
 * Get user's cart
 */
export async function getCart(): Promise<BackendCart> {
  return (await fetchWithAuth("/api/cart")) || { items: [], total: 0 };
}

/**
 * Add product to cart
 */
export async function addToCart(
  productId: string,
  qty: number = 1,
  variantId?: string,
): Promise<BackendCart> {
  const payload: any = { productId, qty };
  if (variantId) payload.variantId = variantId;

  return fetchWithAuth("/api/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  productId: string,
  qty: number,
  variantId?: string,
): Promise<BackendCart> {
  const payload: any = { productId, qty };
  if (variantId) payload.variantId = variantId;

  return fetchWithAuth("/api/cart/item", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  productId: string,
  variantId?: string,
): Promise<BackendCart> {
  const payload: any = { productId };
  if (variantId) payload.variantId = variantId;

  return fetchWithAuth("/api/cart/item", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

/**
 * Clear cart
 */
export async function clearCart(): Promise<BackendCart> {
  return fetchWithAuth("/api/cart/clear", { method: "POST" });
}
