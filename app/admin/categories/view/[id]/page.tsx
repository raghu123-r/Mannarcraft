// Read-only Category View page — lists products in this category and their brand names (no edit)
"use client";

import { useEffect, useState } from "react";
import { getSingleCategory, getAdminProducts, getAdminBrands } from "@/lib/admin";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";

export default function CategoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // Track delete operation state

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const [catRes, prodData, brandsData] = await Promise.all([
          getSingleCategory(id),
          getAdminProducts(),
          getAdminBrands(),
        ]);

        // Defensive access to category in response
        const cat = catRes?.category ?? catRes?.data?.category ?? catRes ?? null;
        setCategory(cat);

        // API functions return arrays directly via ensureArray
        setProducts(Array.isArray(prodData) ? prodData : []);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (e) {
        console.error("Failed to load category data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  /**
   * Handle category deletion with confirmation
   * Confirms with user, calls DELETE API, shows feedback, and redirects on success
   */
  const handleDelete = async () => {
    // Confirm deletion with user
    if (!confirm('Are you sure you want to permanently delete this category and all its associations? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      // Get auth token from localStorage (same pattern as lib/admin.ts)
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      
      // Build API URL using the category ID
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://mk-backend-a6c7.onrender.com/api";
      const url = `${API_BASE}/admin/categories/${id}`;

      // Make DELETE request to backend
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include', // Include cookies for auth
      });

      // Parse response
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show error message from server or fallback
        const errorMsg = data.message || data.error?.message || 'Failed to delete category';
        toast.error(errorMsg);
        setIsDeleting(false);
        return;
      }

      // Success: show notification and redirect
      toast.success(data.message || 'Category deleted successfully');
      router.push('/admin/categories');
    } catch (err: any) {
      // Handle network errors or unexpected exceptions
      console.error('Delete error:', err);
      toast.error(err.message || 'An error occurred while deleting the category');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <GlobalLoader size="large" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Category not found</p>
          <Link
            href="/admin/categories"
            className="text-blue-600 hover:underline"
          >
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  // Filter products in this category
  const productsInCategory = products?.filter(
    (p) => String(p.category?._id || p.category) === String(category._id || category.id)
  ) ?? [];

  // Calculate distinct brand count
  const brandCount = Array.from(
    new Set(
      productsInCategory
        .map((p) => String(p.brand?._id || p.brand))
        .filter(Boolean)
    )
  ).length ?? 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Category: {category?.name ?? "-"}
        </h1>
        <div className="space-x-3">
          <Link
            href="/admin/categories"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back to Categories
          </Link>
          <Link
            href={`/admin/categories/${category._id || category.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-white border border-red-300 text-red-700 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Category Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong className="text-sm text-gray-600">Name</strong>
            <div className="mt-1">{category?.name ?? "-"}</div>
          </div>
          <div>
            <strong className="text-sm text-gray-600">Slug</strong>
            <div className="mt-1 text-gray-700">{category?.slug ?? "-"}</div>
          </div>
          <div>
            <strong className="text-sm text-gray-600">#Products</strong>
            <div className="mt-1">{productsInCategory.length}</div>
          </div>
          <div>
            <strong className="text-sm text-gray-600">#Brands</strong>
            <div className="mt-1">{brandCount}</div>
          </div>
          <div className="col-span-2">
            <strong className="text-sm text-gray-600">Description</strong>
            <div className="mt-1 text-gray-700">
              {category?.description || "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Products in this category ({productsInCategory.length})
        </h2>

        {productsInCategory.length > 0 ? (
          <div className="space-y-3">
            {productsInCategory.map((p) => {
              // Resolve brand name defensively
              const brandName =
                p?.brand?.name ??
                brands?.find((b) => String(b._id || b.id) === String(p.brand?._id || p.brand))
                  ?.name ??
                "-";

              // Get product image - filter out placeholder and invalid URLs
              const productImage =
                Array.isArray(p?.images) && p.images.length > 0
                  ? p.images.find((img: any) => 
                      typeof img === 'string' && 
                      img.trim() !== '' && 
                      !img.includes('via.placeholder.com')
                    ) || null
                  : null;

              return (
                <div
                  key={p._id || p.id}
                  className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={p?.title ?? "Product"}
                        className="w-16 h-16 object-cover rounded"
                        width={500}
                        height={500}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Image
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/admin/products/${p._id || p.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {p?.title ?? "-"}
                      </Link>
                      <div className="text-sm text-gray-600">
                        Brand: {brandName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{p?.price?.toLocaleString() ?? "-"}
                    </div>
                    <div className="text-sm text-gray-600">
                      Stock: {p?.stock ?? "-"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No products found in this category
          </div>
        )}
      </div>
    </div>
  );
}
