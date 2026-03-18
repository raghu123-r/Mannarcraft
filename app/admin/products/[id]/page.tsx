"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSingleProduct, updateProduct, getBrands, getCategories } from "@/lib/admin";
import InlineSizeManager from "@/components/admin/InlineSizeManager";
import { 
  ArrowLeft, 
  Save, 
  X,
  Package, 
  FileText,
  Tag, 
  Layers,
  DollarSign,
  Image as ImageIcon,
  ToggleLeft,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2
} from "lucide-react";

interface Size {
  _id?: string;
  name: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);

  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [status, setStatus] = useState("");
  const [sizeErrors, setSizeErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // Fetch product, brands, and categories
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [productRes, brandsData, categoriesData, variantsRes] = await Promise.all([
          getSingleProduct(productId),
          getBrands(),
          getCategories(),
          // Fetch variants
          fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://mk-backend-a6c7.onrender.com/api'}/admin/products/${productId}/variants`, {
            headers: {
              'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''}`,
            }
          }).then(res => res.json()).catch(() => ({ success: false, data: [] }))
        ]);

        // Defensive access to product in response
        const product = productRes?.product || productRes?.data?.product || null;
        
        if (!product) {
          console.error('Product not found at expected paths', productRes);
          setStatus("Product not found");
        } else {
          // Normalize product: ensure id field exists
          const p = { ...product, id: product._id || product.id };
          
          setTitle(p.title || "");
          setDescription(p.description || "");
          setBrandId(p.brand?._id || p.brand || "");
          setCategoryId(p.category?._id || p.category || "");
          setPrice(p.price?.toString() || "");
          setMrp(p.mrp?.toString() || "");
          setStock(p.stock?.toString() || "");
          setImages(Array.isArray(p.images) ? p.images.join(", ") : "");
          setIsActive(p.isActive !== undefined ? p.isActive : true);
          setHasSizes(p.hasSizes || false);

          // Load variants if they exist
          if (variantsRes.success && Array.isArray(variantsRes.data) && variantsRes.data.length > 0) {
            setSizes(variantsRes.data);
          }
        }

        // Load brands and categories
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setStatus(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchData();
    }
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      setStatus("Title is required");
      return;
    }
    if (!brandId) {
      setStatus("Brand is required");
      return;
    }
    if (!categoryId) {
      setStatus("Category is required");
      return;
    }

    // Validate sizes if enabled
    if (hasSizes) {
      const errors: string[] = [];
      
      if (sizes.length === 0) {
        errors.push("At least one size is required when 'Has Multiple Sizes' is enabled");
      }
      
      const defaultSizes = sizes.filter(s => s.isDefault);
      if (defaultSizes.length === 0) {
        errors.push("Please mark one size as default");
      } else if (defaultSizes.length > 1) {
        errors.push("Only one size can be marked as default");
      }
      
      sizes.forEach((size, index) => {
        if (!size.name.trim()) {
          errors.push(`Size ${index + 1}: Name is required`);
        }
        if (size.price <= 0) {
          errors.push(`Size ${index + 1}: Price must be greater than 0`);
        }
        if (size.mrp <= 0) {
          errors.push(`Size ${index + 1}: MRP must be greater than 0`);
        }
        if (size.price > size.mrp) {
          errors.push(`Size ${index + 1}: Price cannot be greater than MRP`);
        }
      });

      if (errors.length > 0) {
        setSizeErrors(errors);
        setStatus("Please fix size validation errors");
        return;
      }
      setSizeErrors([]);
    } else {
      // If sizes are not enabled, validate base price/mrp/stock
      if (!price || parseFloat(price) <= 0) {
        setStatus("Valid price is required");
        return;
      }
      if (!mrp || parseFloat(mrp) <= 0) {
        setStatus("Valid MRP is required");
        return;
      }
      if (parseFloat(price) > parseFloat(mrp)) {
        setStatus("Price cannot be greater than MRP");
        return;
      }
      if (stock && parseFloat(stock) < 0) {
        setStatus("Stock cannot be negative");
        return;
      }
    }

    setStatus("Updating product...");
    setSaving(true);

    try {
      // Parse images (comma-separated URLs or empty)
      const imageArray = images.trim()
        ? images.split(",").map((url) => url.trim()).filter((url) => url.length > 0)
        : [];

      const payload: any = {
        title: title.trim(),
        brandId,
        categoryId,
        description: description.trim(),
        hasSizes,
        images: imageArray,
        isActive,
      };

      // If hasSizes is true, include variants
      if (hasSizes) {
        payload.variants = sizes;
        // Use default variant's price/stock for product-level fields (required by schema)
        const defaultSize = sizes.find(s => s.isDefault) || sizes[0];
        payload.price = defaultSize.price;
        payload.mrp = defaultSize.mrp;
        payload.stock = defaultSize.stock;
      } else {
        // Use form values for product-level fields
        payload.price = parseFloat(price);
        payload.mrp = parseFloat(mrp);
        payload.stock = stock ? parseFloat(stock) : 0;
      }

      await updateProduct(productId, payload);

      // Success: API call completed without throwing
      setStatus("Product updated successfully!");
      setSaving(false);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1000);
    } catch (err: any) {
      // Failure: API call threw an error
      setStatus(err.message || "Error updating product");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-slate-600 font-medium">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!title && status) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Product</h2>
            <p className="text-red-600 mb-6">{status}</p>
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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
              <p className="text-sm text-slate-500 mt-0.5">Update product details and settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">Basic Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter product title"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Brand and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 bg-white"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Layers className="w-4 h-4 inline mr-1" />
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card - Only shown when no sizes */}
          {!hasSizes && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">Pricing & Inventory</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required={!hasSizes}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="0.00"
                      required={!hasSizes}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Size Variants Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">Product Sizes</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <ToggleLeft className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Multiple Size Options</p>
                    <p className="text-sm text-slate-500">Enable if this product has different sizes/variants</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="hasSizes"
                    checked={hasSizes}
                    onChange={(e) => {
                      setHasSizes(e.target.checked);
                      if (!e.target.checked) {
                        setSizes([]);
                        setSizeErrors([]);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Info banner when sizes enabled */}
              {hasSizes && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Size Variants Enabled</p>
                    <p>Each size will have its own price, MRP, and stock. You must have at least one size and mark one as the default.</p>
                  </div>
                </div>
              )}

              {/* Size Manager */}
              {hasSizes && (
                <div className="mt-4">
                  <InlineSizeManager 
                    sizes={sizes} 
                    onChange={setSizes}
                    errors={sizeErrors}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Images Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">Add Images for Product</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Image URLs <span className="text-slate-400">(comma-separated)</span>
                </label>
                <div className="flex gap-3">
                  <input
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                    title="Browse Images"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Browse
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Enter multiple image URLs separated by commas, or use the Browse button to select from your media library.
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Product Status</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">Active Status</p>
                    <p className="text-sm text-slate-500">
                      {isActive ? 'Product is visible to customers' : 'Product is hidden from customers'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              status.includes("successfully") 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {status.includes("successfully") ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{status}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Product
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>

        {/* Image Upload Modal */}
        {showImageUploadModal && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageUploadModal(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-slate-900 mb-2">Product Image Upload</h2>
              <p className="text-slate-500 text-center mb-6">
                Product image upload coming soon
              </p>
              <button
                onClick={() => setShowImageUploadModal(false)}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
