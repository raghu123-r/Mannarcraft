"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useCart } from "@/components/CartContext";
import { normalizeSrc } from "@/lib/normalizeSrc";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProductCard from "@/components/ProductCard";
import QuantitySelector from "@/components/QuantitySelector";
import ReviewsSection from "@/components/ReviewsSection";
import VariantSelector from "@/components/VariantSelector";
import {
  Star,
  ShoppingCart,
  Truck,
  ShieldCheck,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  RotateCcw,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";

interface Variant {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  sku?: string;
  attributes?: Record<string, string>;
  images?: string[];
  isActive: boolean;
  isDefault?: boolean;
}

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.round(value)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300 fill-gray-300"
            }
          />
        ))}
      </div>
      <span className="text-sm text-blue-600 hover:text-orange-500 cursor-pointer font-medium">
        {count.toLocaleString()} ratings
      </span>
    </div>
  );
}

// ─── Image Zoom Modal ─────────────────────────────────────────────────────────
function ImageZoomModal({
  images,
  initialIndex,
  onClose,
}: {
  images: any[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(
    () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1)),
    [images.length]
  );
  const next = useCallback(
    () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1)),
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
      >
        <X size={22} />
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        className="relative w-[90vw] h-[90vw] max-w-[700px] max-h-[700px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[current]}
          alt={`Zoom view ${current + 1}`}
          fill
          className="object-contain"
          priority
          unoptimized={
            typeof images[current] === "string" &&
            images[current].startsWith("http")
          }
        />
      </div>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === current
                  ? "border-white scale-110 shadow-lg"
                  : "border-white/30 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`thumb ${idx + 1}`}
                width={48}
                height={48}
                className="object-contain w-full h-full bg-white/10"
                unoptimized={typeof img === "string" && img.startsWith("http")}
              />
            </button>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
          {current + 1} / {images.length}
        </span>
      )}
    </div>
  );
}

