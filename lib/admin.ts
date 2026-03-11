// -------------------- AUTH --------------------
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://kk-backend-5c11.onrender.com/api";

async function apiFetchAuth(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const headers = { ...(opts.headers || {}), 'Content-Type': 'application/json' } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...opts,
  });

  const status = res.status;
  const json = await res.json().catch(() => null);
  
  const isSuccess = status >= 200 && status < 300;
  
  if (!isSuccess) {
    const err = new Error(json?.message || json?.error || `Request failed: ${status}`);
    (err as any).status = status;
    throw err;
  }
  
  if (json && typeof json === 'object' && ('statusCode' in json || 'success' in json)) {
    if (json.success === false) {
      const errMsg = json.error?.message || json.message || 'Request failed';
      const err = new Error(errMsg);
      (err as any).status = json.statusCode || status;
      throw err;
    }
    if (json.data !== undefined) {
      return json.data;
    }
    return json;
  }
  
  return json;
}

export function apiGetAuth(path: string) { return apiFetchAuth(path, { method: 'GET' }); }
export function apiPostAuth(path: string, data?: any) { return apiFetchAuth(path, { method: 'POST', body: JSON.stringify(data) }); }
export function apiPutAuth(path: string, data?: any) { return apiFetchAuth(path, { method: 'PUT', body: JSON.stringify(data) }); }
export function apiPatchAuth(path: string, data?: any) { return apiFetchAuth(path, { method: 'PATCH', body: JSON.stringify(data) }); }
export function apiDeleteAuth(path: string) { return apiFetchAuth(path, { method: 'DELETE' }); }

function ensureArray(payload: any, knownKeys: string[] = ['items', 'data', 'products', 'categories', 'brands']): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  
  for (const key of knownKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  
  if (payload.data && Array.isArray(payload.data)) {
    return payload.data;
  }
  
  return [];
}

async function callLogin(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Login failed (${res.status})`);
  }
  return res.json();
}

export async function adminLogin(email: string, password: string) {
  const payload = { email, password };
  const backendRoot = API_BASE.replace(/\/api\/?$/, "");
  const attempts = [
    `${backendRoot}/api/admin/login`,
    `${API_BASE}/admin/login`,
  ];
  for (const url of attempts) {
    try {
      const result = await callLogin(url, payload);
      return result;
    } catch (err) {
      // try next
    }
  }
  throw new Error("Admin login failed: unable to reach backend login endpoint");
}

export async function adminLogout() {
  try {
    await apiPostAuth("/admin/logout", {});
  } catch (e) {
    console.warn('Backend logout failed:', e);
  }
  
  if (typeof window !== 'undefined') {
    const keysToRemove = [
      'adminToken', 'admin_token', 'adminUser',
      'token', 'accessToken', 'access', 'user'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        // Ignore errors
      }
    });

    const cookieNames = ['adminToken', 'accessToken', 'token'];
    cookieNames.forEach(name => {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${name}=; path=/admin; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    });

    window.location.href = '/admin/login';
  }
}

// -------------------- PRODUCTS --------------------
export async function getAdminProducts(params?: { 
  page?: number; 
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  priceMin?: string;
  priceMax?: string;
}) {
  const effectiveParams = params || { page: 1, limit: 9999 };
  
  const queryParams: Record<string, string> = {
    page: String(effectiveParams.page || 1),
    limit: String(effectiveParams.limit || 9999)
  };
  
  if (effectiveParams.search) queryParams.search = effectiveParams.search;
  if (effectiveParams.category) queryParams.category = effectiveParams.category;
  if (effectiveParams.brand) queryParams.brand = effectiveParams.brand;
  if (effectiveParams.priceMin) queryParams.priceMin = effectiveParams.priceMin;
  if (effectiveParams.priceMax) queryParams.priceMax = effectiveParams.priceMax;
  
  const queryString = '?' + new URLSearchParams(queryParams).toString();
  
  const data = await apiGetAuth(`/admin/products${queryString}`);
  
  if (!params) {
    return ensureArray(data?.products || data, ['items', 'products', 'data']);
  }
  
  return data;
}

export function getSingleProduct(id: string) {
  return apiGetAuth(`/admin/products/${id}`);
}

export async function createProduct(data: any) {
  try {
    const result = await apiPostAuth("/admin/products", data);
    const product = result?.product ?? result?.data?.product ?? result?.data ?? null;
    return {
      ok: true,
      success: true,
      product,
      data: result
    };
  } catch (err: any) {
    return {
      ok: false,
      success: false,
      error: err.message || 'Creation failed',
      message: err.message || 'Creation failed'
    };
  }
}

export function updateProduct(id: string, data: any) {
  return apiPutAuth(`/admin/products/${id}`, data);
}

export function deleteProduct(id: string) {
  return apiDeleteAuth(`/admin/products/${id}`);
}

// -------------------- USERS --------------------
export async function getAdminUsers() {
  const data = await apiGetAuth("/admin/users");
  return ensureArray(data, ['items', 'users', 'data']);
}

// -------------------- BRANDS --------------------
export async function getBrands() {
  const res = await fetch(`${API_BASE}/brands`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch brands (${res.status})`);
  }
  const json = await res.json();
  
  const data = (json && (json.statusCode !== undefined || json.success !== undefined)) 
    ? (json.data ?? json) 
    : json;
  
  return ensureArray(data, ['items', 'brands', 'data']);
}

