"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import Image from "next/image";
import Link from "next/link";

// Correct image imports from your folder
import hero1 from "../public/assets/hero/hero1.jpg"
import hero2 from "../public/assets/hero/hero2.jpg";
import foodImage from "@/app/assets/images/food.png";

const slides = [
  {
    image: hero1,
    title: "Bring The Taste Of Heritageraghu",
    subtitle: "Back To Your Kitchen",
    description: "Rediscover the art of healthy cooking.",
    button: "SHOP ALL COLLECTION",
    link: "/products",
  },
  {
    image: hero2,
    title: "Crafted With Tradition",
    subtitle: "Made For Modern Kitchens",
    description: "Premium cookware inspired by ancient wisdom.",
    button: "EXPLORE NOW",
    link: "/products",
  },
  {
    image: foodImage,
    title: "Traditional Kitchen",
    subtitle: "Healthy Cooking",
    description: "Cook with authentic traditional cookware.",
    button: "DISCOVER PRODUCTS",
    link: "/products",
  },
];

export default function HeroCarousel() {
  return (
    <section className="w-full">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4000 }}
        loop={true}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="grid md:grid-cols-2 h-[520px]">

              <Image
                src={slide.image}
                alt={slide.title}
                width={800}
                height={520}
                className="object-cover w-full h-full"
              />

              <div className="flex items-center bg-[#D9A441] px-12">
                <div>
                  <h1 className="text-4xl font-bold">
                    {slide.title}
                    <br />
                    <span className="text-white">{slide.subtitle}</span>
                  </h1>

                  <p className="mt-4">{slide.description}</p>

                  <Link href={slide.link}>
                    <button className="mt-6 bg-black text-white px-6 py-3">
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