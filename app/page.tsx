"use client";

import TopAnnouncementBar from "@/components/common/TopAnnouncementBar";
import ProductFeatures from "@/components/Home/ProductFeatures";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Product } from "@/lib/api/products.api";
import { buildUrl } from "@/lib/api";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";
import HomeTestimonials from "@/components/HomeTestimonials";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BrandsPreview = dynamic(() => import("@/components/BrandsPreview"), { ssr: false });
const HomeCategories = dynamic(() => import("@/components/HomeCategories"), { ssr: false });

const PRODUCTS_PER_BATCH = 8;
const MAX_PRODUCTS = 40;

// ── Types for Homepage Sections ───────────────────────────────────────────────

type SectionType = "products" | "categories" | "brands";

interface SectionItem {
  _id: string;
  title?: string;
  name?: string;
  slug: string;
  images?: string[];
  image?: string;
  logo?: string;
  price?: number;
  mrp?: number;
  stock?: number;
}

interface HomepageSectionData {
  _id: string;
  title: string;
  sectionType: SectionType;
  displayOrder: number;
  isActive: boolean;
  items: SectionItem[];
}

// ── Deduplicate products by _id to prevent duplicate React keys ───────────────
function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const id = p._id || (p as any).id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEPAGE SECTIONS COMPONENT (USER-FACING)
// ═════════════════════════════════════════════════════════════════════════════

function HomepageSections() {
  const [sections, setSections] = useState<HomepageSectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch(buildUrl("/api/homepage/sections"), {
          cache: "no-store",
        });
        const json = await res.json();
        setSections(Array.isArray(json.data) ? json.data : []);
      } catch {
        setSections([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSections();
  }, []);

  if (loading || sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => {
        if (!section.items || section.items.length === 0) return null;

        if (section.sectionType === "products") {
          return <ProductSection key={section._id} section={section} />;
        }
        if (section.sectionType === "categories") {
          return <CategorySection key={section._id} section={section} />;
        }
        if (section.sectionType === "brands") {
          return <BrandSection key={section._id} section={section} />;
        }
        return null;
      })}
    </>
  );
}

// ── Products Section ──────────────────────────────────────────────────────────

