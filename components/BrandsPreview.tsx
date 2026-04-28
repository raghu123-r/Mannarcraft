"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buildUrl } from "@/lib/api";
import type { Brand } from "@/lib/types/brand";
import { normalizeSrc } from "@/lib/normalizeSrc";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import GlobalLoader from "@/components/common/GlobalLoader";

export default function BrandsPreview() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      try {
        // ✅ FIXED: buildUrl("/homepage/brands") calls backend directly
        // bypasses Next.js rewrite rule — returns full logoUrl correctly
        const res = await fetch(buildUrl("/homepage/brands"), { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const json = await res.json();
        const data = json?.data || [];

        if (!cancelled) {
          const normalized = data.map((b: any) => ({
            ...b,
            logoUrl: b.logoUrl || null,
          }));
          setBrands(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setBrands([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative py-4 mb-4">
          <div className="flex items-center justify-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center">Brands</h2>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <GlobalLoader size="large" />
        </div>
      </section>
    );
  }

  if (error || !brands.length) {
    return null;
  }

  return (
    <section className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header row */}
      <div className="relative py-4">
        <div className="flex items-center justify-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center">Brands</h2>
        </div>

        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 hidden sm:block">
          <Link href="/brands" className="text-emerald-600 hover:underline font-medium">
            Explore more →
          </Link>
        </div>

        <div className="mt-3 sm:hidden text-right">
          <Link href="/brands" className="text-emerald-600 hover:underline font-medium">
            Explore more →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id || brand.slug}
            href={`/brands/${brand.slug || brand.id}`}
            className="p-4 sm:p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col items-center"
            aria-label={`View ${brand.name} brand`}
            style={{ minHeight: 140 }}
          >
            <div className="relative w-full h-16 sm:h-20">
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.name} logo`}
                  fill
                  className="object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/brand-placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs text-center px-2">
                  {brand.name}
                </div>
              )}
            </div>
            <div className="mt-3 flex-1 w-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-800 text-center">{brand.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}