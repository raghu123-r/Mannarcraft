/**
 * Order Response Adapter
 * Normalizes backend order responses to frontend-expected shapes
 */

import type { Order } from "@/lib/types/order";

/**
 * Normalize order list response
 */
export function normalizeOrdersResponse(response: any): Order[] {
  if (Array.isArray(response)) return response;
  if (response && "data" in response && Array.isArray(response.data)) return response.data;
  if (response && "orders" in response && Array.isArray(response.orders)) return response.orders;
  return [];
}

/**
 * Normalize single order response
 * Handles all possible backend response shapes
 */
export function normalizeOrderResponse(response: any): Order {
  // Direct order object with _id
  if (response && "_id" in response) {
    return response as Order;
  }

  // Has id (not _id)
  if (response && "id" in response) {
    return response as Order;
  }

  // Wrapped in data property
  if (response && "data" in response && response.data) {
    const data = response.data;
    if (data._id || data.id) {
      return data as Order;
    }
  }

  // Wrapped in order property
  if (response && "order" in response && response.order) {
    return response.order as Order;
  }

  // Backend envelope: { statusCode, success, data: { order } }
  if (response && "data" in response) {
    return response.data as Order;
  }

  // Last resort: return response as-is if it has any id-like field
  if (response && (response._id || response.id || response.orderId)) {
    return response as Order;
  }

  // Log the actual response for debugging
  console.error("normalizeOrderResponse: unexpected shape:", JSON.stringify(response));
  
  // Instead of throwing, return a minimal order object to prevent crash
  return {
    _id: response?._id || response?.id || "unknown",
    ...response,
  } as Order;
}