"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, buildQueryString } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function SubCategoryPage() {
  const params = useParams();
  const { category, subcategory } = params as {
    category: string;
    subcategory: string;
  };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const qs = buildQueryString({
          category,
          subcategory,
        });

        const data = await apiGet(`/products${qs}`);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [category, subcategory]);

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!products.length) {
    return (
      <div className="p-10 text-center">
        No products found for this subcategory
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 capitalize">
        {subcategory.replace("-", " ")}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}