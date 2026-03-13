"use client";

import Navbar from "@/components/Navbar";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import Footer from "@/components/Footer";
import ClientProviders from "@/components/ClientProviders";
import { CartProvider } from "@/components/CartContext";
import { ToastProvider } from "@/components/ToastContext";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";

  const hideLayout =
    pathname.startsWith("/admin") || pathname.startsWith("/account");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname]);

  return (
    <CartProvider>
      <ClientProviders>
        <ToastProvider>
          {!hideLayout && <Navbar />}

          {!hideLayout && <SecondaryNavbar />}

          <main className="min-h-screen bg-gray-50">
            {children}
          </main>

          {!hideLayout && <Footer />}
        </ToastProvider>
      </ClientProviders>
    </CartProvider>
  );
}
