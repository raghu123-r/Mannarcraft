import { apiGet, normalizeListResponse } from "@/lib/api";

export async function getCategories() {
  const data = await apiGet("/api/categories");
  // Normalize to always return array
  return normalizeListResponse(data, ['categories', 'items']);
}
