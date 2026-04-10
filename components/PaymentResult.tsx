/**
 * PaymentResult Component
 *
 * Purpose: Displays the payment status banner (success, pending, or failed)
 * with appropriate colors, icons, and messaging.
 *
 * Usage: Used in the Payment Result page to show clear visual feedback
 * about the payment outcome.
 */

"use client";

import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface PaymentResultProps {
  status: string;
  orderId: string;
  transactionId?: string;
  successTitle?: string;
  successMessage?: string;
  // DEMO: Optional props for interactive pending/failed state demos
  onCheckStatus?: () => void;
  onRetryPayment?: () => void;
  onContactSupport?: () => void;
  checkingStatus?: boolean;
  failureReason?: string;
}

export default function PaymentResult({
  status,
  orderId,
  transactionId,
  successTitle,
  successMessage,
  onCheckStatus,
  onRetryPayment,
  onContactSupport,
  checkingStatus = false,
  failureReason,
}: PaymentResultProps) {
  const normalizedStatus = status?.toLowerCase() || "pending";

  // Determine banner styling and content based on payment status
  const getBannerConfig = () => {
    switch (normalizedStatus) {
      case "paid":
      case "success":
      case "completed":
        return {
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
          iconColor: "text-green-600",
          icon: <CheckCircle className="w-12 h-12" />,
          title: successTitle ?? "Order Successful!",
          message:
            successMessage ??
            "Your order has been placed successfully. You will receive an email & WhatsApp confirmation shortly.",
        };
      case "pending":
      case "processing":
        return {
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
          icon: <Clock className="w-12 h-12" />,
          title: "Payment Pending",
          message:
            "Your payment is being processed. This usually takes a few minutes. We'll notify you via email and WhatsApp once it's confirmed.",
        };
      case "failed":
      case "cancelled":
        return {
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-600",
          icon: <XCircle className="w-12 h-12" />,
          title: "Payment Failed",
          message:
            failureReason ||
            "Unfortunately, your payment could not be processed. This could be due to insufficient funds, incorrect card details, or bank decline. Please try again or use another payment method.",
        };
      default:
        return {
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800",
          iconColor: "text-gray-600",
          icon: <AlertCircle className="w-12 h-12" />,
          title: "Payment Status Unknown",
          message: "We're checking your payment status. Please wait...",
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div
      className={`rounded-lg border-2 p-8 ${config.bgColor}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`mb-4 ${config.iconColor}`} aria-hidden="true">
          {config.icon}
        </div>

        {/* Title */}
        <h1
          className={`text-2xl md:text-3xl font-bold mb-3 ${config.textColor}`}
        >
          {config.title}
        </h1>

        {/* Message */}
        <p
          className={`text-base md:text-lg mb-4 max-w-2xl ${config.textColor}`}
        >
          {config.message}
        </p>

        {/* Order ID */}
        <div className="mt-2 space-y-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            Order ID:{" "}
            <span className="font-mono font-bold">
              #{orderId.slice(-8).toUpperCase()}
            </span>
          </p>

          {/* Transaction ID — only show for online payments when transactionId exists */}
          {transactionId && (
            <p className={`text-sm ${config.textColor} opacity-75`}>
              Transaction ID:{" "}
              <span className="font-mono">
                {transactionId.length > 20
                  ? `${transactionId.slice(0, 20)}...`
                  : transactionId}
              </span>
            </p>
          )}
        </div>

        {/* DEMO: Action buttons for pending/failed states */}
        {normalizedStatus === "pending" && onCheckStatus && (
          <div className="mt-6">
            <button
              onClick={onCheckStatus}
              disabled={checkingStatus}
              className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {checkingStatus ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Checking Status...
                </>
              ) : (
                "Check Status"
              )}
            </button>
          </div>
        )}

        {(normalizedStatus === "failed" ||
          normalizedStatus === "cancelled") && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {onRetryPayment && (
              <button
                onClick={onRetryPayment}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Retry Payment
              </button>
            )}
            {onContactSupport && (
              <button
                onClick={onContactSupport}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors border border-gray-300"
              >
                Contact Support
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}