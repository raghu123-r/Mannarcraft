"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminSubCategories,
  enableSubCategory,
  disableSubCategory,
} from "@/lib/admin/subcategories";

import { Plus, Pencil, Power, FolderTree } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminBadge,
  AdminEmptyState,
  TableActionMenu,
  TableActionButton,
} from "@/components/admin/ui";

export default function AdminSubCategoriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getAdminSubCategories();
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "name",
      header: "SubCategory",
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <FolderTree className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-slate-500">/{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Parent Category",
      render: (item: any) => item.category?.name || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) =>
        item.isActive ? (
          <AdminBadge variant="success">Active</AdminBadge>
        ) : (
          <AdminBadge variant="danger">Disabled</AdminBadge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (item: any) => (
        <TableActionMenu>
          <TableActionButton
            icon={<Pencil />}
            label="Edit"
            onClick={() =>
              router.push(`/admin/subcategories/edit/${item._id}`)
            }
          />
          {item.isActive ? (
            <TableActionButton
              icon={<Power />}
              label="Disable"
              onClick={async () => {
                await disableSubCategory(item._id);
                loadData();
              }}
            />
          ) : (
            <TableActionButton
              icon={<Power />}
              label="Enable"
              onClick={async () => {
                await enableSubCategory(item._id);
                loadData();
              }}
            />
          )}
        </TableActionMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SubCategories"
        description="Manage product subcategories"
        actions={
          <Link href="/admin/subcategories/new">
            <button className="btn-primary">
              <Plus className="w-4 h-4" /> Add SubCategory
            </button>
          </Link>
        }
      />

      <AdminCard padding="none">
        {data.length === 0 && !loading ? (
          <AdminEmptyState
            title="No subcategories"
            action={{
              label: "Add SubCategory",
              onClick: () => router.push("/admin/subcategories/new"),
            }}
          />
        ) : (
          <AdminTable
            columns={columns}
            data={data}
            keyExtractor={(row) => row._id}
          />
        )}
      </AdminCard>
    </div>
  );
}
