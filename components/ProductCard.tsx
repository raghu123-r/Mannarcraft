"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/ToastContext";
import { useState } from "react";
import Image from "next/image";
import { normalizeSrc } from "@/lib/normalizeSrc";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import { ShoppingCart, Star, Plus, Minus } from "lucide-react";
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

  const effectivePrice = product.defaultVariant?.price ?? product.price ?? 0;
  const effectiveMrp = product.defaultVariant?.mrp ?? product.mrp ?? 0;
  const effectiveStock = product.defaultVariant?.stock ?? product.stock ?? 0;

  const imgSrc = (() => {
    if (Array.isArray(product.images) && product.images.length > 0)
      return normalizeSrc(product.images[0]);
    if (typeof product.images === "string") return normalizeSrc(product.images);
    if (product.image_url) return normalizeSrc(product.image_url);
    return DefaultProductImage;
  })();

  const discountPercent =
    effectiveMrp && effectiveMrp > effectivePrice
      ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100)
      : 0;

  const ratingAvg = product.attributes?.ratingAvg || 0;
  const ratingCount = product.attributes?.ratingCount || 0;
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

    if (product.hasSizes) {
      setLoadingVariants(true);
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL ??
          "https://mk-backend-a6c7.onrender.com/api";
        const res = await fetch(`${API_BASE}/products/${product.slug}/variants`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVariants(data.data);
          setShowSizeModal(true);
        } else {
          addDirectToCart();
        }
      } catch {
        addDirectToCart();
      } finally {
        setLoadingVariants(false);
      }
    } else {
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
    <div className="group relative flex flex-col bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200">
      {/* Badges */}
      {isOutOfStock && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          Out of Stock
        </div>
      )}
      {discountPercent > 0 && !isOutOfStock && (
        <div className="absolute top-1.5 right-1.5 z-10 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          {discountPercent}% OFF
        </div>
      )}

      {/* Image — square keeps products looking uniform in 5-col grid */}
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={`relative w-full aspect-square bg-slate-50 overflow-hidden ${
            isOutOfStock ? "opacity-60" : ""
          }`}
        >
          <Image
            src={imgSrc}
            alt={productTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            unoptimized={
              typeof imgSrc === "string" && imgSrc.startsWith("http")
            }
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col p-2 gap-1 flex-1">
        {/* Brand */}
        {product.brand?.name && (
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider truncate">
            {product.brand.name}
          </p>
        )}

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[11px] font-medium text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors min-h-[2rem]">
            {productTitle}
          </h3>
        </Link>

        {/* Rating */}
        {ratingAvg > 0 && (
          <div className="flex items-center gap-1">
            <div
              className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold ${
                ratingAvg >= 4
                  ? "bg-emerald-600 text-white"
                  : ratingAvg >= 3
                  ? "bg-yellow-500 text-white"
                  : "bg-orange-500 text-white"
              }`}
            >
              <span>{ratingAvg.toFixed(1)}</span>
              <Star size={8} fill="currentColor" />
            </div>
            {ratingCount > 0 && (
              <span className="text-[9px] text-slate-400">
                ({ratingCount.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 flex-wrap mt-auto pt-0.5">
          <span className="text-sm font-bold text-slate-900">
            ₹{effectivePrice?.toLocaleString() || 0}
          </span>
          {effectiveMrp && effectiveMrp > effectivePrice && (
            <span className="text-[10px] text-slate-400 line-through">
              ₹{effectiveMrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-2 pb-2">
        {currentQty === 0 ? (
          <button
            onClick={onAdd}
            disabled={adding || loadingVariants || isOutOfStock}
            className="w-full h-8 bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-semibold rounded-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingCart size={12} className="shrink-0" />
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
          <div className="w-full h-8 flex items-center gap-1">
            <Link
              href="/cart"
              className="flex-1 h-full bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-semibold rounded-md flex items-center justify-center transition-colors"
            >
              Go to Cart
            </Link>
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden h-full">
              <button
                onClick={decreaseQty}
                className="w-7 h-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition"
                aria-label="Decrease quantity"
              >
                <Minus size={11} strokeWidth={2.5} />
              </button>
              <div className="w-7 flex items-center justify-center font-semibold text-slate-800 text-xs border-x border-slate-200 h-full">
                {currentQty}
              </div>
              <button
                onClick={increaseQty}
                className="w-7 h-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition"
                aria-label="Increase quantity"
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Size Modal */}
      {showSizeModal && variants.length > 0 && (
        <SizeSelectionModal
          isOpen={showSizeModal}
          onClose={() => setShowSizeModal(false)}
          variants={variants}
          productTitle={productTitle}
          onSelect={handleSizeSelect}
        />
      )}
    </div>
  );
}