/**
 * Coupons API Client
 * Admin API functions for managing coupons
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  applicableProducts: any[];
  applicableCategories: any[];
  applicableBrands: any[];
  startDate?: string;
  expiryDate: string;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  active: boolean;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export interface ListCouponsParams {
  page?: number;
  limit?: number;
  active?: boolean;
  expired?: boolean;
  search?: string;
}

export interface CreateCouponPayload {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableBrands?: string[];
  startDate?: string;
  expiryDate: string;
  usageLimit?: number;
  perUserLimit?: number;
  active?: boolean;
}

export interface ApplyCouponPayload {
  code: string;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  userId?: string;
}

/**
 * List coupons with pagination and filters
 */
export async function listCoupons(params: ListCouponsParams = {}) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.expired !== undefined) queryParams.append('expired', params.expired.toString());
  if (params.search) queryParams.append('search', params.search);

  const url = `/api/admin/coupons?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to list coupons' }));
    throw new Error(error.message || 'Failed to list coupons');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Get single coupon by ID
 */
export async function getCoupon(id: string) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`/api/admin/coupons/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get coupon' }));
    throw new Error(error.message || 'Failed to get coupon');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Create new coupon
 */
export async function createCoupon(payload: CreateCouponPayload) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`/api/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create coupon' }));
    throw new Error(error.error?.message || error.message || 'Failed to create coupon');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Update coupon
 */
export async function updateCoupon(id: string, payload: Partial<CreateCouponPayload>) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`/api/admin/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update coupon' }));
    throw new Error(error.error?.message || error.message || 'Failed to update coupon');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Delete coupon
 */
export async function deleteCoupon(id: string) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`/api/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete coupon' }));
    throw new Error(error.message || 'Failed to delete coupon');
  }

  const data = await response.json();
  return data;
}

/**
 * Apply coupon to cart (test endpoint)
 */
export async function applyCoupon(payload: ApplyCouponPayload) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`/api/admin/coupons/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to apply coupon' }));
    throw new Error(error.error?.message || error.message || 'Failed to apply coupon');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Apply coupon for regular users (PUBLIC endpoint)
 * POST /api/coupons/apply
 */
export async function applyCouponForUser(code: string, cartItems: any[]) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/coupons/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, cartItems }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to apply coupon' }));
    throw new Error(error.error?.message || error.message || 'Failed to apply coupon');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Get active coupons for users (PUBLIC endpoint)
 * GET /api/coupons/active
 * Returns only active, valid coupons without admin-only fields
 */
export async function getActiveCoupons() {
  const response = await fetch(`/api/coupons/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch active coupons' }));
    throw new Error(error.error?.message || error.message || 'Failed to fetch active coupons');
  }

  const data = await response.json();
  return data.data || data;
}

