"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mk-backend-a6c7.onrender.com/api";

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWishlist() {
      try {
        setLoading(true);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          setError("Please login to view your wishlist");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || !data?.user) {
          throw new Error(data?.message || "Failed to load wishlist");
        }

        // user.wishlist already populated with products
        setProducts(Array.isArray(data.user.wishlist) ? data.user.wishlist : []);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Loading wishlist...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        Your wishlist is empty ❤️
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        My Wishlist
      </h1>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product._id || product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
