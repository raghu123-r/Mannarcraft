import { apiGet, apiPost, apiPut , apiDelete } from "@/lib/api";
import { ensureArray } from "@/lib/api";

export const getAdminSubCategories = async () => {
  const res = await apiGet("/api/subcategories/all");
  return ensureArray(res);
};

export const createSubCategory = async (data: any) => {
  return apiPost("/api/subcategories", data);
};

export const updateSubCategory = async (id: string, data: any) => {
  return apiPut(`/api/subcategories/${id}`, data);
};

export const deleteSubCategory = async (id: string) => {
  return apiDelete(`/api/subcategories/${id}`);
};

export const enableSubCategory = async (id: string) => {
  return apiPut(`/api/subcategories/${id}/enable`, {});
};

export const disableSubCategory = async (id: string) => {
  return apiPut(`/api/subcategories/${id}/disable`, {});
};
