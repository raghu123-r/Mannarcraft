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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seed, setSeed] = useState<number | null>(null);

  // Infinite scroll trigger ref
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Horizontal scroll for products
  const productScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ── Initial fetch ──────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  // ── Infinite scroll observer ───────────────────────────────────
  useEffect(() => {
    if (!hasMore || loading || loadingMore || products.length >= MAX_PRODUCTS) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreProducts();
      },
      { rootMargin: "300px", threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, products.length]);

  // ── Track horizontal scroll for arrow buttons ─────────────────
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
      setProducts(json.data || []);
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
      setProducts((prev) => [...prev, ...(json.data || [])]);
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

      {/* 🗂 CATEGORIES — Amazon-style horizontal scroll */}
      <HomeCategories />

      <ProductFeatures />

      {/* ⭐ CUSTOMER TESTIMONIALS */}
      <HomeTestimonials />

      {/* 🛒 TOP PICKS — Horizontal scroll + infinite scroll */}
      {(loading || products.length > 0) && (
        <section className="w-full bg-white py-6 sm:py-8">
          <div className="max-w-8xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Top Picks for You</h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/products"
                  className="text-sm text-emerald-600 hover:underline font-medium"
                >
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
                {/* Horizontal scroll row */}
                <div
                  ref={productScrollRef}
                  className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {products.map((p) => (
                    <div key={p._id || p.id} className="flex-shrink-0 w-44 sm:w-48 md:w-52">
                      <ProductCard product={p} />
                    </div>
                  ))}

                  {/* Inline loader at end of scroll row while loading more */}
                  {loadingMore && (
                    <div className="flex-shrink-0 w-44 sm:w-48 md:w-52 flex items-center justify-center">
                      <GlobalLoader size="medium" />
                    </div>
                  )}
                </div>

                {/* Invisible infinite scroll trigger */}
                {!loadingMore && hasMore && products.length < MAX_PRODUCTS && (
                  <div ref={loadMoreTriggerRef} className="h-4" />
                )}

                {/* View more button when max reached */}
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
    </div>
  );
}