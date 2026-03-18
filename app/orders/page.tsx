/**
 * Orders listing page - Fully automated with robust error handling
 * Handles loading, empty state, 401 errors, and CORS/network errors
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyOrders } from "@/lib/api/orders.api";
import { getMyReturnRequests, type ReturnRequest } from "@/lib/api/returns.api";
import { ApiError } from "@/lib/api";
import GlobalLoader from "@/components/common/GlobalLoader";
import ReturnRequestModal from "@/components/ReturnRequestModal";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");
  const [showDemoModal, setShowDemoModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyOrders();
      setOrders(data);

      // Also fetch return requests
      try {
        const returns = await getMyReturnRequests(1, 50);
        setReturnRequests(returns.returnRequests || []);
      } catch (err) {
        // Silently fail for return requests
        console.error("Failed to fetch return requests:", err);
      }
    } catch (err) {
      setError(err as ApiError);

      // Auto-redirect to login on 401 after 1.5s
      if ((err as ApiError).status === 401) {
        setTimeout(() => {
          router.push("/auth/request");
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-slate-900">My Orders</h1>
          <div className="flex justify-center py-20">
            <GlobalLoader size="large" />
          </div>
        </div>
      </div>
    );
  }

  // 401 Error - Not authenticated
  if (error?.status === 401 || error?.message === "No token") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">
            Authentication Required
          </h2>
          <p className="text-slate-600 mb-6">
            You must be logged in to view your orders.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/auth/request")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Login Now
            </button>

            <button
              onClick={fetchOrders}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition"
            >
              Retry
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Redirecting to login in 1.5s...
          </p>
        </div>
      </div>
    );
  }

  // CORS or Network Error
  if (error?.status === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">
            Network or CORS Error
          </h2>
          <p className="text-slate-600 mb-4 text-center">
            Unable to connect to the backend server. This might be a CORS issue
            or the backend is not running.
          </p>

          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Check backend status:
            </p>
            <code className="block bg-slate-900 text-slate-100 p-3 rounded text-sm overflow-x-auto">
              curl -i https://mk-backend-a6c7.onrender.com/api
            </code>
            <p className="text-xs text-slate-500 mt-2">
              Expected: HTTP 200 response. If you get a connection error, start
              the backend.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              CORS Fix (if needed):
            </p>
            <p className="text-xs text-yellow-700 mb-2">
              If backend is running but you see CORS errors in browser console,
              ensure CORS middleware is configured in{" "}
              <code>kk-backend/src/app.js</code>
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.open("https://mk-backend-a6c7.onrender.com/api", "_blank")}
              className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Check Backend
            </button>

            <button
              onClick={fetchOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Other errors
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">
            Error Loading Orders
          </h2>
          <p className="text-slate-600 mb-2">Status: {error.status}</p>
          <p className="text-slate-600 mb-6">{error.message}</p>

          <button
            onClick={fetchOrders}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0 && returnRequests.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-slate-900">My Orders</h1>

          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">
              No Orders Yet
            </h2>
            <p className="text-slate-600 mb-6">
              You haven&apos;t placed any orders. Start shopping!
            </p>

            {/* Demo Button for Empty State */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Have questions about Returns?
                  </h3>
                  <p className="text-sm text-blue-700">
                    Try our demo to see how the return process works
                  </p>
                </div>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Try Demo
                </button>
              </div>
            </div>

            <Link
              href="/products"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Browse Products
            </Link>
          </div>
        </div>

        {/* Demo Modal */}
        <ReturnRequestModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          orderId="DEMO-ORDER-001"
          productId="DEMO-PRODUCT-001"
          productName="Prestige Pressure Cooker (Demo)"
          productPrice={1999}
          quantity={1}
          onSuccess={fetchOrders}
          isDemo={true}
        />
      </div>
    );
  }

  // Success - Display orders
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <button
            onClick={fetchOrders}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Demo Button */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Have questions about Returns?
              </h3>
              <p className="text-sm text-blue-700">
                Try our demo to see how the return process works
              </p>
            </div>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Try Demo
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "orders"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("returns")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "returns"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Return Requests ({returnRequests.length})
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">
                  No Orders Yet
                </h2>
                <p className="text-slate-600 mb-6">
                  You haven&apos;t placed any orders. Start shopping!
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order: any) => {
                  const orderId = order._id || order.id || "unknown";
                  const shortId = orderId.toString().slice(0, 8).toUpperCase();
                  const createdDate = formatDate(order.createdAt || order.created_at);
                  const status = order.status || "pending";
                  const total =
                    order.total || order.totalPrice || order.total_price || 0;
                  const items = order.items || [];

                  return (
                    <div
                      key={orderId}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                    >
                      {/* Order header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">
                            #{shortId}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">{createdDate}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* Order details */}
                      <div className="border-t border-slate-200 pt-4">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-slate-700 mb-2">
                            Items:
                          </p>
                          <ul className="space-y-1">
                            {items.slice(0, 3).map((item: any, idx: number) => {
                              const itemName =
                                item.title ||
                                item.name ||
                                item.product?.name ||
                                "Unknown";
                              const qty = item.qty || item.quantity || 1;

                              return (
                                <li
                                  key={idx}
                                  className="text-sm text-slate-600 flex justify-between"
                                >
                                  <span className="truncate flex-1">{itemName}</span>
                                  <span className="ml-2 text-slate-500">×{qty}</span>
                                </li>
                              );
                            })}
                            {items.length > 3 && (
                              <li className="text-xs text-slate-500 italic">
                                +{items.length - 3} more item(s)
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-sm font-medium text-slate-700">
                            Total:
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>

                      {/* View details link */}
                      <Link
                        href={`/orders/${orderId}`}
                        className="mt-4 block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition"
                      >
                        View Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Return Requests Tab */}
        {activeTab === "returns" && (
          <>
            {returnRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">
                  No Return Requests
                </h2>
                <p className="text-slate-600">
                  You haven&apos;t submitted any return requests yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {returnRequests.map((request) => {
                  const productName =
                    typeof request.productId === "string"
                      ? request.productId
                      : request.productId?.name || "Unknown Product";
                  const orderId = request.orderId || "";
                  const shortOrderId =
                    typeof orderId === "string"
                      ? orderId.slice(0, 8).toUpperCase()
                      : "N/A";

                  // Map action types for display (backward compatible)
                  const displayActionType = request.actionType === "return_refund" 
                    ? "Return + Refund" 
                    : request.actionType === "return"
                    ? "Return Only"
                    : request.actionType; // Fallback for legacy data

                  return (
                    <div
                      key={request._id}
                      className="bg-white rounded-lg shadow p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">
                            {productName}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Order #{shortOrderId}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Action:</span>
                          <span className="font-medium capitalize">
                            {displayActionType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Issue:</span>
                          <span className="font-medium capitalize">
                            {request.issueType.replace("-", " ")}
                          </span>
                        </div>
                        {request.issueDescription && (
                          <div className="pt-2">
                            <p className="text-slate-600 mb-1">Description:</p>
                            <p className="text-slate-900 bg-slate-50 p-2 rounded">
                              {request.issueDescription}
                            </p>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Submitted:</span>
                          <span className="text-slate-500">
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          {activeTab === "orders" ? (
            <p>Showing {orders.length} order(s)</p>
          ) : (
            <p>Showing {returnRequests.length} return request(s)</p>
          )}
        </div>
      </div>

      {/* Demo Modal */}
      <ReturnRequestModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        orderId="DEMO-ORDER-001"
        productId="DEMO-PRODUCT-001"
        productName="Prestige Pressure Cooker (Demo)"
        productPrice={1999}
        quantity={1}
        onSuccess={fetchOrders}
        isDemo={true}
      />
    </div>
  );
}