function ProductSection({ section }: { section: HomepageSectionData }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    el.addEventListener("scroll", update);
    update();
    return () => el.removeEventListener("scroll", update);
  }, [section.items]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="w-full bg-white py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {section.title}
          </h2>
          <div className="flex items-center gap-3">
            <Link href="/products" className="text-sm text-emerald-600 hover:underline font-medium">
              See all →
            </Link>
            <div className="flex gap-1">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {section.items.map((item, idx) => (
            <div
              key={item._id || `item-${idx}`}
              className="flex-shrink-0 w-44 sm:w-48 md:w-52"
            >
              <ProductCard product={item as unknown as Product} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

// ── Categories Section ────────────────────────────────────────────────────────

function CategorySection({ section }: { section: HomepageSectionData }) {
  return (
    <section className="w-full bg-gray-50 py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {section.title}
          </h2>
          <Link href="/categories" className="text-sm text-emerald-600 hover:underline font-medium">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {section.items.map((item, idx) => (
            <Link
              key={item._id || `cat-${idx}`}
              href={`/categories/${item.slug}`}
              className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name || "Category"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    🏷️
                  </div>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800 text-center leading-tight group-hover:text-emerald-700 transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Brands Section ────────────────────────────────────────────────────────────

function BrandSection({ section }: { section: HomepageSectionData }) {
  return (
    <section className="w-full bg-white py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {section.title}
          </h2>
          <Link href="/brands" className="text-sm text-emerald-600 hover:underline font-medium">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {section.items.map((item, idx) => (
            <Link
              key={item._id || `brand-${idx}`}
              href={`/brands/${item.slug}`}
              className="group flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                {item.logo ? (
                  <Image
                    src={item.logo}
                    alt={item.name || "Brand"}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300 p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    🏢
                  </div>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800 text-center leading-tight group-hover:text-emerald-700 transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seed, setSeed] = useState<number | null>(null);

  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || products.length >= MAX_PRODUCTS) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreProducts(); },
      { rootMargin: "300px", threshold: 0.1 }
    );
    if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, products.length]);

  useEffect(() => {
    const el = productScrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    el.addEventListener("scroll", update);
    update();
    return () => el.removeEventListener("scroll", update);
  }, [products]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const res = await fetch(
        buildUrl(`/api/homepage/top-picks?limit=${PRODUCTS_PER_BATCH}&offset=0`),
        { cache: "no-store" }
      );
      const json = await res.json();
      setProducts(deduplicateProducts(json.data || []));
      setSeed(json.seed);
      setHasMore(json.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const loadMoreProducts = useCallback(async () => {
    if (!seed || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        buildUrl(
          `/api/homepage/top-picks?limit=${PRODUCTS_PER_BATCH}&offset=${products.length}&seed=${seed}`
        ),
        { cache: "no-store" }
      );
      const json = await res.json();
      setProducts((prev) => deduplicateProducts([...prev, ...(json.data || [])]));
      setHasMore(json.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [seed, loadingMore, products.length]);

  const scrollProducts = (dir: "left" | "right") => {
    const el = productScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  const showViewMoreButton =
    products.length >= MAX_PRODUCTS || (!hasMore && products.length > 0);

  return (
    <div className="bg-white min-h-screen">
      {/* 🔥 TOP ANNOUNCEMENT BAR */}
      <TopAnnouncementBar />

      {/* 🟡 HERO SPLIT SECTION */}
      <section className="w-full bg-[#e2b14a]">
        <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="relative h-[280px] sm:h-[360px] md:h-[460px] w-full">
            <Image
              src="/images/hero-split.jpg"
              alt="Traditional Brass Cookware"
              fill
              priority
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:p-10 md:p-14 text-black">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
              Bring The Taste Of <span className="text-white">Heritage</span>
              <br />
              Back To Your Kitchen
            </h1>
            <p className="mt-4 text-sm sm:text-base md:text-lg max-w-lg">
              Rediscover the art of healthy cooking with our handcrafted Bronze,
              Brass, and Cast Iron cookware. Pure. Natural. Timeless.
            </p>
            <Link href="/products">
              <button className="mt-6 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
                SHOP ALL COLLECTIONS
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 🎞 HERO CAROUSEL */}
      <section className="bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6">
          <HeroCarousel />
        </div>
      </section>

      <BrandsPreview />

      {/* 🗂 CATEGORIES */}
      <HomeCategories />

      <ProductFeatures />

      {/* ⭐ CUSTOMER TESTIMONIALS */}
      <HomeTestimonials />

      {/* 🛒 TOP PICKS */}
      {(loading || products.length > 0) && (
        <section className="w-full bg-white py-6 sm:py-8">
          <div className="max-w-8xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Top Picks for You</h2>
              <div className="flex items-center gap-3">
                <Link href="/products" className="text-sm text-emerald-600 hover:underline font-medium">
                  See all offers →
                </Link>
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollProducts("left")}
                    disabled={!canScrollLeft}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollProducts("right")}
                    disabled={!canScrollRight}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <GlobalLoader size="large" />
              </div>
            ) : (
              <>
                <div
                  ref={productScrollRef}
                  className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {products.map((p, index) => {
                    const id = p._id || (p as any).id;
                    return (
                      <div
                        key={id ? `pick-${id}` : `pick-idx-${index}`}
                        className="flex-shrink-0 w-44 sm:w-48 md:w-52"
                      >
                        <ProductCard product={p} />
                      </div>
                    );
                  })}

                  {loadingMore && (
                    <div className="flex-shrink-0 w-44 sm:w-48 md:w-52 flex items-center justify-center">
                      <GlobalLoader size="medium" />
                    </div>
                  )}
                </div>

                {!loadingMore && hasMore && products.length < MAX_PRODUCTS && (
                  <div ref={loadMoreTriggerRef} className="h-4" />
                )}

                {!loading && showViewMoreButton && (
                  <div className="flex justify-center mt-6">
                    <Link href="/products">
                      <Button size="lg">View More Products</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>
      )}

      {/* ✅ DYNAMIC HOMEPAGE SECTIONS (from admin) */}
      <HomepageSections />
    </div>
  );
}