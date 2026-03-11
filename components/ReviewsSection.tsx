"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, TrendingUp } from "lucide-react";
import { getProductReviews, submitReview, Review } from "@/lib/api/reviews.api";
import { ApiError } from "@/lib/api";
import GlobalLoader from "@/components/common/GlobalLoader";

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Load initial reviews (page 1) when component mounts
  useEffect(() => {
    if (!productId) return;

    const fetchInitialReviews = async () => {
      setLoading(true);
      try {
        const data = await getProductReviews(productId, 1);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setTotalReviews(data.totalReviews || 0);
        setCurrentPage(data.currentPage || 1);
        setHasNextPage(data.hasNextPage || false);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setReviews([]);
        setTotalReviews(0);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialReviews();
  }, [productId]);

  // Load more reviews
  const loadMoreReviews = async () => {
    if (loadingMore || !hasNextPage) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await getProductReviews(productId, nextPage);
      const newReviews = Array.isArray(data.reviews) ? data.reviews : [];
      setReviews([...reviews, ...newReviews]);
      setCurrentPage(data.currentPage || nextPage);
      setHasNextPage(data.hasNextPage || false);
    } catch (err) {
      console.error("Failed to load more reviews:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculate average rating
  const averageRating =
    Array.isArray(reviews) && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: Array.isArray(reviews) ? reviews.filter((r) => r.rating === star).length : 0,
    percentage:
      Array.isArray(reviews) && reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }));

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !comment.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newReview = await submitReview({
        productId,
        name: name.trim(),
        rating,
        comment: comment.trim(),
      });

      const currentReviews = Array.isArray(reviews) ? reviews : [];
      setReviews([newReview, ...currentReviews]);
      setTotalReviews(totalReviews + 1);

      setName("");
      setRating(5);
      setComment("");

      setError("Review submitted successfully!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <GlobalLoader size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* RATINGS OVERVIEW SECTION */}
      {Array.isArray(reviews) && reviews.length > 0 && (
        <div className="mb-10">
          <div className="bg-gradient-to-br from-white via-emerald-50/30 to-white rounded-2xl border-2 border-emerald-100 shadow-lg overflow-hidden">
            <div className="grid lg:grid-cols-5 gap-8 p-8">
              {/* LEFT: Average Rating Display */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-4 border-b lg:border-b-0 lg:border-r border-emerald-100">
                <div className="mb-3">
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-emerald-800 leading-none">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        strokeWidth={2}
                        className={
                          star <= Math.round(averageRating)
                            ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                            : "text-gray-300 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 mt-2">
                  {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Overall Rating</p>
              </div>

              {/* RIGHT: Rating Distribution */}
              <div className="lg:col-span-3 space-y-2.5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-emerald-600" size={18} />
                  <h4 className="text-sm font-bold text-gray-900">Rating Distribution</h4>
                </div>
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 justify-end">
                      <span className="text-sm font-semibold text-gray-700">{star}</span>
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-12 text-right">
                      {count} {count === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO COLUMN LAYOUT */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Review Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden sticky top-24">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center gap-2.5 text-white">
                <MessageSquare size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">Write a Review</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm font-medium placeholder:text-gray-400"
                  placeholder="John Doe"
                  maxLength={100}
                  required
                />
              </div>

              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                  Your Rating
                </label>
                <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-4 border-2 border-gray-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
                    >
                      <Star
                        size={28}
                        strokeWidth={2}
                        className={
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400 drop-shadow-md"
                            : "text-gray-300 fill-gray-100"
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm font-semibold text-gray-700 mt-2">
                  {rating} out of 5 stars
                </p>
              </div>

              {/* Comment Textarea */}
              <div>
                <label
                  htmlFor="comment"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Your Review
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-sm leading-relaxed placeholder:text-gray-400"
                  placeholder="Share your experience with this product..."
                  maxLength={1000}
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">Be specific and honest</span>
                  <span className="text-xs font-medium text-gray-500">{comment.length}/1000</span>
                </div>
              </div>

              {/* Error/Success Message */}
              {error && (
                <div
                  className={`text-sm px-4 py-3 rounded-xl font-medium ${
                    error.includes("success")
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                      : "bg-red-50 text-red-700 border-2 border-red-200"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                {submitting ? (
                  <>
                    <GlobalLoader size="small" className="border-white" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {!Array.isArray(reviews) || reviews.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full mb-5 shadow-lg">
                <MessageSquare className="text-emerald-600" size={40} strokeWidth={2} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Be the first to share your experience with this product
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  Showing {reviews.length} of {totalReviews}
                </span>
              </div>

              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all overflow-hidden group"
                  >
                    <div className="p-6">
                      {/* Header: Name, Rating, Date */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* ✅ FIXED: Pure letter avatar — no image, no broken icon */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 select-none">
                              {review.name
                                ? review.name.trim().charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">{review.name}</h4>
                              <p className="text-xs text-gray-500 font-medium">
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              strokeWidth={2}
                              className={
                                star <= review.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-300 fill-gray-200"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Comment */}
                      <div className="pl-0 lg:pl-13">
                        <p className="text-gray-700 leading-relaxed text-[15px]">
                          {review.comment}
                        </p>
                      </div>
                    </div>

                    {/* Most Recent Badge */}
                    {index === 0 && (
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-6 py-2 border-t border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Most Recent Review
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreReviews}
                    disabled={loadingMore}
                    className="bg-white hover:bg-gray-50 text-emerald-700 border-2 border-emerald-600 hover:border-emerald-700 px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    {loadingMore ? (
                      <>
                        <GlobalLoader size="small" className="border-emerald-600" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Reviews
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          +3
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}