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
import HomeTestimonials from "@/components/HomeTestimonials"; // ✅ ADDED

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

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || products.length >= MAX_PRODUCTS) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreProducts();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observerRef.current = observer;
    if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, products.length]);

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

  const showViewMoreButton = products.length >= MAX_PRODUCTS || (!hasMore && products.length > 0);

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
      <HomeCategories />
      <ProductFeatures />

      {/* ⭐ CUSTOMER TESTIMONIALS (NEW – MannarCraft UI) */}
      <HomeTestimonials />

      {/* 🛒 TOP PRODUCTS */}
      {(loading || products.length > 0) && (
        <section className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
          <h2 className="text-xl font-bold text-center mb-6">Top Picks for You</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 flex justify-center py-12">
                <GlobalLoader size="large" />
              </div>
            ) : (
              products.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))
            )}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-8">
              <GlobalLoader size="medium" />
            </div>
          )}

          {!loading && hasMore && (
            <div ref={loadMoreTriggerRef} className="h-10" />
          )}

          {!loading && showViewMoreButton && (
            <div className="flex justify-center mt-8">
              <Link href="/products">
                <Button size="lg">View More Products</Button>
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
