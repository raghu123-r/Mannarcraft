"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/ToastContext";
import { useState } from "react";
import Image from "next/image";
import { normalizeSrc } from "@/lib/normalizeSrc";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Star } from "lucide-react";
import SizeSelectionModal from "@/components/SizeSelectionModal";

interface Variant {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
}

export default function ProductCard({ product }: any) {
  const { addItem, updateQty, removeItem, items } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const productIdKey = product._id || product.id || product.productId || "";
  const cartItem = items.find(
    (item) => item.id === productIdKey || item.productId === productIdKey
  );
  const currentQty = Math.max(0, Number(cartItem?.qty) || 0);

  const productTitle = product.title || product.name || "Untitled Product";

  // Get pricing from default variant if available, otherwise use product price
  const effectivePrice = product.defaultVariant?.price ?? product.price ?? 0;
  const effectiveMrp = product.defaultVariant?.mrp ?? product.mrp ?? 0;
  const effectiveStock = product.defaultVariant?.stock ?? product.stock ?? 0;

  const imgSrc = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return normalizeSrc(product.images[0]);
    }
    if (typeof product.images === "string") {
      return normalizeSrc(product.images);
    }
    if (product.image_url) {
      return normalizeSrc(product.image_url);
    }
    return DefaultProductImage;
  })();

  // Calculate discount percentage (Flipkart-style)
  const discountPercent = effectiveMrp && effectiveMrp > effectivePrice
    ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100)
    : 0;

  // Extract rating data from attributes (already available in backend model)
  const ratingAvg = product.attributes?.ratingAvg || 0;
  const ratingCount = product.attributes?.ratingCount || 0;

  // Check stock status
  const isOutOfStock = effectiveStock === 0;

  const handleQuantityChange = (newQty: number) => {
    const safeQty = Math.max(0, Number(newQty) || 0);

    try {
      if (safeQty === 0) {
        removeItem(productIdKey);
        showToast("Removed from cart", "success");
      } else if (currentQty === 0) {
        addItem(
          {
            id: productIdKey,
            name: productTitle,
            price: effectivePrice || 0,
            image_url: typeof imgSrc === "string" ? imgSrc : imgSrc.src,
          },
          safeQty
        );
        showToast("Added to cart!", "success");
      } else {
        updateQty(productIdKey, safeQty);
      }
    } catch {
      showToast("Failed to update cart", "error");
    }
  };

  const onAdd = async (e: any) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    
    // If product has multiple sizes, show size selection modal
    if (product.hasSizes) {
      // Fetch variants
      setLoadingVariants(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://mk-backend-a6c7.onrender.com/api';
        const res = await fetch(`${API_BASE}/products/${product.slug}/variants`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVariants(data.data);
          setShowSizeModal(true);
        } else {
          // Fallback to adding product without variant
          addDirectToCart();
        }
      } catch (error) {
        console.error('Failed to load variants:', error);
        addDirectToCart();
      } finally {
        setLoadingVariants(false);
      }
    } else {
      // No sizes, add directly
      addDirectToCart();
    }
  };

  const addDirectToCart = () => {
    setAdding(true);
    try {
      addItem({
        id: productIdKey,
        name: productTitle,
        price: effectivePrice || 0,
        image_url: typeof imgSrc === "string" ? imgSrc : imgSrc.src,
      });
      showToast("Added to cart!", "success");
    } catch {
      showToast("Failed to add", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleSizeSelect = (variant: Variant, quantity: number) => {
    try {
      addItem(
        {
          id: productIdKey,
          name: productTitle,
          price: variant.price,
          image_url: typeof imgSrc === "string" ? imgSrc : imgSrc.src,
          variantId: variant._id,
          variantName: variant.name,
        },
        quantity
      );
      showToast(`Added ${quantity}x ${variant.name} to cart!`, "success");
    } catch {
      showToast("Failed to add", "error");
    }
  };

  const increaseQty = () => handleQuantityChange(currentQty + 1);
  const decreaseQty = () => handleQuantityChange(currentQty - 1);

  return (
    <Card className="group relative flex flex-col overflow-hidden border border-slate-200 rounded-xl bg-white hover:shadow-lg transition-shadow duration-200">
      {/* Out of Stock Overlay Badge */}
      {isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
          Out of Stock
        </div>
      )}

      {/* Discount Badge - Top Right (Flipkart-style) */}
      {discountPercent > 0 && !isOutOfStock && (
        <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
          {discountPercent}% OFF
        </div>
      )}

      {/* Image Area - Fixed aspect ratio */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative w-full aspect-square bg-slate-50 overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}>
          <Image
            src={imgSrc}
            alt={productTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            unoptimized={typeof imgSrc === "string" && imgSrc.startsWith("http")}
          />
        </div>
      </Link>

      {/* Content Area - Marketplace-grade hierarchy */}
      <div className="flex flex-col p-3 gap-2">
        {/* Brand Name - Subtle, muted (Flipkart-style) */}
        {product.brand?.name && (
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">
            {product.brand.name}
          </p>
        )}

        {/* Product Title - 2 line clamp */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors min-h-[2.5rem]">
            {productTitle}
          </h3>
        </Link>

        {/* Rating Section - Fixed height for grid alignment */}
        <div className="flex items-center gap-2 min-h-[24px]">
          {ratingAvg > 0 ? (
            <>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                ratingAvg >= 4 ? 'bg-emerald-600 text-white' : 
                ratingAvg >= 3 ? 'bg-yellow-500 text-white' : 
                'bg-orange-500 text-white'
              }`}>
                <span>{ratingAvg.toFixed(1)}</span>
                <Star size={12} fill="currentColor" />
              </div>
              {ratingCount > 0 && (
                <span className="text-xs text-slate-500">
                  ({ratingCount.toLocaleString()})
                </span>
              )}
            </>
          ) : (
            <div className="invisible">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold">
                <span>0.0</span>
                <Star size={12} />
              </div>
            </div>
          )}
        </div>

        {/* Price Section - STRONG emphasis (Flipkart-style) */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold text-slate-900">
            ₹{effectivePrice?.toLocaleString() || 0}
          </span>
          {effectiveMrp && effectiveMrp > effectivePrice && (
            <span className="text-sm text-slate-400 line-through">
              ₹{effectiveMrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Action Area - Fixed height slot */}
      <div className="px-3 pb-3">
        <div className="h-11 flex items-center justify-center">
          {currentQty === 0 ? (
            <button
              onClick={onAdd}
              disabled={adding || loadingVariants || isOutOfStock}
              className="w-full h-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} className="shrink-0" />
              <span>
                {isOutOfStock 
                  ? "Out of Stock" 
                  : loadingVariants 
                  ? "Loading..." 
                  : adding 
                  ? "Adding..." 
                  : "Add to Cart"}
              </span>
            </button>
          ) : (
            <div className="w-full h-full flex items-center gap-2">
              <Link
                href="/cart"
                className="flex-1 h-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center transition-colors"
              >
                Go to Cart
              </Link>
              <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden h-full shadow-sm">
                <button
                  onClick={decreaseQty}
                  className="w-10 h-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
                <div className="w-10 flex items-center justify-center font-semibold text-slate-800 text-base">
                  {currentQty}
                </div>
                <button
                  onClick={increaseQty}
                  className="w-10 h-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14m7-7H5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Selection Modal */}
      {showSizeModal && variants.length > 0 && (
        <SizeSelectionModal
          isOpen={showSizeModal}
          onClose={() => setShowSizeModal(false)}
          variants={variants}
          productTitle={productTitle}
          onSelect={handleSizeSelect}
        />
      )}
    </Card>
  );
}
