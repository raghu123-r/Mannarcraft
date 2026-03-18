// Product View page — displays product details with edit controls and size management

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSingleProduct, getBrands, getCategories } from "@/lib/admin";
import DefaultProductImage from "@/assets/images/ChatGPT Image Nov 28, 2025, 10_33_10 PM.png";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import VariantManager from "@/components/admin/VariantManager";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package, 
  Tag, 
  DollarSign, 
  Layers, 
  Image as ImageIcon,
  Calendar,
  CheckCircle,
  XCircle,
  Hash
} from "lucide-react";

export default function ViewProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch product, brands, and categories
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [productRes, brandsData, categoriesData] = await Promise.all([
          getSingleProduct(productId),
          getBrands(),
          getCategories(),
        ]);

        const fetchedProduct = productRes?.product || productRes?.data?.product || null;
        
        if (!fetchedProduct) {
          console.error('Product not found at expected paths', productRes);
        } else {
          const normalized = { ...fetchedProduct, id: fetchedProduct._id || fetchedProduct.id };
          setProduct(normalized);
        }

        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err: any) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://mk-backend-a6c7.onrender.com/api";
      const url = `${API_BASE}/admin/products/${productId}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.message || data.error?.message || 'Failed to delete product';
        toast.error(errorMsg);
        setIsDeleting(false);
        return;
      }

      toast.success('Product deleted successfully');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'An error occurred while deleting the product');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Product Not Found</h2>
            <p className="text-red-600 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <button
              onClick={() => router.push("/admin/products")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const brandName = product?.brand?.name 
    ?? brands?.find(b => String(b._id) === String(product.brand))?.name 
    ?? product.brand 
    ?? '-';
  
  const categoryName = product?.category?.name 
    ?? categories?.find(c => String(c._id) === String(product.category))?.name 
    ?? product.category 
    ?? '-';

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/products")}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">View Product</h1>
              <p className="text-sm text-slate-500 mt-0.5">Product details and information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/products/${product._id || product.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">Product Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                  <p className="text-lg font-semibold text-slate-900">{product?.title ?? '-'}</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {product?.description || <span className="text-slate-400 italic">No description provided</span>}
                  </p>
                </div>

                {/* Brand and Category */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Brand</label>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{brandName}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{categoryName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">Pricing & Inventory</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Selling Price</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{product?.price ?? '-'}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">MRP</p>
                    <p className="text-2xl font-bold text-slate-700">₹{product?.mrp ?? '-'}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Stock</p>
                    <p className="text-2xl font-bold text-blue-700">{product?.stock ?? '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Images Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">Product Images</h2>
                </div>
              </div>
              <div className="p-6">
                {Array.isArray(product?.images) && product.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {product.images.map((src: string, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <Image
                          src={src}
                          alt={`${product?.title} - Image ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          width={500}
                          height={500}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = typeof DefaultProductImage === 'string' ? DefaultProductImage : DefaultProductImage.src;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No images available</p>
                    <p className="text-sm text-slate-400">Add images from the edit page</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Meta */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-900">Status</h2>
              </div>
              <div className="p-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  product?.isActive 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {product?.isActive ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {product?.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Timestamps Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <h2 className="font-semibold text-slate-900">Timestamps</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Created</label>
                  <p className="text-sm font-medium text-slate-700">
                    {product?.createdAt 
                      ? new Date(product.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }) 
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Updated</label>
                  <p className="text-sm font-medium text-slate-700">
                    {product?.updatedAt 
                      ? new Date(product.updatedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }) 
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Product ID Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-slate-400" />
                  <h2 className="font-semibold text-slate-900">Product ID</h2>
                </div>
              </div>
              <div className="p-6">
                <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg block text-slate-600 font-mono break-all">
                  {product?._id || product?.id || '-'}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Product Variants Section */}
        {productId && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">Available Sizes & Prices</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Manage product variants and pricing options</p>
            </div>
            <div className="p-6">
              <VariantManager productId={productId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
