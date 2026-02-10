"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryPage() {
  const { category } = useParams();
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subcategories/by-category?category=${category}`
    )
      .then((res) => res.json())
      .then(setSubcategories);
  }, [category]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Subcategories
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {subcategories.map((sub: any) => (
          <Link
            key={sub._id}
            href={`/categories/${category}/${sub.slug}`}
            className="border p-4 rounded hover:shadow"
          >
            <p className="font-semibold">{sub.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
