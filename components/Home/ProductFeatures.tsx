"use client";

import { useState } from "react";
import { Truck, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Free Delivery",
    desc: "All Over India On Orders Over ₹500.",
  },
  {
    icon: Users,
    title: "100000+",
    desc: "Happy Customers",
  },
  {
    icon: Settings,
    title: "Customization Facility",
    desc: "Products tailored to your needs.",
  },
  {
    icon: Truck,
    title: "Heirloom Quality",
    desc: "Crafted with timeless excellence.",
  },
  {
    icon: Users,
    title: "Direct From Authentic Crafters",
    desc: "Straight from artisans to you.",
  },
];

export default function ProductFeatures() {
  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex((prev) => (prev === 0 ? FEATURES.length - 1 : prev - 1));
  };

  const next = () => {
    setIndex((prev) => (prev === FEATURES.length - 1 ? 0 : prev + 1));
  };

  const visibleItems = [
    FEATURES[index],
    FEATURES[(index + 1) % FEATURES.length],
    FEATURES[(index + 2) % FEATURES.length],
  ];

  return (
    <section className="w-full bg-[#e6b547]">
      <div className="max-w-8xl mx-auto flex">
        {/* LEFT – SLIDER */}
        <div className="w-[75%] py-16 px-6 overflow-hidden">
          <div className="grid grid-cols-3 gap-6 transition-all duration-500">
            {visibleItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center">
                    <Icon size={28} />
                  </div>
                  <h4 className="font-semibold text-lg">{item.title}</h4>
                  <p className="text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT – BLACK PANEL */}
        <div className="w-[25%] bg-black text-white p-10 flex flex-col justify-center gap-6">
          <h3 className="text-2xl font-bold">Our Product Features</h3>
          <p className="text-sm opacity-80">
            Discover the most trending products in Mannarcraft.
          </p>

          <div className="flex gap-4">
            <button
              onClick={prev}
              className="w-10 h-10 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
