/**
 * Return Requests API client
 * Handles all return and refund related API calls
 */

import { apiFetch, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/utils/auth";

const API_BASE_URL = "";

/**
 * Fetch with authentication and envelope unwrapping
 */
async function fetchWithAuth(path: string, opts: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError("No token", 401);
  }

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

    return body.data;
  }

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
 * Return request payload type
 */
export interface CreateReturnRequestPayload {
  orderId: string;
  productId: string;
  actionType: "return" | "return_refund";
  issueType: "damaged" | "wrong-item" | "quality-issue" | "late-delivery" | "others";
  issueDescription?: string;
  isDemo?: boolean;
}

/**
 * Return request status type
 * Full lifecycle statuses for return/refund tracking
 */
export type ReturnStatus = 
  | "return_requested"    // Initial state when user submits request
  | "return_approved"     // Admin approves the return
  | "pickup_scheduled"    // Pickup has been scheduled
  | "product_received"    // Product has been received back
  | "refund_initiated"    // Refund process started (only for return_refund)
  | "refund_completed"    // Refund completed (only for return_refund)
  | "return_completed"    // Return process completed
  | "return_rejected"     // Return request rejected
  // Legacy statuses for backward compatibility
  | "pending"             // Maps to return_requested
  | "approved"            // Maps to return_approved
  | "rejected"            // Maps to return_rejected
  | "completed";          // Maps to return_completed

/**
 * Status history entry type
 */
export interface StatusHistoryEntry {
  status: string;
  updatedBy: "system" | "admin" | "user";
  updatedByUserId?: string | null;
  timestamp: string;
  notes?: string | null;
}

/**
 * Return request response type
 */
export interface ReturnRequest {
  _id: string;
  userId: string;
  orderId: string;
  productId: any;
  actionType: "return" | "return_refund";
  issueType: "damaged" | "wrong-item" | "quality-issue" | "late-delivery" | "others";
  issueDescription?: string;
  status: ReturnStatus;
  statusHistory?: StatusHistoryEntry[];
  adminNotes?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated return requests response
 */
export interface PaginatedReturnRequests {
  returnRequests: ReturnRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a new return request
 * POST /api/returns
 */
export async function createReturnRequest(
  payload: CreateReturnRequestPayload
): Promise<ReturnRequest> {
  try {
    const data = await fetchWithAuth("/api/returns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to create return request",
      500
    );
  }
}

/**
 * Get all return requests for the logged-in user (paginated)
 * GET /api/returns/my?page=1&limit=10
 */
export async function getMyReturnRequests(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedReturnRequests> {
  try {
    const data = await fetchWithAuth(`/api/returns/my?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch return requests",
      500
    );
  }
}

/**
 * Get return requests for a specific order
 * GET /api/returns/order/:orderId
 */
export async function getReturnRequestsByOrder(orderId: string): Promise<ReturnRequest[]> {
  try {
    const data = await fetchWithAuth(`/api/returns/order/${orderId}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch order return requests",
      500
    );
  }
}

/**
 * ========================================
 * ADMIN API FUNCTIONS
 * ========================================
 */

/**
 * Get all return requests (Admin only)
 * GET /api/admin/returns?status=&actionType=&page=&limit=
 */
export async function adminGetAllReturnRequests(
  filters?: {
    status?: string;
    actionType?: "return" | "return_refund";
    page?: number;
    limit?: number;
  }
): Promise<PaginatedReturnRequests> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.actionType) params.append("actionType", filters.actionType);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const path = queryString ? `/api/admin/returns?${queryString}` : "/api/admin/returns";

    const data = await fetchWithAuth(path);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch return requests",
      500
    );
  }
}

/**
 * Update return request status (Admin only)
 * PATCH /api/admin/returns/:id/status
 */
export async function adminUpdateReturnStatus(
  id: string,
  status: ReturnStatus,
  adminNotes?: string,
  refundAmount?: number
): Promise<ReturnRequest> {
  try {
    const payload: any = { status };
    if (adminNotes) payload.adminNotes = adminNotes;
    if (refundAmount !== undefined) payload.refundAmount = refundAmount;

    const data = await fetchWithAuth(`/api/admin/returns/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to update return status",
      500
    );
  }
}

/**
 * Get allowed next statuses for a return request (Admin only)
 * GET /api/admin/returns/:id/allowed-statuses
 */
export async function adminGetAllowedStatuses(
  id: string
): Promise<{
  currentStatus: ReturnStatus;
  actionType: "return" | "return_refund";
  allowedNextStatuses: ReturnStatus[];
}> {
  try {
    const data = await fetchWithAuth(`/api/admin/returns/${id}/allowed-statuses`);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch allowed statuses",
      500
    );
  }
}
