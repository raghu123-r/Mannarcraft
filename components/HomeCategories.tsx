"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { buildUrl } from "@/lib/api";
import { getCategoryLogoUrl } from "@/lib/supabaseUrls";
import GlobalLoader from "@/components/common/GlobalLoader";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Category = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  imageUrl?: string;
  image?: string;
  imagePath?: string;
};

export default function HomeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl("/api/homepage/categories"), { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? [];
        const cats: Category[] = Array.isArray(data) ? data : [];

        const withImages = await Promise.all(
          cats.map(async (c) => {
            const apiImageUrl = c.imageUrl ?? c.image ?? "";
            let img = "";
            try {
              img = apiImageUrl || getCategoryLogoUrl(c.slug ?? c._id ?? "") || "";
            } catch {
              img = apiImageUrl || "";
            }
            return { ...c, imageUrl: img };
          })
        );

        if (mounted) {
          setCategories(withImages);
          setErr(null);
        }
      } catch (e: any) {
        if (mounted) {
          setCategories([]);
          setErr(e?.message ?? "Failed to load");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    updateScrollButtons();
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [categories]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-6 sm:py-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-6">
            Shop by Category
          </h2>
          <div className="flex justify-center py-12">
            <GlobalLoader size="large" />
          </div>
        </div>
      </section>
    );
  }

  if (err || !categories.length) return null;

  return (
    <section className="w-full bg-white py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Categories</h2>
          <div className="flex items-center gap-3">
            <Link href="/categories" className="text-sm text-emerald-600 hover:underline font-medium">
              See all offers →
            </Link>
            {/* Arrow buttons */}
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

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => {
              const id = cat._id ?? cat.id ?? cat.slug;
              const slug =
                cat.slug ??
                (cat.name
                  ? String(cat.name).toLowerCase().replace(/\s+/g, "-")
                  : id);
              const img = cat.imageUrl ?? "";

              return (
                <Link
                  href={`/categories/${slug}`}
                  key={String(id)}
                  className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-white rounded-lg border border-slate-100 hover:shadow-md hover:border-slate-200 transition p-3 flex flex-col items-center text-center"
                  aria-label={`Category ${cat.name ?? "Category"}`}
                >
                  <div className="w-full h-28 sm:h-32 flex items-center justify-center rounded overflow-hidden bg-gray-50 mb-2">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={cat.name ?? "Category image"}
                        className="object-contain w-24 h-24"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                    {cat.name ?? "Untitled"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hide scrollbar cross-browser */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}