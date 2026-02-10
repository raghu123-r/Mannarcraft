/**
 * Reviews API
 * Handles fetching and submitting product reviews
 */

import { apiGet, apiPost } from "@/lib/api";

export interface Review {
  _id: string;
  product: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  productId: string;
  name: string;
  rating: number;
  comment: string;
}

export interface PaginatedReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Fetch paginated reviews for a specific product (limit = 3 per page)
 * This is lazy-loaded only when the product detail page is opened
 */
export async function getProductReviews(
  productId: string, 
  page: number = 1
): Promise<PaginatedReviewsResponse> {
  try {
    const data = await apiGet<PaginatedReviewsResponse>(
      `/api/reviews/products/${productId}/reviews?page=${page}`
    );
    return data || {
      reviews: [],
      totalReviews: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false
    };
  } catch (error) {
    console.error(`Failed to fetch reviews for product "${productId}":`, error);
    return {
      reviews: [],
      totalReviews: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false
    };
  }
}

/**
 * Submit a new review for a product
 */
export async function submitReview(reviewData: CreateReviewData): Promise<Review> {
  try {
    const data = await apiPost<Review>('/api/reviews', reviewData);
    return data;
  } catch (error) {
    console.error('Failed to submit review:', error);
    throw error;
  }
}
