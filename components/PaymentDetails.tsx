/**
 * PaymentDetails Component
 *
 * Purpose: Displays payment gateway information, transaction ID, payment method,
 * and payment timestamp with copy-to-clipboard functionality.
 *
 * Usage: Used in the Payment Result page to show detailed payment information.
 * NOTE: This component is only rendered for online payments (Razorpay, etc.)
 * It is hidden automatically for COD orders via page.tsx conditional rendering.
 */

"use client";

import { useState } from "react";
import { CreditCard, Copy, Check } from "lucide-react";
import type { Order } from "@/lib/types/order";

interface PaymentDetailsProps {
  order: Order;
}

export default function PaymentDetails({ order }: PaymentDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Format date for locale
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const orderId = order._id || order.id || "";
  const payment = order.payment || {};
  const paidAt = payment.paidAt || order.createdAt;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-red-600" aria-hidden="true" />
        Payment Details
      </h2>

      <div className="space-y-3">
        {/* Payment Gateway */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Payment Gateway</span>
          <span className="font-medium text-gray-900">Razorpay</span>
        </div>

        {/* Payment Method */}
        {payment.method && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Payment Method</span>
            <span className="font-medium text-gray-900 capitalize">
              {payment.method}
            </span>
          </div>
        )}

        {/* Transaction ID */}
        {payment.transactionId && (
          <div className="py-2 border-b border-gray-100">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-gray-600 flex-shrink-0">
                Transaction ID
              </span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="font-mono text-xs sm:text-sm text-gray-900 break-all text-right">
                  {payment.transactionId}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(payment.transactionId!, "transactionId")
                  }
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Copy transaction ID"
                  title="Copy transaction ID"
                >
                  {copiedField === "transactionId" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order ID with Copy */}
        <div className="py-2 border-b border-gray-100">
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm text-gray-600">Order ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-900">
                #{orderId.slice(-8).toUpperCase()}
              </span>
              <button
                onClick={() => copyToClipboard(orderId, "orderId")}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Copy order ID"
                title="Copy full order ID"
              >
                {copiedField === "orderId" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Date */}
        {paidAt && (
          <div className="flex justify-between items-start py-2">
            <span className="text-sm text-gray-600 flex-shrink-0">Paid At</span>
            <span className="font-medium text-gray-900 text-right text-sm">
              {formatDate(paidAt)}
            </span>
          </div>
        )}

        {/* Payment Status */}
        <div className="flex justify-between items-center py-2 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Status</span>
          <span
            className={`font-semibold text-sm px-3 py-1 rounded-full ${
              payment.status?.toLowerCase() === "paid" ||
              payment.status?.toLowerCase() === "success"
                ? "bg-green-100 text-green-800"
                : payment.status?.toLowerCase() === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {payment.status
              ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
              : "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}