"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCart } from "@/components/CartContext";
import GlobalLoader from "@/components/common/GlobalLoader";

const CartBadgeClient = dynamic(() => import("./CartBadgeClient"), { ssr: false });

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout: authLogout } = useAuth();
  const { distinctCount: cartCount } = useCart();
  const headerRef = useRef<HTMLElement | null>(null);

  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* FIX MAIN PADDING */
  useEffect(() => {
    const update = () => {
      const main = document.querySelector("main") as HTMLElement | null;
      const header = headerRef.current;
      if (!main || !header) return;
      main.style.paddingTop = `${Math.round(header.getBoundingClientRect().height)}px`;
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* DROPDOWN CLICK OUTSIDE */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await authLogout();
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <header
      ref={headerRef}
      className="w-full sticky top-0 z-50 bg-[#0f1720] shadow-lg border-b border-gray-800/40"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* LOGO */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
             src="/mnrcraft-logo.png"
              alt="MNRCraft"
              width={160}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* DESKTOP NAV (NOW xl+) */}
          <ul className="hidden xl:flex items-center gap-8 text-sm font-medium text-gray-200">
            <li><Link href="/" className="hover:text-emerald-400">Home</Link></li>
            <li><Link href="/products" className="hover:text-emerald-400">Products</Link></li>
            <li><Link href="/categories" className="hover:text-emerald-400">Categories</Link></li>
            <li><Link href="/brands" className="hover:text-emerald-400">Brands</Link></li>
            <li><Link href="/services" className="hover:text-emerald-400">Services</Link></li>
            <li><Link href="/about" className="hover:text-emerald-400">About</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-400">Contact</Link></li>
          </ul>

          {/* SEARCH (EXPANDS md → < xl) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:block md:flex-1 md:mx-4 xl:flex-initial relative"
          >
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full md:max-w-[520px] xl:w-56 bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-4 flex-shrink-0">

            <Link href="/cart" className="relative text-gray-200 hover:text-emerald-400">
              <ShoppingCart className="h-6 w-6" />
              <CartBadgeClient />
            </Link>

            {loading ? (
              <GlobalLoader size="small" className="border-gray-400" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center"
                >
                  {getInitials(user.name, user.email)}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
                <Link href="/login" className="hover:text-emerald-400">Login</Link>
                <span>/</span>
                <Link href="/register" className="hover:text-emerald-400">Register</Link>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden text-gray-200 hover:text-emerald-400"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-gray-800/40 py-4 space-y-2">

            {/* MOBILE SEARCH */}
            <form onSubmit={handleSearch} className="relative md:hidden px-4">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm text-gray-200"
                placeholder="Search..."
              />
              <button
                type="submit"
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {["Home","Products","Categories","Brands","Services","About","Contact"].map((item) => (
              <Link
                key={item}
                href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className="block px-4 py-2 text-gray-200 hover:bg-gray-800/50 rounded"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}

            {/* LOGIN/REGISTER FOR MOBILE - SHOWN WHEN NOT LOGGED IN */}
            {!loading && !user && (
              <div className="flex items-center gap-2 px-4 pt-2 border-t border-gray-800/40 mt-2">
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2 text-gray-200 hover:bg-gray-800/50 rounded border border-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 text-center px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}