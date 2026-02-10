"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "SHINE JOSE",
    role: "Business owner",
    text: "Wonderful Aranmula Kannadi from Mannar Craft—great service, custom care, superb quality, careful packing, fast delivery. Highly recommended. Yes!",
    avatar: "/avatars/shine.jpg",
  },
  {
    name: "NANDINI NAIR",
    role: "House wife",
    text: "Found Mannar Craft while searching for ottu uruli; loved the variety. Ordered uruli and nilavilakku; arrived in 7 days, well packed. Very happy :)",
    avatar: "/avatars/nandini.jpg",
  },
  {
    name: "shidhi P.R",
    role: "",
    initial: "S",
    color: "bg-purple-600",
    text: "Loved the quality, custom work, and timely delivery from Mannar Craft. Great online buying experience and friendly support. Highly recommended.",
  },
  {
    name: "ramachandran achary",
    role: "",
    initial: "R",
    color: "bg-green-900",
    text: "Bought a beautifully crafted aluvilakku from Mannar Craft; perfect finish, arrived safely, glows magnificently. Truly superb!",
  },
  {
    name: "Thamanna",
    role: "House wife",
    initial: "T",
    color: "bg-green-700",
    text: "Great quality and sturdy products, fast delivery, and smooth service. Highly recommend this site. Truly dependable.",
  },
];

export default function HomeTestimonials() {
  const [index, setIndex] = useState(0);
  const visible = 3;

  const prev = () =>
    setIndex(index === 0 ? testimonials.length - visible : index - 1);
  const next = () =>
    setIndex((index + 1) % testimonials.length);

  return (
    <section className="bg-[#fff7ed] py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Check Out What Our Customers Are Saying!
      </h2>

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Left Arrow */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#f3c46f] w-10 h-10 rounded-full flex items-center justify-center shadow z-10"
        >
          <ChevronLeft />
        </button>

        {/* Cards */}
        <div className="flex gap-6 justify-center overflow-hidden">
          {testimonials.slice(index, index + visible).map((t, i) => (
            <div
              key={i}
              className="bg-[#f3f3f3] rounded-xl p-6 w-[320px] shadow-md"
            >
              <div className="flex items-center gap-4 mb-4">
                {t.avatar ? (
                  <img
                    src={t.avatar}
                    className="w-14 h-14 rounded-full object-cover"
                    alt={t.name}
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${t.color}`}
                  >
                    {t.initial}
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {t.text}
              </p>

              <div className="text-[#f3a000] font-semibold">{t.name}</div>
              {t.role && (
                <div className="text-xs text-gray-500">{t.role}</div>
              )}
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#f3c46f] w-10 h-10 rounded-full flex items-center justify-center shadow z-10"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Dot */}
      <div className="flex justify-center mt-8">
        <span className="w-3 h-3 rounded-full bg-[#f3a000]" />
      </div>
    </section>
  );
}
