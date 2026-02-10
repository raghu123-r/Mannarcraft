"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="w-full bg-[#e2b14a]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center">
        
        {/* LEFT IMAGE */}
        <div className="relative w-full h-[300px] md:h-[450px]">
          <Image
            src="/images/hero-brass-food.jpg"
            alt="Traditional Brass Cookware"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="p-8 md:p-14 text-black">
          <h1 className="text-3xl md:text-4xl font-bold leading-snug">
            Bring The Taste Of <span className="text-white">Heritage</span>
            <br /> Back To Your Kitchen
          </h1>

          <p className="mt-4 text-base md:text-lg max-w-lg">
            Rediscover the art of healthy cooking with our handcrafted Bronze,
            Brass, and Cast Iron cookware. Pure. Natural. Timeless.
          </p>

          <button className="mt-6 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            SHOP ALL COLLECTIONS
          </button>
        </div>

      </div>
    </section>
  );
}
