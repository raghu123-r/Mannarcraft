/**
 * Products API client
 * Handles all product-related API calls
 */

import { apiFetch, normalizeListResponse } from "@/lib/api";

export interface Product {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description?: string;
  images?: string[];
  price: number;
  mrp?: number;
  stock: number;
  brand?: any;
  category?: any;
  attributes?: any;
  isActive?: boolean;
}

export interface ProductsApiResponse {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Fetch products by brand ID or slug
 */
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  const data = await apiFetch<ProductsApiResponse>(
    `/api/products?brand=${encodeURIComponent(brandId)}`
  );
  return data?.items || [];
}

/**
 * Fetch products with filters
 * NOTE: backend supports ONLY category (slug or ObjectId)
 */
export async function getProducts(
  params?: Record<string, string | number>
): Promise<Product[]> {
  const queryString = params
    ? "?" + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  const data = await apiFetch<ProductsApiResponse>(`/api/products${queryString}`);
  return data?.items || [];
}
