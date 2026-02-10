"use client";

import "./globals.css";
import Navbar from "@/components/Navbar";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import Footer from "@/components/Footer";
import ClientProviders from "@/components/ClientProviders";
import { CartProvider } from "@/components/CartContext";
import { ToastProvider } from "@/components/ToastContext";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideFooter =
    pathname.startsWith("/admin") || pathname.startsWith("/account");

  const hideNavbar =
    pathname.startsWith("/admin") || pathname.startsWith("/account");

  const hideSecondaryNavbar =
    pathname.startsWith("/admin") || pathname.startsWith("/account");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <ClientProviders>
            <ToastProvider>
              {/* MAIN NAVBAR */}
              {!hideNavbar && <Navbar />}

              {/* SECONDARY CATEGORY NAVBAR */}
              {!hideSecondaryNavbar && <SecondaryNavbar />}

              <main className="min-h-screen bg-gray-50">
                {children}
              </main>

              {!hideFooter && <Footer />}
            </ToastProvider>
          </ClientProviders>
        </CartProvider>
      </body>
    </html>
  );
}
