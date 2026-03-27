import "./globals.css";
import type { Metadata } from "next";
import ClientProviders from "@/components/ClientProviders";
import { CartProvider } from "@/components/CartContext";
import { ToastProvider } from "@/components/ToastContext";
import Navbar from "@/components/Navbar";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MannarCraft",
  description: "Premium brass and traditional cookware",
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <ClientProviders>
            <ToastProvider>
              {/* Navbar is sticky top-0 */}
              <Navbar />
              {/* SecondaryNavbar is sticky top-20 */}
              <SecondaryNavbar />
              {/* Main content — flex-1 fills remaining height */}
              <main className="flex-1 bg-gray-50">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </ClientProviders>
        </CartProvider>
      </body>
    </html>
  );
}