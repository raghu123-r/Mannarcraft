import { apiGet, buildQueryString, ensureArray } from "@/lib/api";

export async function fetchSubCategories(params?: {
  category?: string;
  homepage?: boolean;
}) {
  const qs = params ? buildQueryString(params) : "";
  const res = await apiGet(`/api/subcategories${qs}`);
  return ensureArray(res);
}
