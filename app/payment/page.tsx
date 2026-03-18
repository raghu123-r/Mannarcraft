/**
 * Payment Result Page
 *
 * Purpose: Displays payment outcome and order details after payment processing.
 * Shows success/pending/failed status, order summary, payment details, and action buttons.
 *
 * Route: /payment?orderId=<ORDER_ID>
 *
 * Features:
 * - Reads orderId from query params
 * - Fetches order details from API
 * - Shows status banner (success/pending/failed)
 * - Displays order items, totals, payment details
 * - Provides action buttons (view order, download invoice, continue shopping, support)
 * - Copy-to-clipboard for order ID
 * - Responsive design (mobile, tablet, desktop)
 * - Loading skeleton and error handling
 * - Re-fetch capability for pending payments
 */

"use client";

// DEMO PREVIEW MODE — REMOVE AFTER CLIENT DEMO
// Set to false to use real backend API.
const USE_MOCK_ORDER_FOR_PREVIEW = true;

// DEMO: Use this to switch payment states quickly for presentation
// Options: 'success' | 'pending' | 'failed'
const PREVIEW_PAYMENT_STATE: "success" | "pending" | "failed" = "success";

// Mock order data for demo purposes (success state)
const MOCK_ORDER_SUCCESS = {
  _id: "MOCK-ORDER-12345",
  id: "MOCK-ORDER-12345",
  status: "paid",
  createdAt: new Date().toISOString(),
  items: [
    {
      _id: "prod_001",
      product: {
        _id: "prod_001",
        name: "Stainless Steel Kettle 1.5L",
        images: ["/plsaceholder-kettle.jpg"],
      },
      name: "Stainless Steel Kettle 1.5L",
      quantity: 1,
      qty: 1,
      price: 2949,
    },
  ],
  subtotal: 2949,
  shipping: 0,
  shippingCost: 0,
  tax: 0,
  total: 2949,
  totalAmount: 2949,
  payment: {
    method: "Razorpay",
    status: "paid",
    transactionId: "txn_demo_001",
    paidAt: new Date().toISOString(),
  },
  user: {
    name: "Demo User",
    email: "demo@example.com",
  },
  shippingAddress: {
    line1: "123 Demo Street",
    line2: "Apartment 4B",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    phone: "+91 98765 43210",
  },
};

// DEMO: Mock order data for pending payment state
const MOCK_ORDER_PENDING = {
  _id: "MOCK-ORDER-67890",
  id: "MOCK-ORDER-67890",
  status: "pending",
  createdAt: new Date().toISOString(),
  items: [
    {
      _id: "prod_002",
      product: {
        _id: "prod_002",
        name: "Electric Kettle Premium 2L",
        images: ["/placeholder-kettle.jpg"],
      },
      name: "Electric Kettle Premium 2L",
      quantity: 2,
      qty: 2,
      price: 3499,
    },
  ],
  subtotal: 6998,
  shipping: 100,
  shippingCost: 100,
  tax: 0,
  total: 7098,
  totalAmount: 7098,
  payment: {
    method: "Razorpay",
    status: "pending",
    transactionId: "txn_demo_pending_002",
    paidAt: null,
  },
  user: {
    name: "Demo User",
    email: "demo@example.com",
  },
  shippingAddress: {
    line1: "456 Test Avenue",
    line2: "Floor 2",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
    phone: "+91 98765 43210",
  },
};

// DEMO: Mock order data for failed payment state
const MOCK_ORDER_FAILED = {
  _id: "MOCK-ORDER-99999",
  id: "MOCK-ORDER-99999",
  status: "failed",
  createdAt: new Date().toISOString(),
  items: [
    {
      _id: "prod_003",
      product: {
        _id: "prod_003",
        name: "Glass Kettle 1.8L",
        images: ["/placeholder-kettle.jpg"],
      },
      name: "Glass Kettle 1.8L",
      quantity: 1,
      qty: 1,
      price: 4299,
    },
  ],
  subtotal: 4299,
  shipping: 0,
  shippingCost: 0,
  tax: 0,
  total: 4299,
  totalAmount: 4299,
  payment: {
    method: "Razorpay",
    status: "failed",
    transactionId: "txn_demo_failed_003",
    paidAt: null,
    failureReason:
      "Payment declined by bank. Please check your card details or try another payment method.",
  },
  user: {
    name: "Demo User",
    email: "demo@example.com",
  },
  shippingAddress: {
    line1: "789 Sample Road",
    line2: "",
    city: "Bangalore",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    phone: "+91 98765 43210",
  },
};

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ShoppingBag,
  FileText,
  MessageCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";
import { getOrder } from "@/lib/api/orders.api";
import type { Order } from "@/lib/types/order";
import PaymentResult from "@/components/PaymentResult";
import PaymentOrderSummary from "@/components/PaymentOrderSummary";
import PaymentDetails from "@/components/PaymentDetails";

/**
 * Main Payment Result Component
 * Wrapped in Suspense boundary for useSearchParams
 */
