// Updated products/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import GlobalLoader from "@/components/common/GlobalLoader";

interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp?: number;
  images?: string[];
  brand?: { name: string };
  category?: { name: string };
  stock: number;
}

interface PaginationData {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

const ITEMS_PER_PAGE = 12;

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationData, setPaginationData] = useState<PaginationData>({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const categoryFilter = searchParams.get("category") || "";
  const brandFilter = searchParams.get("brand") || "";

  // Fetch products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query string with all filters
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", ITEMS_PER_PAGE.toString());
        
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (categoryFilter) {
          params.set("category", categoryFilter);
        }
        if (brandFilter) {
          params.set("brand", brandFilter);
        }
        
        const data = await apiGet(`/api/products?${params.toString()}`);
        
        // Handle both array response and object with items
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        const total = Array.isArray(data) ? data.length : (data?.total ?? 0);
        const page = Array.isArray(data) ? 1 : (data?.page ?? 1);
        const pages = Array.isArray(data) ? 1 : (data?.pages ?? 1);
        
        setPaginationData({
          items,
          total,
          page,
          pages,
        });
        
        setProducts(items);
      } catch (err) {
        console.error("Failed to load products", err);
        setPaginationData({ items: [], total: 0, page: 1, pages: 1 });
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchQuery, categoryFilter, brandFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationData.pages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    
    router.push(`/products?${params.toString()}`, { scroll: true });
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    
    // Reset to page 1 when searching
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    
    router.push(`/products?${params.toString()}`);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const { page: current, pages: total } = paginationData;

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push("...");
      }

      // Show current page and surrounding pages
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  // Calculate showing range
  const startItem = (paginationData.page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(
    paginationData.page * ITEMS_PER_PAGE,
    paginationData.total
  );

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">All Products</h1>
          {/* subtitle removed per design update */}

          {/* Removed inner page search bar as per updated UI requirement */}
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <GlobalLoader size="large" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No products found
              </h3>
              <p className="text-slate-600">Try adjusting your search</p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="flex flex-col divide-y divide-gray-200 md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {paginationData.pages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-6">
                  {/* Showing X-Y of Z */}
                  <p className="text-sm text-slate-600">
                    Showing {startItem}–{endItem} of {paginationData.total} products
                  </p>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum, idx) => {
                      if (pageNum === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-3 py-2 text-slate-400"
                          >
                            ...
                          </span>
                        );
                      }

                      const page = pageNum as number;
                      const isActive = page === currentPage;

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[40px] px-4 py-2 rounded-lg border transition ${
                            isActive
                              ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          aria-label={`Go to page ${page}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationData.pages}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen">
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">All Products</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">Loading products...</div>
          </div>
        </section>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
