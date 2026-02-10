/**
 * User Dashboard API client
 * Handles user dashboard and profile-related API calls
 */

import { getAccessToken } from "@/lib/utils/auth";
import { API_BASE, unwrapEnvelope, ApiError } from "@/lib/api";

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  byStatus: Record<string, number>;
}

export interface DashboardOrder {
  orderId: string;
  userId: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCart {
  itemCount: number;
  subtotal: number;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    qty: number;
    itemTotal: number;
  }>;
}

export interface DashboardActivity {
  type: string;
  orderId: string;
  status: string;
  amount: number;
  date: string;
}

export interface DashboardProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface DashboardData {
  profile: DashboardProfile;
  stats: DashboardStats;
  recentOrders: DashboardOrder[];
  cart: DashboardCart | null;
  recentActivity: DashboardActivity[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

/**
 * Fetch comprehensive user dashboard data
 * Calls GET /api/user/dashboard with authentication
 *
 * @param page - Page number for recent orders (default: 1)
 * @param limit - Number of recent orders to fetch (default: 5)
 * @returns Dashboard data object
 * @throws Error if request fails or user is not authenticated
 */
export async function getUserDashboard(
  page: number = 1,
  limit: number = 5,
): Promise<DashboardData> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `/api/user/dashboard?page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok && (!body || (typeof body === 'object' && body.success === undefined && body.statusCode === undefined))) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to fetch dashboard: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  
  if (!data) {
    throw new ApiError("Invalid dashboard response", 500);
  }

  return data;
}

/**
 * Fetch paginated list of user's orders
 * Calls GET /api/user/orders with authentication
 *
 * @param page - Page number (default: 1)
 * @param limit - Orders per page (default: 10)
 * @param sort - Sort order (default: '-createdAt')
 * @returns Object with orders array and pagination metadata
 */
export async function getUserOrders(
  page: number = 1,
  limit: number = 10,
  sort: string = "-createdAt",
): Promise<{ orders: any[]; pagination: any }> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `/api/user/orders?page=${page}&limit=${limit}&sort=${sort}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok && (!body || (typeof body === 'object' && body.success === undefined && body.statusCode === undefined))) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to fetch orders: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  
  if (!data) {
    throw new ApiError("Invalid orders response", 500);
  }

  return data;
}

/**
 * Update user profile
 * Calls PATCH /api/user/profile with authentication
 *
 * @param payload - Profile data to update (name, email, phone)
 * @returns Updated user profile data
 */
export async function updateProfile(payload: {
  name?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `/api/user/profile`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok && (!body || (typeof body === 'object' && body.success === undefined && body.statusCode === undefined))) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to update profile: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  return data;
}

/**
 * Get all user addresses
 * Calls GET /api/user/addresses with authentication
 * 
 * @returns Array of user addresses
 */
export async function getAddresses(): Promise<any[]> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `${API_BASE}/user/addresses`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store'
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to fetch addresses: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  return data || [];
}

/**
 * Add a new address
 * Calls POST /api/user/addresses with authentication
 * 
 * @param payload - Address data to add
 * @returns Updated array of user addresses
 */
export async function addAddress(payload: {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `${API_BASE}/user/addresses`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to add address: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  return data;
}

/**
 * Update an existing address
 * Calls PATCH /api/user/addresses/:index with authentication
 * 
 * @param index - Index of address to update
 * @param payload - Address data to update
 * @returns Updated array of user addresses
 */
export async function updateAddress(index: number, payload: any): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `${API_BASE}/user/addresses/${index}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to update address: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  return data;
}

/**
 * Delete an address
 * Calls DELETE /api/user/addresses/:index with authentication
 * 
 * @param index - Index of address to delete
 * @returns Updated array of user addresses
 */
export async function deleteAddress(index: number): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError("Authentication required. Please log in.", 401);
  }

  const url = `${API_BASE}/user/addresses/${index}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text().catch(() => null);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body?.message || `Failed to delete address: ${response.statusText}`, response.status, body);
  }

  const data = unwrapEnvelope(body);
  return data;
}
