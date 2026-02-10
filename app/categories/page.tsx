"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryLogoUrl } from "@/lib/supabaseUrls";
import { buildUrl } from "@/lib/api";
import GlobalLoader from "@/components/common/GlobalLoader";
import Pagination from "@/components/common/Pagination";

const ITEMS_PER_PAGE = 12;

/* ---------------- TYPES ---------------- */

type Category = {
  _id: string;
  slug: string;
  name: string;
  image_url?: string;
  description?: string;
};

type SubCategory = {
  _id: string;
  name: string;
  slug: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
};

/* ---------------- PAGE CONTENT ---------------- */

function CategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<
    Record<string, SubCategory[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paginationInfo, setPaginationInfo] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch categories
        const catRes = await fetch(
          buildUrl(`/api/categories?page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
        );
        if (!catRes.ok) throw new Error("Failed to load categories");
        const catJson = await catRes.json();
        const categoryData: Category[] = catJson.data || [];

        setCategories(categoryData);
        setPaginationInfo({
          totalCount: catJson.totalCount || categoryData.length,
          currentPage: catJson.currentPage || currentPage,
          totalPages: catJson.totalPages || 1,
          hasNext: catJson.hasNext ?? false,
          hasPrev: catJson.hasPrev ?? false,
        });

        // 2️⃣ Fetch ALL subcategories (public API)
        try {
          const subRes = await fetch(buildUrl("/api/subcategories"));
          if (subRes.ok) {
            const subJson: SubCategory[] = await subRes.json();

            // 3️⃣ Group subcategories by category slug
            const grouped: Record<string, SubCategory[]> = {};
            subJson.forEach((sub) => {
              const catSlug = sub.category?.slug;
              if (!catSlug) return;
              if (!grouped[catSlug]) grouped[catSlug] = [];
              grouped[catSlug].push(sub);
            });

            setSubCategoriesMap(grouped);
          }
        } catch (subErr) {
          console.error("Failed to load subcategories:", subErr);
          // Continue without subcategories
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  /* ---------------- PAGINATION ---------------- */

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/categories?${params.toString()}`, { scroll: true });
  };

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <GlobalLoader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center py-20">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        No categories found
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HERO */}
      <section className="bg-gradient-to-br from-emerald-50 to-emerald-100 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Shop by Category</h1>
        </div>
      </section>

      {/* CATEGORY GRID */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const logoUrl =
                category.image_url ||
                getCategoryLogoUrl(category.slug) ||
                "/brand-placeholder.svg";

              const subs = subCategoriesMap[category.slug] || [];

              return (
                <Card
                  key={category._id}
                  className="border hover:shadow-lg transition"
                >
                  {/* CATEGORY IMAGE */}
                  <Link href={`/categories/${category.slug}`}>
                    <div className="relative h-48 bg-slate-100">
                      <Image
                        src={logoUrl}
                        alt={category.name}
                        fill
                        className="object-contain p-6"
                      />
                    </div>
                  </Link>

                  {/* CATEGORY TITLE */}
                  <CardHeader className="pb-2">
                    <Link href={`/categories/${category.slug}`}>
                      <CardTitle className="flex items-center justify-between">
                        {category.name}
                        <ChevronRight className="h-4 w-4" />
                      </CardTitle>
                    </Link>
                  </CardHeader>

                  {/* SUBCATEGORIES */}
                  {subs.length > 0 && (
                    <CardContent className="pt-0">
                      <ul className="space-y-1 text-sm">
                        {subs.slice(0, 6).map((sub) => (
                          <li key={sub._id}>
                            <Link
                              href={`/categories/${category.slug}/${sub.slug}`}
                              className="text-slate-600 hover:text-emerald-600"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* PAGINATION */}
          <Pagination
            currentPage={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            totalItems={paginationInfo.totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            hasNext={paginationInfo.hasNext}
            hasPrev={paginationInfo.hasPrev}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------------- SUSPENSE WRAPPER ---------------- */

export default function CategoriesPage() {
  return (
    <Suspense fallback={<GlobalLoader size="large" />}>
      <CategoriesPageContent />
    </Suspense>
  );
}
