"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { createOrder } from "@/lib/api/orders.api";
import { getAddresses } from "@/lib/api/user.api";
import { getAccessToken } from "@/lib/utils/auth";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useToast } from "@/components/ToastContext";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import {
  Truck,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  MapPin,
  ShoppingBag,
} from "lucide-react";

type Step = "address" | "payment";

// ─── Order Summary Panel (defined OUTSIDE to avoid hydration mismatch) ────────
function OrderSummaryPanel({
  items,
  subtotal,
  discountAmount,
  couponCode,
  total,
}: {
  items: any[];
  subtotal: number;
  discountAmount: number;
  couponCode: string;
  total: number;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 sticky top-20">
      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
        <ShoppingBag size={18} className="text-emerald-600" />
        Order Summary
      </h3>

      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3">
            <Image
              src={it.image_url || DefaultProductImage}
              alt={it.name || "Product"}
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
              unoptimized={
                typeof it.image_url === "string" &&
                it.image_url.startsWith("http")
              }
              onError={(e) => {
                e.currentTarget.src =
                  typeof DefaultProductImage === "string"
                    ? DefaultProductImage
                    : DefaultProductImage.src;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.name}</p>
              <p className="text-xs text-gray-500">Qty: {it.qty || 0}</p>
            </div>
            <p className="text-sm font-semibold flex-shrink-0">
              ₹{(it.price * (it.qty || 0)).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Discount {couponCode && `(${couponCode})`}</span>
            <span>-₹{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delivery</span>
          <span className="text-emerald-600 font-medium">FREE</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step Bar (defined OUTSIDE to avoid hydration mismatch) ──────────────────
function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-emerald-600 text-white">
          {step === "payment" ? <CheckCircle2 size={18} /> : "1"}
        </div>
        <span
          className={`text-sm font-semibold hidden sm:inline ${
            step === "address" ? "text-emerald-700" : "text-gray-500"
          }`}
        >
          Delivery Address
        </span>
      </div>

      <div
        className={`h-0.5 w-12 sm:w-20 mx-2 transition-colors ${
          step === "payment" ? "bg-emerald-600" : "bg-gray-300"
        }`}
      />

      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step === "payment"
              ? "bg-emerald-600 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          2
        </div>
        <span
          className={`text-sm font-semibold hidden sm:inline ${
            step === "payment" ? "text-emerald-700" : "text-gray-400"
          }`}
        >
          Payment
        </span>
      </div>
    </div>
  );
}

// ─── Checkout Content ─────────────────────────────────────────────────────────
function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { items, clearCart } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [line2, setLine2] = useState("");

  const couponCode = searchParams.get("couponCode") || "";
  const discountAmount = Number(searchParams.get("discountAmount") || 0);

  const subtotal = items.reduce((s, it) => s + it.price * (it.qty || 0), 0);
  const total = subtotal - discountAmount;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login?next=/checkout");
      return;
    }
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAddresses() {
    try {
      setAddressesLoading(true);
      const userAddresses = await getAddresses();
      setAddresses(userAddresses || []);
      if (userAddresses && userAddresses.length > 0) {
        const defaultIndex = userAddresses.findIndex((a: any) => a.isDefault);
        const idx = defaultIndex >= 0 ? defaultIndex : 0;
        setSelectedAddressIndex(idx);
        prefillAddress(userAddresses[idx]);
      }
    } catch (e) {
      console.error("Failed to load addresses:", e);
    } finally {
      setAddressesLoading(false);
    }
  }

  function prefillAddress(addr: any) {
    if (!addr) return;
    setName(addr.name || "");
    setPhone(addr.phone || "");
    setAddress(addr.line1 || "");
    setLine2(addr.line2 || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setPin(addr.pincode || "");
  }

  function handleAddressSelect(index: number) {
    setSelectedAddressIndex(index);
    if (index === -1) {
      setName("");
      setPhone("");
      setAddress("");
      setLine2("");
      setCity("");
      setState("");
      setPin("");
    } else {
      prefillAddress(addresses[index]);
    }
  }

  function handleContinueToPayment() {
    if (!items || items.length === 0) {
      showToast("Your cart is empty", "info");
      return;
    }
    if (!name || !phone || !address || !city || !pin) {
      showToast("Please fill all required address fields", "error");
      return;
    }
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePlaceOrder() {
    setLoading(true);
    try {
      const orderPayload: any = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.qty || 1,
        })),
        address: {
          name,
          phone,
          line1: address,
          line2: line2 || "",
          city,
          state: state || "",
          country: "India",
          pincode: pin,
        },
        paymentMethod,
      };
      if (couponCode) orderPayload.couponCode = couponCode;

      const order = await createOrder(orderPayload as any);
      clearCart();
      router.push(`/payment?orderId=${order._id || order.id}`);
    } catch (err: any) {
      console.error("Order placement error:", err);
      showToast(
        getErrorMessage(err, "Failed to place order. Please try again."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <StepBar step={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* STEP 1: ADDRESS */}
            {step === "address" && (
              <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-600" />
                  Delivery Address
                </h2>

                {addressesLoading ? (
                  <div className="flex justify-center py-6">
                    <GlobalLoader size="medium" />
                  </div>
                ) : addresses.length > 1 ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Delivery Address
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      value={selectedAddressIndex}
                      onChange={(e) =>
                        handleAddressSelect(Number(e.target.value))
                      }
                    >
                      {addresses.map((addr: any, idx: number) => (
                        <option key={idx} value={idx}>
                          {addr.name} — {addr.line1}, {addr.city} (
                          {addr.pincode})
                          {addr.isDefault ? " [Default]" : ""}
                        </option>
                      ))}
                      <option value={-1}>+ Enter New Address</option>
                    </select>
                  </div>
                ) : addresses.length === 1 ? (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <span className="font-medium">Using saved address:</span>{" "}
                      {addresses[0]?.name} — {addresses[0]?.city}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      No saved addresses found. Please enter your delivery
                      address below.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Full name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Phone *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <textarea
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Address Line 1 *"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Address Line 2 (Optional)"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="PIN code *"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleContinueToPayment}
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  Continue to Payment
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === "payment" && (
              <div className="space-y-4">

                {/* Delivery address summary */}
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-600" />
                      Delivering to
                    </h3>
                    <button
                      onClick={() => setStep("address")}
                      className="text-xs text-emerald-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Change
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    {name} &nbsp;·&nbsp; {phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {address}
                    {line2 ? `, ${line2}` : ""}, {city}
                    {state ? `, ${state}` : ""} — {pin}
                  </p>
                </div>

                {/* Payment method cards */}
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg sm:text-xl font-semibold mb-5 flex items-center gap-2">
                    <CreditCard size={20} className="text-emerald-600" />
                    Select Payment Method
                  </h2>

                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "COD"
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="mt-1 accent-emerald-600"
                      />
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            Cash on Delivery
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Pay with cash when your order arrives at your
                            doorstep.
                          </p>
                          {paymentMethod === "COD" && (
                            <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        disabled
                        className="mt-1"
                      />
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CreditCard size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-sm sm:text-base">
                            Online Payment
                            <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              Coming Soon
                            </span>
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                            UPI, Credit / Debit Card, Net Banking
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentMethod === "COD" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Truck
                      size={18}
                      className="text-amber-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Cash on Delivery Selected
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Please keep the exact amount ready at the time of
                        delivery. Our delivery partner will collect payment when
                        your order arrives.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-4 rounded-xl font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Place Order · ₹{total.toLocaleString()}
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push("/cart")}
                  className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                >
                  ← Back to Cart
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div>
            <OrderSummaryPanel
              items={items}
              subtotal={subtotal}
              discountAmount={discountAmount}
              couponCode={couponCode}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            Loading checkout...
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}