/**
 * Brands API client
 * Handles all brand-related API calls
 * Updated: 2025-11-29 - Added defensive fallback logic for slug lookup
 */

import { apiFetch } from "@/lib/api";
import type {
  Brand,
  BrandsApiResponse,
  BrandApiResponse,
} from "@/lib/types/brand";
import {
  normalizeBrandsResponse,
  normalizeBrandResponse,
} from "@/lib/adapters/brand.adapter";

export interface BrandsPaginatedResponse {
  data: Brand[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Fetch all brands from the API
 * @returns Array of Brand objects
 * @throws Error if API request fails
 */
export async function getBrands(): Promise<Brand[]> {
  try {
    const response = await apiFetch<BrandsApiResponse>("/api/brands");

    // ADAPTER: Normalize response using adapter
    return normalizeBrandsResponse(response);
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    throw error;
  }
}

/**
 * Fetch brands with pagination
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated brands response
 */
export async function getBrandsPaginated(page: number = 1, limit: number = 12): Promise<BrandsPaginatedResponse> {
  try {
    const response = await apiFetch<any>(`/api/brands?page=${page}&limit=${limit}`);

    // Handle paginated response from backend
    const data = normalizeBrandsResponse(response);
    
    return {
      data,
      totalCount: response.totalCount || data.length,
      currentPage: response.currentPage || page,
      totalPages: response.totalPages || 1,
      hasNext: response.hasNext ?? false,
      hasPrev: response.hasPrev ?? false,
    };
  } catch (error) {
    console.error("Failed to fetch paginated brands:", error);
    throw error;
  }
}

/**
 * Slugify a string for comparison (same logic as backend)
 */
export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Fetch a single brand by slug with robust fallback logic
 * 1. Try /brands/{slug} (backend now handles slug/id/variations)
 * 2. If 404, fetch all brands and match client-side
 * @param slug - Brand slug identifier
 * @returns Brand object or null if not found
 */
export async function getBrand(slug: string): Promise<Brand | null> {
  const encodedSlug = encodeURIComponent(slug);
  
  try {
    // Primary attempt: backend should handle slug/id/variations
    const response = await apiFetch<BrandApiResponse>(`/api/brands/${encodedSlug}`);
    
    // ADAPTER: Normalize response using adapter
    const brand = normalizeBrandResponse(response);
    return brand;
  } catch (primaryError: any) {
    // Fallback: fetch all brands and search client-side
    try {
      const allBrands = await getBrands();
      
      // Normalize the search slug
      const normalizedSearch = slug.toLowerCase().trim();
      const slugifiedSearch = slugify(slug);
      
      // Try multiple matching strategies
      const brand = allBrands.find(b => {
        // Exact slug match
        if (b.slug?.toLowerCase() === normalizedSearch) return true;
        
        // Exact ID match
        if (b._id === slug) return true;
        
        // Slugified name match
        const slugifiedName = slugify(b.name);
        if (slugifiedName === slugifiedSearch) return true;
        
        // Case-insensitive name match
        if (b.name.toLowerCase() === normalizedSearch) return true;
        
        return false;
      });
      
      if (brand) {
        return brand;
      }
      
      return null;
    } catch (fallbackError) {
      console.error("Fallback brand search failed:", fallbackError);
      return null;
    }
  }
}

