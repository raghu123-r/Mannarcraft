import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mk-backend-a6c7.onrender.com/api";

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    // Build backend URL with query params
    const backendUrl = `${BACKEND_URL}/api/products${queryString ? `?${queryString}` : ""}`;

    console.log("➡️ Frontend API: Proxying to backend:", backendUrl);

    const res = await fetch(backendUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to fetch products" }));
      return NextResponse.json(
        errorData,
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Unwrap backend envelope { statusCode, success, error, data }
    let products = data;
    if (data && typeof data === "object" && ("statusCode" in data || "success" in data)) {
      if (data.success && data.data) {
        products = data.data;
      } else if (!data.success) {
        return NextResponse.json(
          { error: data.error?.message || data.message || "Failed to fetch products" },
          { status: data.statusCode || 500 }
        );
      }
    }
    
    // For paginated endpoints, backend may return { items: [], total, page, pages }
    // Keep the whole object for pagination, but ensure items is an array
    if (products && typeof products === "object" && !Array.isArray(products)) {
      if (products.items) {
        // Ensure items is an array
        products.items = Array.isArray(products.items) ? products.items : [];
      } else {
        // If no items key but has other array keys, normalize
        const items = products.products || products.data || [];
        products = { items: Array.isArray(items) ? items : [], total: 0, page: 1, pages: 1 };
      }
    } else if (Array.isArray(products)) {
      // If backend returns direct array, wrap in pagination structure
      products = { items: products, total: products.length, page: 1, pages: 1 };
    }
    
    console.log(`✅ Frontend API: Returned ${products.items?.length ?? 0} products`);
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("❌ Products API error:", error.message);
    return NextResponse.json(
      { error: "Backend not available" },
      { status: 503 }
    );
  }
}
