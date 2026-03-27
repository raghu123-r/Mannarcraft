"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import FilterPanel from "@/components/FilterPanel";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { normalizeSrc } from "@/lib/normalizeSrc";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Search,
  Package,
  Tag,
  Grid3X3,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const ITEMS_PER_PAGE = 9;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter data
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch all brands and categories once on mount
  useEffect(() => {
    const fetchAllFilters = async () => {
      try {
        const [brandsResponse, categoriesResponse] = await Promise.all([
          apiGet("/brands"),
          apiGet("/categories"),
        ]);
        setAllBrands(Array.isArray(brandsResponse) ? brandsResponse : []);
        setAllCategories(
          Array.isArray(categoriesResponse) ? categoriesResponse : []
        );
      } catch {
        setAllBrands([]);
        setAllCategories([]);
      }
    };
    fetchAllFilters();
  }, []);

  // Fetch search results
  const fetchSearchResults = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await apiGet(
          `/search?q=${encodeURIComponent(q)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`
        );

        const fetchedProducts = response?.products || [];
        const pagination = response?.pagination || {};

        if (append) {
          setProducts((prev) => [...prev, ...fetchedProducts]);
        } else {
          setProducts(fetchedProducts);
          setBrands(response?.brands || []);
          setCategories(response?.categories || []);
        }

        setPage(pagination.page || pageNum);
        setHasMore(pagination.hasMore || false);
        setTotalResults(pagination.total || 0);
      } catch (err) {
        console.error("Search error:", err);
        if (!append) {
          setProducts([]);
          setBrands([]);
          setCategories([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q]
  );

  // Reset and fetch when query changes
  useEffect(() => {
    if (q.trim()) {
      setPage(1);
      setProducts([]);
      setFilteredProducts([]);
      fetchSearchResults(1, false);
    } else {
      setLoading(false);
      setProducts([]);
      setFilteredProducts([]);
      setBrands([]);
      setCategories([]);
    }
  }, [q, fetchSearchResults]);

  // Sync filtered products
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // ── Infinite scroll observer ───────────────────────────────────
  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchSearchResults(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchSearchResults, loading]);

  const handleFilterChange = useCallback((filtered: any[]) => {
    setFilteredProducts(filtered);
  }, []);

  const filterProps = {
    products,
    brands: allBrands.length > 0 ? allBrands : brands,
    categories: allCategories.length > 0 ? allCategories : categories,
    onFilterChange: handleFilterChange,
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f1720] via-[#162030] to-[#0f1720] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-400 hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-white font-medium">Search</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/25">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Search Results
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {loading ? (
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>Searching for &quot;{q}&quot;...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300">
                      Showing results for{" "}
                      <span className="text-white font-semibold bg-white/10 px-3 py-1 rounded-lg">
                        &quot;{q}&quot;
                      </span>
                    </p>
                    {totalResults > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-medium text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        {totalResults} {totalResults === 1 ? "item" : "items"} found
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            {!loading &&
              (filteredProducts.length > 0 ||
                brands.length > 0 ||
                categories.length > 0) && (
                <div className="flex items-center gap-3">
                  {filteredProducts.length > 0 && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <Package className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-sm">
                        <span className="font-bold text-white">{filteredProducts.length}</span>
                        <span className="text-gray-400 ml-1.5 hidden sm:inline">Products</span>
                      </div>
                    </div>
                  )}
                  {brands.length > 0 && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <Tag className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-sm">
                        <span className="font-bold text-white">{brands.length}</span>
                        <span className="text-gray-400 ml-1.5 hidden sm:inline">Brands</span>
                      </div>
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <Grid3X3 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-sm">
                        <span className="font-bold text-white">{categories.length}</span>
                        <span className="text-gray-400 ml-1.5 hidden sm:inline">Categories</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Mobile Filter */}
      <FilterPanel {...filterProps} mobileOnly={true} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative p-6 bg-white rounded-2xl shadow-xl">
                <GlobalLoader size="large" />
              </div>
            </div>
            <p className="mt-8 text-gray-500 font-medium animate-pulse">
              Finding the best matches for you...
            </p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-[280px] flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      Refine Results
                    </h2>
                  </div>
                  <div className="p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                    <FilterPanel {...filterProps} renderContentOnly={true} />
                  </div>
                </div>
              </div>
            </aside>

            {/* Results */}
            <main ref={resultsContainerRef} className="flex-1 min-w-0">
              {/* Products */}
              {filteredProducts.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Products</h2>
                        <p className="text-sm text-gray-500">
                          {filteredProducts.length} of {totalResults} results
                          {hasMore && (
                            <span className="text-emerald-600 font-medium">
                              {" "}· Scroll for more
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProducts.map((p) => (
                      <div key={p._id || p.slug || p.id}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>

                  {/* ── Infinite scroll trigger ── */}
                  {hasMore && (
                    <div
                      ref={loadMoreRef}
                      className="flex flex-col items-center justify-center py-10"
                    >
                      {loadingMore ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative p-4 bg-white rounded-full shadow-lg">
                              <GlobalLoader size="small" />
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 font-medium">
                            Loading more products...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-200" />
                          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                            Scroll to discover
                          </span>
                          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-200" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* End of results */}
                  {!hasMore && filteredProducts.length > 0 && (
                    <div className="flex items-center justify-center gap-4 py-8">
                      <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-200" />
                      <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                        All results loaded
                      </span>
                      <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-200" />
                    </div>
                  )}
                </section>
              )}

              {/* Brands */}
              {brands.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Matching Brands</h2>
                      <p className="text-sm text-gray-500">{brands.length} brands found</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brands.map((b) => (
                      <Link
                        key={b._id || b.slug || b.id}
                        href={`/brands/${b.slug}`}
                        className="group relative bg-white rounded-2xl border border-gray-100 p-5
                                   hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10
                                   transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300" />
                        <div className="relative flex flex-col items-center text-center gap-3">
                          {b.logoUrl ? (
                            <div className="w-16 h-16 relative flex items-center justify-center bg-gray-50 rounded-xl p-2 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                              <Image
                                src={normalizeSrc(b.logoUrl)}
                                alt={b.name || "Brand"}
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center group-hover:from-emerald-100 group-hover:to-teal-50 transition-all duration-300">
                              <Tag className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300 line-clamp-1">
                              {b.name}
                            </span>
                            <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-gray-400 group-hover:text-emerald-600 transition-colors">
                              <span>View products</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <Grid3X3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Related Categories</h2>
                      <p className="text-sm text-gray-500">{categories.length} categories found</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {categories.map((c) => (
                      <Link
                        key={c._id || c.slug || c.id}
                        href={`/categories/${c.slug}`}
                        className="group inline-flex items-center gap-2.5 px-5 py-3 bg-white border border-gray-100 rounded-xl
                                   hover:border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50
                                   hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">
                          {c.name}
                        </span>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-emerald-100 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {filteredProducts.length === 0 &&
                brands.length === 0 &&
                categories.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-gray-100/50 rounded-full blur-3xl scale-150" />
                      <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-white rounded-3xl flex items-center justify-center shadow-xl border border-gray-100">
                        <Search className="w-12 h-12 text-gray-300" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No results found</h3>
                    <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
                      We couldn&apos;t find anything matching{" "}
                      <span className="font-semibold text-gray-700">&quot;{q}&quot;</span>. Try
                      different keywords or explore our collections.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/products"
                        className="group inline-flex items-center justify-center gap-2 px-6 py-3.5
                                   bg-gradient-to-r from-[#0f1720] to-[#1a2836] text-white rounded-xl font-medium
                                   hover:from-[#162030] hover:to-[#243444] shadow-lg shadow-gray-900/20 transition-all duration-300"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Browse All Products
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/categories"
                        className="group inline-flex items-center justify-center gap-2 px-6 py-3.5
                                   bg-white border border-gray-200 text-gray-700 rounded-xl font-medium
                                   hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300"
                      >
                        <Grid3X3 className="w-4 h-4" />
                        View Categories
                      </Link>
                    </div>
                  </div>
                )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafbfc]">
          <div className="bg-gradient-to-r from-[#0f1720] via-[#162030] to-[#0f1720]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div className="h-9 w-56 bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-6 bg-white rounded-2xl shadow-xl">
                  <GlobalLoader size="large" />
                </div>
              </div>
              <p className="mt-8 text-gray-500 font-medium animate-pulse">
                Loading search results...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}