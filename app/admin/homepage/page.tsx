"use client";

import { useEffect, useState } from "react";
import { 
  getAdminHomepageBrands, 
  getAdminHomepageCategories,
  updateBrand,
  updateCategory,
  apiGetAuth,
  apiPostAuth,
  apiPutAuth,
  apiDeleteAuth,
  getAdminTopPicksConfig,
  updateAdminTopPicks,
  searchProductsForTopPicks,
  browseProductsForTopPicks
} from "@/lib/admin";
import { AdminLoadingState } from "@/components/admin/ui/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { CheckCircle, AlertCircle, Home, Search, X, GripVertical, Star, Package, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import Image from "next/image";

type HomepageItem = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  showOnHomepage: boolean;
  homepageOrder: number | null;
};

type HeroImage = {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

type SlotState = {
  slotNumber: number;
  assignedItemId: string | null;
};

type TopPickProduct = {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
  mrp: number;
  stock: number;
};

export default function AdminHomepagePage() {
  const [allBrands, setAllBrands] = useState<HomepageItem[]>([]);
  const [allCategories, setAllCategories] = useState<HomepageItem[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [brandSlots, setBrandSlots] = useState<SlotState[]>([
    { slotNumber: 1, assignedItemId: null },
    { slotNumber: 2, assignedItemId: null },
    { slotNumber: 3, assignedItemId: null },
    { slotNumber: 4, assignedItemId: null },
  ]);
  const [categorySlots, setCategorySlots] = useState<SlotState[]>([
    { slotNumber: 1, assignedItemId: null },
    { slotNumber: 2, assignedItemId: null },
    { slotNumber: 3, assignedItemId: null },
    { slotNumber: 4, assignedItemId: null },
  ]);
  // Top Picks state
  const [topPickProducts, setTopPickProducts] = useState<TopPickProduct[]>([]);
  const [savingTopPicks, setSavingTopPicks] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // ==================== HERO IMAGES MANAGEMENT ====================
  
  async function loadHeroImages() {
    try {
      const data = await apiGetAuth("/admin/hero-images");
      const images = Array.isArray(data) ? data : (data?.data || []);
      return images;
    } catch (error) {
      console.error("Failed to load hero images:", error);
      return [];
    }
  }

  async function handleHeroUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://mk-backend-a6c7.onrender.com/api";
      
      const res = await fetch(`${API_BASE}/admin/hero-images`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data?.error?.message || "Upload failed";
        throw new Error(errorMessage);
      }

      form.reset();
      const heroData = await loadHeroImages();
      setHeroImages(heroData);
      showMessage('success', 'Hero image uploaded successfully!');
    } catch (err: any) {
      console.error("Upload error:", err);
      showMessage('error', err.message || 'Failed to upload hero image');
    } finally {
      setUploading(false);
    }
  }

  async function toggleHeroActive(id: string, currentStatus: boolean) {
    try {
      await apiPutAuth(`/admin/hero-images/${id}`, { isActive: !currentStatus });
      const heroData = await loadHeroImages();
      setHeroImages(heroData);
      showMessage('success', 'Hero image status updated');
    } catch (err: any) {
      console.error("Toggle error:", err);
      showMessage('error', err.message || 'Failed to update status');
    }
  }

  async function updateHeroOrder(id: string, newOrder: number) {
    try {
      await apiPutAuth(`/admin/hero-images/${id}`, { displayOrder: newOrder });
      const heroData = await loadHeroImages();
      setHeroImages(heroData);
      showMessage('success', 'Display order updated');
    } catch (err: any) {
      console.error("Update error:", err);
      showMessage('error', err.message || 'Failed to update order');
    }
  }

  async function updateHeroText(id: string, title: string, subtitle: string) {
    try {
      await apiPutAuth(`/admin/hero-images/${id}`, { title, subtitle });
      const heroData = await loadHeroImages();
      setHeroImages(heroData);
      showMessage('success', 'Hero text updated');
    } catch (err: any) {
      console.error("Update error:", err);
      showMessage('error', err.message || 'Failed to update text');
      throw err;
    }
  }

  async function deleteHeroImage(id: string) {
    if (!confirm("Delete this hero image? This cannot be undone.")) return;

    try {
      await apiDeleteAuth(`/admin/hero-images/${id}`);
      const heroData = await loadHeroImages();
      setHeroImages(heroData);
      showMessage('success', 'Hero image deleted');
    } catch (err: any) {
      console.error("Delete error:", err);
      showMessage('error', err.message || 'Failed to delete image');
    }
  }

  // ==================== DATA LOADING ====================

  async function loadData() {
    setLoading(true);
    try {
      const [brandsData, categoriesData, heroData, topPicksData] = await Promise.all([
        getAdminHomepageBrands(),
        getAdminHomepageCategories(),
        loadHeroImages(),
        getAdminTopPicksConfig()
      ]);
      
      setAllBrands(brandsData || []);
      setAllCategories(categoriesData || []);
      setHeroImages(heroData || []);
      setTopPickProducts(topPicksData?.pinnedProducts || []);
      
      // Initialize brand slots from backend data
      const newBrandSlots = [1, 2, 3, 4].map(slotNum => {
        const assignedBrand = brandsData?.find(
          (b: HomepageItem) => b.showOnHomepage && b.homepageOrder === slotNum
        );
        return {
          slotNumber: slotNum,
          assignedItemId: assignedBrand?._id || null
        };
      });
      setBrandSlots(newBrandSlots);
      
      // Initialize category slots from backend data
      const newCategorySlots = [1, 2, 3, 4].map(slotNum => {
        const assignedCategory = categoriesData?.find(
          (c: HomepageItem) => c.showOnHomepage && c.homepageOrder === slotNum
        );
        return {
          slotNumber: slotNum,
          assignedItemId: assignedCategory?._id || null
        };
      });
      setCategorySlots(newCategorySlots);
      
    } catch (error: any) {
      console.error("Failed to load homepage data:", error);
      showMessage('error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function assignBrandToSlot(slotNumber: number, itemId: string | null) {
    setBrandSlots(prev => prev.map(slot => 
      slot.slotNumber === slotNumber 
        ? { ...slot, assignedItemId: itemId }
        : slot
    ));
  }

  function assignCategoryToSlot(slotNumber: number, itemId: string | null) {
    setCategorySlots(prev => prev.map(slot => 
      slot.slotNumber === slotNumber 
        ? { ...slot, assignedItemId: itemId }
        : slot
    ));
  }

  async function saveBrandLayout() {
    setSaving(true);
    try {
      // Get current slot assignments (what user wants)
      const assignedBrandIds = new Set(
        brandSlots
          .filter(s => s.assignedItemId !== null)
          .map(s => s.assignedItemId)
      );

      // PHASE 1: CLEAR - Remove all brands currently on homepage that are NOT in the new assignment
      const brandsToRemove = allBrands.filter(
        brand => brand.showOnHomepage && !assignedBrandIds.has(brand._id)
      );

      for (const brand of brandsToRemove) {
        await updateBrand(brand._id, {
          showOnHomepage: false
        });
      }

      // PHASE 2: ASSIGN - Set new positions for all selected brands
      for (const slot of brandSlots) {
        if (slot.assignedItemId) {
          const brand = allBrands.find(b => b._id === slot.assignedItemId);
          if (brand && (brand.homepageOrder !== slot.slotNumber || !brand.showOnHomepage)) {
            await updateBrand(brand._id, {
              showOnHomepage: true,
              homepageOrder: slot.slotNumber
            });
          }
        }
      }

      showMessage('success', 'Brand layout saved successfully');
      await loadData(); // Refresh to ensure sync
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to save brand layout');
      await loadData(); // Reload on error to reset state
    } finally {
      setSaving(false);
    }
  }

  async function saveCategoryLayout() {
    setSaving(true);
    try {
      // Get current slot assignments (what user wants)
      const assignedCategoryIds = new Set(
        categorySlots
          .filter(s => s.assignedItemId !== null)
          .map(s => s.assignedItemId)
      );

      // PHASE 1: CLEAR - Remove all categories currently on homepage that are NOT in the new assignment
      const categoriesToRemove = allCategories.filter(
        category => category.showOnHomepage && !assignedCategoryIds.has(category._id)
      );

      for (const category of categoriesToRemove) {
        await updateCategory(category._id, {
          showOnHomepage: false
        });
      }

      // PHASE 2: ASSIGN - Set new positions for all selected categories
      for (const slot of categorySlots) {
        if (slot.assignedItemId) {
          const category = allCategories.find(c => c._id === slot.assignedItemId);
          if (category && (category.homepageOrder !== slot.slotNumber || !category.showOnHomepage)) {
            await updateCategory(category._id, {
              showOnHomepage: true,
              homepageOrder: slot.slotNumber
            });
          }
        }
      }

      showMessage('success', 'Category layout saved successfully');
      await loadData();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to save category layout');
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  // ==================== TOP PICKS HANDLERS ====================

  async function saveTopPicks() {
    setSavingTopPicks(true);
    try {
      const pinnedIds = topPickProducts.map(p => p._id);
      await updateAdminTopPicks(pinnedIds);
      showMessage('success', 'Top picks saved successfully');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to save top picks');
    } finally {
      setSavingTopPicks(false);
    }
  }

  function handleAddTopPick(product: TopPickProduct) {
    if (topPickProducts.length >= 8) {
      showMessage('error', 'Maximum 8 products allowed');
      return;
    }
    if (topPickProducts.find(p => p._id === product._id)) {
      showMessage('error', 'Product already added');
      return;
    }
    setTopPickProducts(prev => [...prev, product]);
  }

  function handleRemoveTopPick(productId: string) {
    setTopPickProducts(prev => prev.filter(p => p._id !== productId));
  }

  function handleReorderTopPicks(fromIndex: number, toIndex: number) {
    setTopPickProducts(prev => {
      const newList = [...prev];
      const [removed] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, removed);
      return newList;
    });
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Homepage Management"
          description="Manage what appears on your homepage"
        />
        <AdminLoadingState message="Loading homepage data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Homepage Management"
        description="Manage hero carousel, featured brands, and categories"
      />

      {/* Toast Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Hero Section */}
      <HeroSectionManagement
        heroImages={heroImages}
        onUpload={handleHeroUpload}
        onToggleActive={toggleHeroActive}
        onUpdateOrder={updateHeroOrder}
        onUpdateText={updateHeroText}
        onDelete={deleteHeroImage}
        uploading={uploading}
      />

      <div className="h-12" />

      {/* Brands Section */}
      <HomepageSlotSection
        title="Homepage Brands"
        slots={brandSlots}
        allItems={allBrands}
        onSlotChange={assignBrandToSlot}
        onSave={saveBrandLayout}
        saving={saving}
      />

      <div className="h-12" />

      {/* Categories Section */}
      <HomepageSlotSection
        title="Homepage Categories"
        slots={categorySlots}
        allItems={allCategories}
        onSlotChange={assignCategoryToSlot}
        onSave={saveCategoryLayout}
        saving={saving}
      />

      <div className="h-12" />

      {/* Top Picks Section */}
      <TopPicksSection
        products={topPickProducts}
        onAdd={handleAddTopPick}
        onRemove={handleRemoveTopPick}
        onReorder={handleReorderTopPicks}
        onSave={saveTopPicks}
        saving={savingTopPicks}
      />
    </div>
  );
}

function HomepageSlotSection({
  title,
  slots,
  allItems,
  onSlotChange,
  onSave,
  saving
}: {
  title: string;
  slots: SlotState[];
  allItems: HomepageItem[];
  onSlotChange: (slotNumber: number, itemId: string | null) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const usedSlots = slots.filter(s => s.assignedItemId !== null).length;
  const availableItems = allItems.filter(item => item.isActive);
  
  // Get list of already assigned item IDs for this section
  const assignedItemIds = new Set(slots.map(s => s.assignedItemId).filter(Boolean));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Section Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {usedSlots} of 4 slots filled
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map(slot => {
            const assignedItem = allItems.find(item => item._id === slot.assignedItemId);
            
            return (
              <div
                key={slot.slotNumber}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-300 transition-colors"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Slot {slot.slotNumber}
                  </span>
                  {assignedItem && (
                    <button
                      onClick={() => onSlotChange(slot.slotNumber, null)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                      title="Clear slot"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Slot Content */}
                {assignedItem ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {assignedItem.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignedItem.slug}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-xs">Empty</p>
                  </div>
                )}

                {/* Dropdown Selector */}
                <select
                  value={slot.assignedItemId || ''}
                  onChange={(e) => onSlotChange(slot.slotNumber, e.target.value || null)}
                  className="mt-3 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select item...</option>
                  {availableItems.map(item => {
                    const isAssignedElsewhere = assignedItemIds.has(item._id) && item._id !== slot.assignedItemId;
                    return (
                      <option 
                        key={item._id} 
                        value={item._id}
                        disabled={isAssignedElsewhere}
                      >
                        {item.name} {isAssignedElsewhere ? '(In use)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== HERO SECTION MANAGEMENT COMPONENT ====================

function HeroSectionManagement({
  heroImages,
  onUpload,
  onToggleActive,
  onUpdateOrder,
  onUpdateText,
  onDelete,
  uploading
}: {
  heroImages: HeroImage[];
  onUpload: (e: React.FormEvent<HTMLFormElement>) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onUpdateOrder: (id: string, newOrder: number) => void;
  onUpdateText: (id: string, title: string, subtitle: string) => Promise<void>;
  onDelete: (id: string) => void;
  uploading: boolean;
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCount = heroImages.filter(img => img.isActive).length;
  const sortedImages = [...heroImages].sort((a, b) => a.displayOrder - b.displayOrder);
  const MAX_HERO_IMAGES = 8;
  const isAtLimit = heroImages.length >= MAX_HERO_IMAGES;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl shadow-sm border border-gray-200/80">
      {/* Premium Header with Stats */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Hero Carousel</h2>
                <p className="text-emerald-50 text-sm mt-0.5">Manage homepage banner images</p>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{activeCount}</div>
              <div className="text-xs text-emerald-50">Active</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{heroImages.length}</div>
              <div className="text-xs text-emerald-50">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Upload Toggle Button */}
      <div className="px-6 sm:px-8 py-4 bg-gray-50/80 border-b border-gray-200/60">
        {isAtLimit ? (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Maximum Limit Reached</h4>
              <p className="text-sm text-amber-800">
                You have reached the maximum of {MAX_HERO_IMAGES} hero images. Please delete an existing image to add a new one.
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="group flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isUploadOpen ? 'rotate-45' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{isUploadOpen ? 'Close Upload Form' : 'Add New Hero Image'}</span>
          </button>
        )}
      </div>

      {/* Collapsible Upload Form */}
      <div className={`overflow-hidden transition-all duration-300 ${isUploadOpen && !isAtLimit ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 sm:px-8 py-6 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-200/60">
          <form onSubmit={(e) => { onUpload(e); setIsUploadOpen(false); }} className="space-y-5">
            {/* Image Upload - Featured */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Hero Image <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="files"
                  accept="image/*"
                  required
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-emerald-600 file:to-teal-600
                    file:text-white file:shadow-md
                    hover:file:shadow-lg hover:file:scale-[1.02]
                    file:transition-all file:duration-200
                    file:cursor-pointer
                    cursor-pointer
                    border border-gray-300 rounded-xl
                    hover:border-emerald-400 transition-colors
                    bg-white p-3"
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Recommended: 1920×600px • Max 5MB • JPG, PNG, or WebP</span>
              </div>
            </div>

            {/* Text Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Summer Sale 2026"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                    focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100
                    transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Subheadline
                </label>
                <input
                  type="text"
                  name="subtitle"
                  placeholder="e.g., Up to 70% off on all items"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                    focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100
                    transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600
                  text-white font-semibold rounded-xl
                  hover:shadow-lg hover:scale-[1.02]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-200 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Image</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl
                  hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hero Images Gallery */}
      <div className="px-6 sm:px-8 py-6">
        {heroImages.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hero images yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Start building an engaging homepage by uploading your first hero banner image.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl
                hover:bg-emerald-700 hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Hero Image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedImages.map((img, index) => (
              <HeroImageCard
                key={img._id}
                image={img}
                index={index}
                onToggleActive={onToggleActive}
                onUpdateOrder={onUpdateOrder}
                onUpdateText={onUpdateText}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== HERO IMAGE CARD COMPONENT ====================

function HeroImageCard({
  image,
  index,
  onToggleActive,
  onUpdateOrder,
  onUpdateText,
  onDelete
}: {
  image: HeroImage;
  index: number;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onUpdateOrder: (id: string, newOrder: number) => void;
  onUpdateText: (id: string, title: string, subtitle: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(image.title);
  const [editSubtitle, setEditSubtitle] = useState(image.subtitle);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Sync modal state when image changes or modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      setEditTitle(image.title);
      setEditSubtitle(image.subtitle);
      setEditError('');
    }
  }, [isEditModalOpen, image.title, image.subtitle]);

  const handleEditSave = async () => {
    setSaving(true);
    setEditError('');
    try {
      await onUpdateText(image._id, editTitle, editSubtitle);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update hero text:', err);
      setEditError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
      image.isActive 
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-200 shadow-md hover:shadow-lg' 
        : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
    }`}>
      {/* Order Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs backdrop-blur-md ${
          image.isActive 
            ? 'bg-emerald-600/90 text-white shadow-lg' 
            : 'bg-gray-800/80 text-white'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Position {image.displayOrder}
        </div>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`px-3 py-1.5 rounded-lg font-semibold text-xs backdrop-blur-md shadow-lg ${
          image.isActive 
            ? 'bg-green-500/90 text-white' 
            : 'bg-gray-700/80 text-gray-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${image.isActive ? 'bg-white' : 'bg-gray-400'} animate-pulse`} />
            {image.isActive ? 'Live' : 'Hidden'}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Image Preview */}
        <div className="relative flex-shrink-0 w-full lg:w-80 h-44 rounded-lg overflow-hidden bg-gray-100 shadow-inner">
          <Image
            src={image.imageUrl}
            alt={image.title || "Hero banner"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!image.isActive && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end justify-center pb-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-semibold rounded-lg">
                Not Visible on Site
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {image.title || <span className="text-gray-400 italic">Untitled Banner</span>}
            </h3>
            {image.subtitle && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {image.subtitle}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Added {new Date(image.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200/60">
            {/* Display Order Input */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">Display Order:</label>
              <input
                type="number"
                min="0"
                value={image.displayOrder}
                onChange={(e) => onUpdateOrder(image._id, parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Spacer - Hidden on mobile, shown on md+ */}
            <div className="hidden md:flex md:flex-1 md:min-w-[20px]" />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              
              <button
                onClick={() => onToggleActive(image._id, image.isActive)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  image.isActive
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {image.isActive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {image.isActive ? 'Hide' : 'Show'}
              </button>
              
              <button
                onClick={() => {
                  if (confirm(`Delete "${image.title || 'this hero image'}"? This action cannot be undone.`)) {
                    onDelete(image._id);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-700 
                  hover:bg-red-100 border border-red-200 hover:border-red-300
                  transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Hero Text</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {editError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {editError}
                </div>
              )}

              {/* Title Input */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Summer Sale 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Subtitle Input */}
              <div>
                <label htmlFor="edit-subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Subheadline
                </label>
                <input
                  type="text"
                  id="edit-subtitle"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="e.g., Up to 70% off on all items"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg
                    hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg
                    hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== TOP PICKS SECTION COMPONENT ====================

function TopPicksSection({
  products,
  onAdd,
  onRemove,
  onReorder,
  onSave,
  saving
}: {
  products: TopPickProduct[];
  onAdd: (product: TopPickProduct) => void;
  onRemove: (productId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TopPickProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Browse state
  const [browseProducts, setBrowseProducts] = useState<TopPickProduct[]>([]);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePagination, setBrowsePagination] = useState({ 
    page: 1, totalPages: 1, hasNext: false, hasPrev: false, totalCount: 0 
  });
  const [showBrowse, setShowBrowse] = useState(false);

  // Search products
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results = await searchProductsForTopPicks(searchQuery, 10);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load browse products when browse is opened or page changes
  useEffect(() => {
    if (!showBrowse) return;
    
    const loadBrowseProducts = async () => {
      setBrowseLoading(true);
      try {
        const result = await browseProductsForTopPicks(browsePage, 10);
        setBrowseProducts(result.products || []);
        setBrowsePagination(result.pagination);
      } catch (error) {
        console.error('Browse error:', error);
        setBrowseProducts([]);
      } finally {
        setBrowseLoading(false);
      }
    };
    
    loadBrowseProducts();
  }, [showBrowse, browsePage]);

  const selectedIds = new Set(products.map(p => p._id));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Section Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Top Picks for Homepage</h2>
              <p className="mt-1 text-sm text-gray-500">
                {products.length} of 8 products selected • Drag to reorder
              </p>
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Top Picks'}
          </button>
        </div>
      </div>

      {/* Add Product Search */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        {products.length < 8 ? (
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Add Products</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search products by name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            
            {/* Search Results Dropdown */}
            {showSearch && searchQuery.trim().length >= 2 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No products found</div>
                ) : (
                  searchResults.map(product => {
                    const isSelected = selectedIds.has(product._id);
                    return (
                      <button
                        key={product._id}
                        onClick={() => {
                          if (!isSelected) {
                            onAdd(product);
                            setSearchQuery('');
                            setShowSearch(false);
                          }
                        }}
                        disabled={isSelected}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          isSelected ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                        }`}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-sm text-gray-500">₹{product.price}</p>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-emerald-600 font-medium">Added</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Maximum 8 products reached. Remove a product to add more.</span>
          </div>
        )}
      </div>

      {/* Browse Products Section */}
      {products.length < 8 && (
        <div className="px-6 pb-6">
          {/* Toggle Browse Button */}
          <button
            onClick={() => {
              setShowBrowse(!showBrowse);
              if (!showBrowse) setBrowsePage(1);
            }}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>{showBrowse ? 'Hide Browse' : 'Browse All Products'}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showBrowse ? 'rotate-90' : ''}`} />
          </button>

          {/* Browse Products Grid */}
          {showBrowse && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Browse Header with Pagination */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                  {browsePagination.totalCount} products available
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBrowsePage(p => Math.max(1, p - 1))}
                    disabled={!browsePagination.hasPrev || browseLoading}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    Page {browsePagination.page} of {browsePagination.totalPages}
                  </span>
                  <button
                    onClick={() => setBrowsePage(p => p + 1)}
                    disabled={!browsePagination.hasNext || browseLoading}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Products List */}
              <div className="max-h-80 overflow-y-auto">
                {browseLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-emerald-600 mb-2"></div>
                    <p>Loading products...</p>
                  </div>
                ) : browseProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No products found</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {browseProducts.map(product => {
                      const isSelected = selectedIds.has(product._id);
                      return (
                        <div
                          key={product._id}
                          className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-sm text-gray-500">₹{product.price}</p>
                          </div>
                          {isSelected ? (
                            <span className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                              Added
                            </span>
                          ) : (
                            <button
                              onClick={() => onAdd(product)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Products Grid */}
      <div className="p-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
              <Star className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products selected</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Search and add products above to feature them in the &ldquo;Top Picks for You&rdquo; section on your homepage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <div
                key={product._id}
                className="relative group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors"
              >
                {/* Position Badge */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={() => onRemove(product._id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove product"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {product.title}
                </h4>
                <p className="text-emerald-600 font-semibold">₹{product.price}</p>

                {/* Reorder Buttons */}
                <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => index > 0 && onReorder(index, index - 1)}
                    disabled={index === 0}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Move Left
                  </button>
                  <button
                    onClick={() => index < products.length - 1 && onReorder(index, index + 1)}
                    disabled={index === products.length - 1}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Move Right →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="px-6 pb-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works</p>
            <p>Selected products appear first in &ldquo;Top Picks for You&rdquo; section. Remaining slots (up to 8) are filled with random products automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