export async function getAdminBrands(params?: { 
  page?: number; 
  limit?: number;
  search?: string;
  status?: string;
}) {
  const effectiveParams = params || { page: 1, limit: 9999 };
  
  const queryParams: Record<string, string> = {
    page: String(effectiveParams.page || 1),
    limit: String(effectiveParams.limit || 9999)
  };
  
  if (effectiveParams.search) queryParams.search = effectiveParams.search;
  if (effectiveParams.status) queryParams.status = effectiveParams.status;
  
  const queryString = '?' + new URLSearchParams(queryParams).toString();
  
  const data = await apiGetAuth(`/brands/all${queryString}`);
  
  if (!params) {
    return ensureArray(data?.brands || data, ['items', 'brands', 'data']);
  }
  
  return data;
}

export function getSingleBrand(id: string) {
  return apiGetAuth(`/brands/${id}`);
}

export function createBrand(data: any) {
  return apiPostAuth("/brands", data);
}

export function updateBrand(id: string, data: any) {
  return apiPutAuth(`/brands/${id}`, data);
}

export function deleteBrand(id: string) {
  return apiDeleteAuth(`/brands/${id}`);
}

export function disableBrand(id: string) {
  return apiPatchAuth(`/brands/${id}/disable`, {});
}

export function enableBrand(id: string) {
  return apiPatchAuth(`/brands/${id}/enable`, {});
}

// -------------------- CATEGORIES --------------------
export async function getCategories() {
  const res = await fetch(`${API_BASE}/categories`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch categories (${res.status})`);
  }
  const json = await res.json();
  
  const data = (json && (json.statusCode !== undefined || json.success !== undefined)) 
    ? (json.data ?? json) 
    : json;
  
  return ensureArray(data, ['items', 'categories', 'data']);
}

export async function getAdminCategories(params?: { 
  page?: number; 
  limit?: number;
  search?: string;
  status?: string;
}) {
  const effectiveParams = params || { page: 1, limit: 9999 };
  
  const queryParams: Record<string, string> = {
    page: String(effectiveParams.page || 1),
    limit: String(effectiveParams.limit || 9999)
  };
  
  if (effectiveParams.search) queryParams.search = effectiveParams.search;
  if (effectiveParams.status) queryParams.status = effectiveParams.status;
  
  const queryString = '?' + new URLSearchParams(queryParams).toString();
  
  const data = await apiGetAuth(`/categories/all${queryString}`);
  
  if (!params) {
    return ensureArray(data?.categories || data, ['items', 'categories', 'data']);
  }
  
  return data;
}

export function getSingleCategory(id: string) {
  return apiGetAuth(`/categories/${id}`);
}

export function createCategory(data: any) {
  return apiPostAuth("/categories", data);
}

export function updateCategory(id: string, data: any) {
  return apiPutAuth(`/categories/${id}`, data);
}

export function deleteCategory(id: string) {
  return apiDeleteAuth(`/categories/${id}`);
}

export function disableCategory(id: string) {
  return apiPatchAuth(`/categories/${id}/disable`, {});
}

export function enableCategory(id: string) {
  return apiPatchAuth(`/categories/${id}/enable`, {});
}

// -------------------- CONTACT SUBMISSIONS --------------------
export async function getAdminContactSubmissions(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  // FIXED: changed from /contact to /admin/contact-submissions (matches backend route)
  const data = await apiGetAuth(`/admin/contact-submissions?page=${page}&limit=${limit}`);
  return data;
}

// -------------------- HOMEPAGE MANAGEMENT --------------------
export async function getAdminHomepageBrands() {
  const data = await apiGetAuth("/admin/homepage/brands");
  return ensureArray(data, ['items', 'brands', 'data']);
}

export async function getAdminHomepageCategories() {
  const data = await apiGetAuth("/admin/homepage/categories");
  return ensureArray(data, ['items', 'categories', 'data']);
}

export async function getAdminTopPicksConfig() {
  const data = await apiGetAuth("/admin/homepage/top-picks");
  return data?.data || { pinnedProductIds: [], pinnedProducts: [] };
}

export async function updateAdminTopPicks(pinnedProductIds: string[]) {
  return apiPutAuth("/admin/homepage/top-picks", { pinnedProductIds });
}

export async function searchProductsForTopPicks(search: string = '', limit: number = 20) {
  const data = await apiGetAuth(`/admin/homepage/products-search?search=${encodeURIComponent(search)}&limit=${limit}`);
  return ensureArray(data, ['items', 'products', 'data']);
}

export async function browseProductsForTopPicks(page: number = 1, limit: number = 20) {
  const data = await apiGetAuth(`/admin/homepage/products-search?browse=true&page=${page}&limit=${limit}`);
  return {
    products: ensureArray(data, ['items', 'products', 'data']),
    pagination: data?.pagination || { page: 1, totalPages: 1, hasNext: false, hasPrev: false, totalCount: 0 }
  };
}