import { apiGet, apiPost, apiPut } from "./api";

/* ============================================
   ADMIN ORDER MANAGEMENT API
   Matches backend: /api/admin/orders
=============================================== */

const BASE = "/api/admin/orders";

/**
 * GET /api/admin/orders
 * List with filters, pagination, search
 */
export function getAdminOrders(params: any = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`${BASE}${query ? `?${query}` : ""}`);
}

/**
 * GET /api/admin/orders/:id
 */
export function getAdminOrderById(id: string) {
  return apiGet(`${BASE}/${id}`);
}

/**
 * PUT /api/admin/orders/:id/status
 */
export function updateAdminOrderStatus(id: string, status: string) {
  return apiPut(`${BASE}/${id}/status`, { status });
}

/**
 * PUT /api/admin/orders/:id/assign
 */
export function assignOrderVendorDriver(id: string, data: any) {
  return apiPut(`${BASE}/${id}/assign`, data);
}

/**
 * POST /api/admin/orders/:id/convert
 */
export function convertQuoteToOrder(id: string) {
  return apiPost(`${BASE}/${id}/convert`, {});
}

/**
 * GET /api/admin/orders/:id/invoice
 */
export function getAdminOrderInvoice(id: string) {
  return apiGet(`${BASE}/${id}/invoice`);
}

/**
 * POST /api/admin/orders/:id/upload
 * (multipart/form-data upload)
 */
export async function uploadAdminOrderAttachment(id: string, file: File) {
  const form = new FormData();
  form.append("attachment", file);

  const url = `/api/admin/orders/${id}/upload`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text();
    console.error("Upload failed:", msg);
    throw new Error(`UPLOAD /orders/${id}/upload failed (${res.status})`);
  }

  return res.json();
}
