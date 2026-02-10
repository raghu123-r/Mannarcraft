"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    image: "/assets/hero/hero1.jpg",
    title: "Bring The Taste Of Heritage",
    subtitle: "Back To Your Kitchen",
    description:
      "Rediscover the art of healthy cooking with our handcrafted Bronze, Brass, and Cast Iron cookware. Pure. Natural. Timeless.",
    button: "SHOP ALL COLLECTIONS",
    link: "/products",
  },
  {
    image: "/assets/hero/hero2.jpg",
    title: "Crafted With Tradition",
    subtitle: "Made For Modern Kitchens",
    description:
      "Premium cookware inspired by ancient Indian culinary wisdom.",
    button: "EXPLORE NOW",
    link: "/products",
  },
];

export default function HeroCarousel() {
  return (
    // ✅ FORCE HEIGHT HERE
    <section className="w-full h-[520px]">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          // ✅ FORCE HEIGHT ON SLIDE
          <SwiperSlide key={index} className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">

              {/* LEFT IMAGE */}
              <div className="relative h-[260px] md:h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex items-center bg-[#E2AE4E] px-8 md:px-16 h-full">
                <div className="max-w-xl">
                  <h1 className="text-3xl md:text-5xl font-bold text-black leading-tight">
                    {slide.title}
                    <br />
                    <span className="text-white">{slide.subtitle}</span>
                  </h1>

                  <p className="mt-4 text-black text-base md:text-lg">
                    {slide.description}
                  </p>

                  <Link href={slide.link}>
                    <button className="mt-6 bg-black text-white px-6 py-3 font-semibold hover:bg-opacity-90 transition">
                      {slide.button}
                    </button>
                  </Link>
                </div>
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