function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // DEMO: State for simulating pending → success transition
  const [demoCheckingStatus, setDemoCheckingStatus] = useState(false);

  // Fetch order details on mount or when orderId changes
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
      setError("No order ID provided");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  /**
   * Fetch order details from API
   * Uses getOrder helper with fallback to direct fetch
   */
  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      // DEMO MODE: Use mock data based on PREVIEW_PAYMENT_STATE
      if (USE_MOCK_ORDER_FOR_PREVIEW) {
        await new Promise((r) => setTimeout(r, 300));

        // Return appropriate mock data based on preview state
        let mockData;
        switch (PREVIEW_PAYMENT_STATE) {
          case "success":
            mockData = MOCK_ORDER_SUCCESS;
            break;
          case "pending":
            mockData = MOCK_ORDER_PENDING;
            break;
          case "failed":
            mockData = MOCK_ORDER_FAILED;
            break;
          default:
            mockData = MOCK_ORDER_SUCCESS;
        }

        setOrder(mockData as any);
        setLoading(false);
        return;
      }

      // Try using the API helper first
      let orderData: Order | null = null;

      try {
        orderData = await getOrder(orderId);
      } catch (apiError) {
        console.warn("getOrder helper failed, trying direct fetch:", apiError);

        // Fallback to direct fetch
        const response = await fetch(
          `https://mk-backend-a6c7.onrender.com/api/orders/${orderId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }

        const data = await response.json();
        orderData = data.data || data;
      }

      if (orderData) {
        setOrder(orderData);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load order details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Re-fetch order details (for checking status updates)
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  // Handle WhatsApp support link
  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Hi, I need help with my order #${orderId?.slice(-8).toUpperCase()}`,
    );
    window.open(`https://wa.me/919876543210?text=${message}`, "_blank");
  };

  // DEMO: Handler for "Check Status" button in pending state
  // Simulates payment confirmation after a delay
  const handleDemoCheckStatus = async () => {
    if (!USE_MOCK_ORDER_FOR_PREVIEW) return;

    setDemoCheckingStatus(true);
    // Simulate checking payment status with backend
    await new Promise((r) => setTimeout(r, 2000));

    // Transition to success state
    setOrder(MOCK_ORDER_SUCCESS as any);
    setDemoCheckingStatus(false);
  };

  // DEMO: Handler for "Retry Payment" button in failed state
  const handleDemoRetryPayment = () => {
    // In a real app, this would re-open the Razorpay checkout modal
    // For demo, just show a toast or alert
    alert(
      "Demo: Would re-open payment checkout modal here. Payment flow would restart.",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 max-w-md w-full">
          <div className="flex flex-col items-center justify-center">
            <GlobalLoader size="large" />
            <p className="text-gray-600 text-center mt-4">
              Loading payment details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State - No Order ID
  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              No Order ID Found
            </h1>
            <p className="text-gray-600 mb-6">
              Please provide a valid order ID to view payment details.
            </p>
            <Link
              href="/account/orders"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State - Failed to Load Order
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Payment Details
            </h1>
            <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRefresh}
                className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Try Again
              </button>
              <Link
                href="/account/orders"
                className="flex-1 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors text-center"
              >
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paymentStatus = order.payment?.status || order.status || "pending";
  const isPaid =
    paymentStatus.toLowerCase() === "paid" ||
    paymentStatus.toLowerCase() === "success" ||
    paymentStatus.toLowerCase() === "completed";

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Payment Status Banner */}
        <div className="mb-6 sm:mb-8">
          <PaymentResult
            status={paymentStatus}
            orderId={order._id || order.id || orderId}
            transactionId={order.payment?.transactionId}
            // DEMO: Pass handlers for interactive demo buttons
            onCheckStatus={
              USE_MOCK_ORDER_FOR_PREVIEW && paymentStatus === "pending"
                ? handleDemoCheckStatus
                : undefined
            }
            onRetryPayment={
              USE_MOCK_ORDER_FOR_PREVIEW &&
              (paymentStatus === "failed" || paymentStatus === "cancelled")
                ? handleDemoRetryPayment
                : undefined
            }
            onContactSupport={handleContactSupport}
            checkingStatus={demoCheckingStatus}
            failureReason={(order.payment as any)?.failureReason}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <PaymentOrderSummary order={order} />

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="text-gray-700 space-y-1 text-sm sm:text-base">
                  {order.shippingAddress.line1 && (
                    <p>{order.shippingAddress.line1}</p>
                  )}
                  {order.shippingAddress.line2 && (
                    <p>{order.shippingAddress.line2}</p>
                  )}
                  <p>
                    {[
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {order.shippingAddress.country && (
                    <p>{order.shippingAddress.country}</p>
                  )}
                  {order.shippingAddress.phone && (
                    <p className="mt-2 text-gray-600">
                      Phone: {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment Details and Actions */}
          <div className="lg:col-span-1 space-y-6">
            <PaymentDetails order={order} />

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-3">
                {/* View Order */}
                <Link
                  href={`/account/orders/${order._id || order.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Order Details
                </Link>

                {/* Download Invoice (only for paid orders) */}
                {isPaid && (
                  <a
                    href={`https://mk-backend-a6c7.onrender.com/api/orders/${
                      order._id || order.id
                    }/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Download Invoice
                  </a>
                )}

                {/* Check Status (for non-paid orders) */}
                {!isPaid && (
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Checking..." : "Check Status"}
                  </button>
                )}

                {/* Continue Shopping */}
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue Shopping
                </Link>

                {/* Contact Support */}
                <button
                  onClick={handleContactSupport}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </button>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                📧 You will receive an email & WhatsApp confirmation shortly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Export with Suspense boundary
 * Required for useSearchParams in App Router
 */
export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <GlobalLoader size="large" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
