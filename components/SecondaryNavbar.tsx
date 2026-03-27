"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const categories = [
  { name: "Cookwares", slug: "cookwares" },
  { name: "Brass Lamps", slug: "brass-lamps" },
  { name: "Home Decor", slug: "home-decor" },
  { name: "Door Fittings", slug: "door-fittings" },
  { name: "Combo & Gifts", slug: "combo-gifts" },
];

export default function SecondaryNavbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-20 z-40 bg-[#f5b335] border-b shadow-sm w-full">
      <div className="max-w-7xl mx-auto flex items-center gap-8 px-4 py-3">

        {/* MAIN CATEGORIES BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold whitespace-nowrap"
        >
          ☰ MAIN CATEGORIES
        </button>

        {/* TOP LINKS */}
        <nav className="flex gap-6 text-sm font-medium overflow-x-auto">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="hover:underline whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* DROPDOWN PANEL */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full w-[280px] bg-white shadow-lg z-50"
        >
          <ul className="py-4">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex justify-between items-center px-5 py-3 hover:bg-gray-100"
                >
                  <span>{cat.name}</span>
                  <span className="bg-black text-white px-2 py-1 rounded">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}