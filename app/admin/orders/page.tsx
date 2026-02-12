/**
 * Admin Orders Page - Redesigned
 * Modern order management with status badges, filters, and detail view
 */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api/orders.api";
import Link from "next/link";
import { Eye, Package, Calendar, User, CreditCard, Truck, X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTable, TableActionMenu, TableActionButton } from "@/components/admin/ui/AdminTable";
import { AdminBadge, StatusBadge } from "@/components/admin/ui/AdminBadge";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminFilterBar, AdminFilterSelect } from "@/components/admin/ui/AdminFilterBar";
import { AdminLoadingState } from "@/components/admin/ui/AdminLoadingState";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import ReturnStatusBadge from "@/components/ReturnStatusBadge";
import Pagination from "@/components/common/Pagination";

const ITEMS_PER_PAGE = 10;

interface ReturnRequest {
  _id: string;
  productId: string | { _id: string; name: string };
  status: string;
  actionType: "return" | "return_refund";
  createdAt: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<Record<string, ReturnRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number;
    page: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        // Build query with pagination and filters
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", ITEMS_PER_PAGE.toString());
        if (searchTerm) params.set("search", searchTerm);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetchWithAuth(`/admin/orders?${params.toString()}`);
        
        // Handle response format from backend
        const ordersList =
          Array.isArray(res) ? res :
          Array.isArray(res?.orders) ? res.orders :
          Array.isArray(res?.items) ? res.items :
          Array.isArray(res?.data) ? res.data :
          [];
        
        setOrders(ordersList);
        
        // Set pagination info from meta
        if (res?.meta) {
          setPaginationInfo({
            total: res.meta.total || ordersList.length,
            page: res.meta.page || currentPage,
            totalPages: res.meta.totalPages || 1,
          });
        } else {
          setPaginationInfo({
            total: ordersList.length,
            page: currentPage,
            totalPages: 1,
          });
        }

