"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSubCategory } from "@/lib/admin/subcategories";
import { getAdminCategories } from "@/lib/admin";

export default function NewSubCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getAdminCategories().then((res) => setCategories(res.categories || res));
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();

    await createSubCategory({
      name,
      description,
      category,
    });

    router.push("/admin/subcategories");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">Create SubCategory</h1>

      <input
        placeholder="SubCategory name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      >
        <option value="">Select Parent Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <button type="submit" className="btn-primary">
        Create
      </button>
    </form>
  );
}
