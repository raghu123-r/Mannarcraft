// components/HeroCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { buildUrl } from "@/lib/api";
interface HeroImage {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  displayOrder: number;
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<HeroImage[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalDuration] = useState(5000); // Default 5 seconds

  useEffect(() => {
    fetchHeroImages();
  }, []);

  async function fetchHeroImages() {
    try {
      const res = await fetch(buildUrl("/api/homepage/hero-images?limit=5"), { 
        cache: "no-store" 
      });
      
      if (!res.ok) throw new Error("Failed to fetch hero images");
      
      const json = await res.json();
      const images = json?.data || [];
      
      setSlides(Array.isArray(images) ? images : []);
    } catch (err) {
      console.error("Hero images fetch error:", err);
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slides.length === 0) return;
    
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, interval);
    
    return () => clearInterval(t);
  }, [slides.length, interval]);

  // Show minimal fallback during load
  if (loading) {
    return (
      <div className="relative mt-2 sm:mt-4">
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-[28rem] rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 animate-pulse"></div>
      </div>
    );
  }

  // Don't render if no hero images
  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative mt-2 sm:mt-4">
      {/* Banner Container */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-[28rem] rounded-lg sm:rounded-xl overflow-hidden bg-gray-100">
        {slides.map((s, i) => (
          <div
            key={s._id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={s.imageUrl}
              alt={s.title || "Hero Banner"}
              fill
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              priority={i === 0}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Text */}
            {(s.title || s.subtitle) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
                  {s.title && (
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg">
                      {s.title}
                    </h2>
                  )}
                  {s.subtitle && (
                    <p className="text-base sm:text-lg md:text-xl text-white/90 mt-3 drop-shadow-md">
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="flex gap-1.5 sm:gap-2 justify-center mt-2 sm:mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                i === idx ? "bg-orange-600 scale-110" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}