// ─── Main Product Page ────────────────────────────────────────────────────────
export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, removeItem, updateQty, items } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const effectiveMrp = selectedVariant?.mrp ?? product?.mrp ?? 0;
  const effectiveStock = selectedVariant?.stock ?? product?.stock ?? 0;

  const cartItem = items.find(
    (item) =>
      item.id === product?._id &&
      (!selectedVariant || item.variantId === selectedVariant._id)
  );
  const currentQty = cartItem?.qty || 0;

  useEffect(() => {
    const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
    if (!slug) return;

    const fetchProduct = async () => {
      const data = await apiGet(`/products/${slug}`);
      const p = data?.product || data;
      setProduct(p);

      if (p?.variants && p.variants.length > 0) {
        setVariants(p.variants);
        const defaultVariant = p.variants.find(
          (v: Variant) => v.isDefault === true
        );
        const firstActive = p.variants.find(
          (v: Variant) => v.isActive && v.stock > 0
        );
        if (defaultVariant && defaultVariant.isActive) {
          setSelectedVariant(defaultVariant);
        } else if (firstActive) {
          setSelectedVariant(firstActive);
        } else {
          setSelectedVariant(p.variants[0]);
        }
      }

      if (p?._id) {
        setLoadingSimilar(true);
        try {
          const similarData = await apiGet(
            `/products/${p._id}/similar?limit=8`
          );
          setSimilarProducts(similarData || []);
        } catch {
          setSimilarProducts([]);
        } finally {
          setLoadingSimilar(false);
        }
      }

      setLoading(false);
    };

    fetchProduct();
  }, [params?.slug]);

  if (loading) return <GlobalLoader fullPage />;
  if (!product) return null;

  let productImages = product.images;
  if (selectedVariant?.images && selectedVariant.images.length > 0) {
    productImages = selectedVariant.images;
  }

  const images =
    Array.isArray(productImages) && productImages.length > 0
      ? productImages.map(normalizeSrc)
      : [DefaultProductImage];

  const mainImage = images[selectedImage] ?? images[0];

  const discount =
    effectiveMrp && effectiveMrp > effectivePrice
      ? Math.round(((effectiveMrp - effectivePrice) / effectivePrice) * 100)
      : 0;

  const savings =
    effectiveMrp > effectivePrice ? effectiveMrp - effectivePrice : 0;

  const inStock = effectiveStock !== 0;

  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant);
    setSelectedImage(0);
  };

  const handleQty = (qty: number) => {
    const itemPayload = {
      id: product._id,
      name: product.title,
      price: effectivePrice,
      image_url: typeof mainImage === "string" ? mainImage : mainImage.src,
      variantId: selectedVariant?._id,
      variantName: selectedVariant?.name,
    };

    if (qty === 0) {
      removeItem(product._id, selectedVariant?._id);
    } else if (currentQty === 0) {
      addItem(itemPayload, qty);
    } else {
      updateQty(product._id, qty, selectedVariant?._id);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/" className="hover:text-orange-600 hover:underline">
              Home
            </Link>
            <span className="mx-1">›</span>
            {product.category?.name && (
              <>
                <Link
                  href={`/search?category=${product.category.name}`}
                  className="hover:text-orange-600 hover:underline"
                >
                  {product.category.name}
                </Link>
                <span className="mx-1">›</span>
              </>
            )}
            <span className="text-gray-800 truncate max-w-[300px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main Product Section ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:w-[420px] xl:w-[500px] flex-shrink-0">
            <div className="flex gap-3 sticky top-4">
              {images.length > 1 && (
                <div className="flex flex-col gap-2 w-[60px] flex-shrink-0">
                  {images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onMouseEnter={() => setSelectedImage(idx)}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-[60px] h-[60px] flex-shrink-0 rounded border-2 overflow-hidden transition-all ${
                        selectedImage === idx
                          ? "border-[#c45500] shadow-sm"
                          : "border-gray-300 hover:border-[#c45500]"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`view ${idx + 1}`}
                        width={60}
                        height={60}
                        className="object-contain w-full h-full p-1 bg-white"
                        unoptimized={
                          typeof img === "string" && img.startsWith("http")
                        }
                      />
                    </button>
                  ))}
                </div>
              )}

              <div
                className="flex-1 relative bg-white rounded border border-gray-200 overflow-hidden cursor-zoom-in group"
                style={{ aspectRatio: "1/1" }}
                onClick={() => setZoomOpen(true)}
              >
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  priority
                  unoptimized={
                    typeof mainImage === "string" &&
                    mainImage.startsWith("http")
                  }
                />
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    -{discount}%
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/40 text-white rounded px-2 py-1 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={11} />
                  Zoom
                </div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE: Product Info ── */}
          <div className="flex-1 min-w-0">
            {product.brand?.name && (
              <p className="text-sm text-blue-600 hover:text-orange-500 hover:underline cursor-pointer mb-1 font-medium">
                {product.brand.name}
              </p>
            )}

            <h1 className="text-xl sm:text-2xl font-medium text-gray-900 leading-snug mb-3">
              {product.title}
            </h1>

            {product.attributes?.ratingAvg > 0 && (
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                <StarRating
                  value={product.attributes.ratingAvg}
                  count={product.attributes.ratingCount || 0}
                />
              </div>
            )}

            <div className="mb-4">
              {discount > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    -{discount}% off
                  </span>
                  <span className="text-xs text-gray-500">
                    Limited time deal
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-semibold text-gray-900">
                  ₹{effectivePrice.toLocaleString()}
                </span>
                {effectiveMrp > effectivePrice && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm text-gray-500">M.R.P.:</span>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{effectiveMrp.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {savings > 0 && (
                <p className="text-sm text-gray-700 mt-1">
                  You Save:{" "}
                  <span className="font-semibold text-gray-900">
                    ₹{savings.toLocaleString()}
                  </span>
                </p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                Inclusive of all taxes
              </p>
            </div>

            {variants.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <VariantSelector
                  variants={variants}
                  selectedVariantId={selectedVariant?._id || null}
                  onVariantChange={handleVariantChange}
                />
              </div>
            )}

            {product.category?.name && (
              <div className="flex items-center gap-2 text-sm mb-3">
                <Tag size={14} className="text-gray-500" />
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">
                  {product.category.name}
                </span>
              </div>
            )}

            {product.description && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Truck size={15} className="text-green-600 flex-shrink-0" />
                <span>
                  <span className="font-semibold text-gray-900">
                    FREE Delivery
                  </span>{" "}
                  on orders above ₹500
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck
                  size={15}
                  className="text-blue-600 flex-shrink-0"
                />
                <span>100% Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <RotateCcw
                  size={15}
                  className="text-orange-500 flex-shrink-0"
                />
                <span>Easy Returns &amp; Exchanges</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Buy Box ── */}
          <div className="lg:w-[240px] xl:w-[260px] flex-shrink-0">
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm">

              {/* Price */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{effectivePrice.toLocaleString()}
                  </span>
                  {effectiveMrp > effectivePrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{effectiveMrp.toLocaleString()}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-green-700 font-semibold mt-0.5">
                    You save ₹{savings.toLocaleString()}
                  </p>
                )}
              </div>

              {/* FREE Delivery */}
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-semibold text-green-700">FREE</span>{" "}
                Delivery on orders above ₹500
              </p>

              {/* Stock status */}
              <div className="mb-4">
                {inStock ? (
                  <span className="text-lg font-medium text-green-700">
                    In Stock
                  </span>
                ) : (
                  <span className="text-lg font-medium text-red-600">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* ✅ Quantity + Cart — single row when item in cart */}
              {currentQty > 0 ? (
                <div className="flex items-center gap-2 w-full mb-2">
                  <QuantitySelector
                    value={currentQty}
                    onChange={handleQty}
                    size="sm"
                  />
                  <Link
                    href="/cart"
                    className="flex-1 text-center bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-semibold py-2 px-3 rounded-full text-sm transition border border-[#FCD200] shadow-sm whitespace-nowrap"
                  >
                    Go to Cart
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleQty(1)}
                    disabled={!inStock}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900 font-semibold py-2 px-4 rounded-full text-sm transition border border-[#FCD200] shadow-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={15} />
                    Add to Cart
                  </button>
                  <button
                    disabled={!inStock}
                    className="w-full bg-[#FF9F0A] hover:bg-[#e8890a] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-full text-sm transition shadow-sm"
                  >
                    Buy Now
                  </button>
                </div>
              )}

              {/* Secure transaction */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck size={12} className="text-gray-400" />
                <span>Secure transaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Details Tabs ── */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-white p-0 h-auto gap-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c45500] data-[state=active]:text-[#c45500] px-6 py-3 font-semibold text-gray-600 hover:text-gray-900 text-sm transition-colors bg-white"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c45500] data-[state=active]:text-[#c45500] px-6 py-3 font-semibold text-gray-600 hover:text-gray-900 text-sm transition-colors bg-white"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c45500] data-[state=active]:text-[#c45500] px-6 py-3 font-semibold text-gray-600 hover:text-gray-900 text-sm transition-colors bg-white"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="description"
              className="py-6 text-gray-700 leading-relaxed text-sm"
            >
              {product.description || (
                <p className="text-gray-400 italic">
                  No description available for this product.
                </p>
              )}
            </TabsContent>

            <TabsContent value="specifications" className="py-6">
              <p className="text-gray-400 italic text-sm">
                Detailed specifications coming soon.
              </p>
            </TabsContent>

            <TabsContent value="reviews" className="py-6">
              {product?._id ? (
                <ReviewsSection productId={product._id} />
              ) : (
                <p className="text-gray-500 text-sm">Unable to load reviews</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Similar Products ── */}
        {loadingSimilar ? (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Similar Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded border border-gray-200 h-72 animate-pulse"
                >
                  <div className="w-full h-44 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : similarProducts.length > 0 ? (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Similar Products
              </h2>
              <button
                onClick={() => {
                  const categoryName = product?.category?.name;
                  router.push(
                    categoryName
                      ? `/search?q=${encodeURIComponent(categoryName)}`
                      : "/search"
                  );
                }}
                className="text-blue-600 hover:text-orange-500 hover:underline text-sm font-medium cursor-pointer"
              >
                See more →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((p: any) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Image Zoom Modal ── */}
      {zoomOpen && (
        <ImageZoomModal
          images={images}
          initialIndex={selectedImage}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}