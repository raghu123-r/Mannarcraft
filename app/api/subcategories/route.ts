import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subcategories/all`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch subcategories" },
        { status: res.status },
      );
    }

    const data = await res.json();

    // Unwrap backend envelope { statusCode, success, error, data }
    // If backend returns envelope, extract data; otherwise return as-is
    let subcategories = data;
    if (data && typeof data === "object" && ("statusCode" in data || "success" in data)) {
      if (data.success && data.data) {
        subcategories = data.data;
      } else if (!data.success) {
        return NextResponse.json(
          { error: data.error?.message || data.message || "Failed to fetch subcategories" },
          { status: data.statusCode || 500 }
        );
      }
    }

    // Ensure we return an array
    const subcategoriesArray = Array.isArray(subcategories)
      ? subcategories
      : (subcategories?.items || subcategories?.subcategories || []);

    return NextResponse.json(subcategoriesArray);
  } catch (error) {
    console.error("Subcategories API error:", error);
    return NextResponse.json(
      { error: "Backend not available" },
      { status: 503 },
    );
  }
}