        await loadReturnRequests();
      } catch (err) {
        console.error("Failed to load admin orders", err);
      }
      setLoading(false);
    }
    loadOrders();
  }, [currentPage, searchTerm, statusFilter]);

  async function loadReturnRequests() {
    try {
      const res = await fetchWithAuth("/admin/returns");
      const returns = res?.returnRequests || [];
      
      const grouped: Record<string, ReturnRequest[]> = {};
      returns.forEach((ret: ReturnRequest) => {
        const orderId = typeof ret.productId === 'object' ? ret.productId._id : ret.productId;
        if (!grouped[orderId]) {
          grouped[orderId] = [];
        }
        grouped[orderId].push(ret);
      });
      
      setReturnRequests(grouped);
    } catch (err) {
      console.error("Failed to load return requests", err);
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    router.push(`/admin/orders?${params.toString()}`, { scroll: true });
  };

  // Handle filter changes - reset to page 1
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/admin/orders?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/admin/orders?${params.toString()}`, { scroll: false });
  };

  // Use orders directly (filtering is done server-side now)
  const filteredOrders = orders
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(price || 0);
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Order stats
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  // Table columns
  const columns = [
    {
      key: "orderId",
      header: "Order ID",
      render: (order: any) => (
        <span className="font-mono text-sm text-slate-900">
          #{order._id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order: any) => (
        <div>
          <p className="font-medium text-slate-900">{order.shippingAddress?.name || "Unknown"}</p>
          <p className="text-xs text-slate-500">{order.shippingAddress?.email || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "hidden lg:table-cell",
      render: (order: any) => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: any) => {
        const orderReturns = returnRequests[order._id] || [];
        const hasReturns = orderReturns.length > 0;
        return (
          <div className="flex flex-col gap-1.5">
            <StatusBadge status={order.status} />
            {hasReturns && (
              <div className="flex flex-wrap gap-1">
                {orderReturns.slice(0, 2).map((ret: ReturnRequest) => (
                  <ReturnStatusBadge 
                    key={ret._id} 
                    status={ret.status}
                    size="sm"
                  />
                ))}
                {orderReturns.length > 2 && (
                  <AdminBadge variant="secondary" size="sm">
                    +{orderReturns.length - 2}
                  </AdminBadge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      render: (order: any) => (
        <span className="font-semibold text-slate-900">
          {formatPrice(order.total)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[80px]",
      render: (order: any) => (
        <TableActionMenu>
          <TableActionButton 
            onClick={() => setSelectedOrder(order)} 
            icon={<Eye className="w-4 h-4" />} 
            label="View Details" 
          />
        </TableActionMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <AdminLoadingState fullPage message="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Orders"
        description="View and manage customer orders"
        badge={
          <AdminBadge variant="secondary" size="lg">
            {paginationInfo.total} orders
          </AdminBadge>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: orderStats.total, color: "bg-slate-100 text-slate-700" },
          { label: "Pending", value: orderStats.pending, color: "bg-amber-50 text-amber-700" },
          { label: "Processing", value: orderStats.processing, color: "bg-blue-50 text-blue-700" },
          { label: "Shipped", value: orderStats.shipped, color: "bg-purple-50 text-purple-700" },
          { label: "Delivered", value: orderStats.delivered, color: "bg-emerald-50 text-emerald-700" },
        ].map((stat) => (
          <div 
            key={stat.label}
            className={`${stat.color} rounded-xl p-3 sm:p-4 text-center`}
          >
            <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <AdminCard>
        <AdminFilterBar
          searchValue={searchTerm}
          searchPlaceholder="Search by order ID, customer name, or email..."
          onSearchChange={handleSearchChange}
        >
          <AdminFilterSelect
            value={statusFilter}
            onChange={handleStatusChange}
            placeholder="All Statuses"
            options={statusOptions.slice(1)}
            className="w-full sm:w-44"
          />
        </AdminFilterBar>
      </AdminCard>

      {/* Orders Table */}
      <AdminCard padding="none">
        {filteredOrders.length === 0 ? (
          <AdminEmptyState
            type={searchTerm || statusFilter ? "no-results" : "no-data"}
            title={searchTerm || statusFilter ? "No orders found" : "No orders yet"}
            description={
              searchTerm || statusFilter
                ? "Try adjusting your search or filters."
                : "Orders will appear here once customers start purchasing."
            }
            action={
              searchTerm || statusFilter
                ? { label: "Clear Filters", onClick: () => { handleSearchChange(""); handleStatusChange(""); } }
                : undefined
            }
          />
        ) : (
          <>
            <AdminTable
              columns={columns}
              data={filteredOrders}
              keyExtractor={(order) => order._id}
              onRowClick={(order) => setSelectedOrder(order)}
            />
            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200">
              <Pagination
                currentPage={paginationInfo.page}
                totalPages={paginationInfo.totalPages}
                totalItems={paginationInfo.total}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                hasNext={paginationInfo.page < paginationInfo.totalPages}
                hasPrev={paginationInfo.page > 1}
              />
            </div>
          </>
        )}
      </AdminCard>

      {/* Order Details Modal */}
      <AdminModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?._id.slice(-8).toUpperCase()}`}
        description={selectedOrder ? formatDate(selectedOrder.createdAt) : ""}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Order Status</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatPrice(selectedOrder.total)}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <h4 className="font-medium text-slate-900">Customer</h4>
                </div>
                <p className="text-sm text-slate-700">{selectedOrder.shippingAddress?.name}</p>
                <p className="text-sm text-slate-500">{selectedOrder.shippingAddress?.email}</p>
                <p className="text-sm text-slate-500">{selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <h4 className="font-medium text-slate-900">Shipping Address</h4>
                </div>
                <p className="text-sm text-slate-700">{selectedOrder.shippingAddress?.address}</p>
                <p className="text-sm text-slate-500">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                </p>
                <p className="text-sm text-slate-500">{selectedOrder.shippingAddress?.pincode}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.productId?.title || item.name || "Product"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatPrice(item.quantity * item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Payment Method</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {selectedOrder.paymentMethod || "N/A"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Payment Status</p>
                <StatusBadge status={selectedOrder.paymentStatus || "pending"} />
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}