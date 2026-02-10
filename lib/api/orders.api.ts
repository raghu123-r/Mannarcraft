/**
 * Orders API client
 * Handles all order-related API calls with robust error handling
 */

import { apiFetch, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/utils/auth";
import type {
  Order,
  CreateOrderPayload,
  OrdersApiResponse,
  OrderApiResponse,
  CreateOrderApiResponse,
} from "@/lib/types/order";
import {
  normalizeOrdersResponse,
  normalizeOrderResponse,
} from "@/lib/adapters/order.adapter";

// Base API URL for direct backend calls (when needed)
const API_BASE_URL = "";

/**
 * Fetch with authentication and envelope unwrapping
 * Uses the backend envelope format: { statusCode, success, error, data }
 * Returns `data` directly for success, throws ApiError for failures
 */
export async function fetchWithAuth(
  path: string,
  opts: RequestInit = {},
): Promise<any> {
  // Get token from localStorage or cookies
  const token = getAccessToken();

  // No token found - user needs to authenticate
  if (!token) {
    throw new ApiError("No token", 401);
  }

  // Build request with Authorization header
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...opts.headers,
  };

  const response = await fetch(url, {
    ...opts,
    headers,
  });

  // Parse response body
  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  // Handle backend envelope format: { statusCode, success, error, data }
  if (body && typeof body === "object" && ("statusCode" in body || "success" in body)) {
    const statusCode = body.statusCode ?? response.status;
    const okFlag = body.success === true;

    if (!okFlag) {
      const errMsg =
        (body.error && (body.error.message || JSON.stringify(body.error))) ||
        body.message ||
        body.error ||
        `Request failed with status ${statusCode}`;
      const details = body.error?.details ?? body.details ?? null;
      throw new ApiError(errMsg, statusCode, details);
    }

    // Success: return inner data property
    return body.data;
  }

  // Handle non-envelope responses (fallback)
  if (!response.ok) {
    const errMsg =
      (body && (body.message || JSON.stringify(body))) ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errMsg, response.status, body);
  }

  return body;
}

/**
 * Create a new order
 * @param payload - Order creation payload with items, shipping address, and optional payment info
 * @returns Created Order object
 * @throws Error if API request fails
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    const response = await apiFetch<CreateOrderApiResponse>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // ADAPTER: Normalize response using adapter
    return normalizeOrderResponse(response);
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
}

/**
 * Fetch all orders for the authenticated user
 * Uses robust fetchWithAuth with proper error handling
 * Handles multiple response shapes:
 * - Array of orders directly
 * - { orders: [...] }
 * - { data: [...] }
 *
 * @returns Array of Order objects
 * @throws ApiError if request fails
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await fetchWithAuth("/api/orders/me");

    // Normalize response to array
    let orders: Order[] = [];

    if (Array.isArray(response)) {
      // Direct array response
      orders = response;
    } else if (response?.orders && Array.isArray(response.orders)) {
      // { orders: [...] } shape
      orders = response.orders;
    } else if (response?.data && Array.isArray(response.data)) {
      // { data: [...] } shape
      orders = response.data;
    } else if (response?.data?.orders && Array.isArray(response.data.orders)) {
      // { data: { orders: [...] } } shape (nested)
      orders = response.data.orders;
    } else {
      // Unknown response shape - return empty array
      return [];
    }

    // Validate each order has required fields
    const validOrders = orders.filter((order: any) => {
      const hasId = order._id || order.id;
      const hasItems = order.items && Array.isArray(order.items);

      if (!hasId || !hasItems) {
        return false;
      }

      return true;
    });

    return validOrders;
  } catch (error) {
    // Re-throw the error to be handled by the component
    throw error;
  }
}

/**
 * Alias for getOrders() to match naming convention
 * Get current user's orders from backend
 */
export async function getMyOrders(): Promise<Order[]> {
  return getOrders();
}

/**
 * Fetch a single order by ID
 * @param id - Order ID
 * @returns Order object or null if not found
 * @throws Error if API request fails
 */
export async function getOrder(id: string): Promise<Order | null> {
  try {
    const response = await apiFetch<OrderApiResponse>(`/orders/${id}`);

    // ADAPTER: Normalize response using adapter
    return normalizeOrderResponse(response);
  } catch (error) {
    console.error(`Failed to fetch order with ID "${id}":`, error);
    // Return null for 404s, throw for other errors
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Alias for getOrder() to match naming convention
 * Fetch a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  return getOrder(id);
}
