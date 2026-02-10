"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { getAccessToken } from "@/lib/utils/auth";
import {
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCart as apiClearCart,
  getCart as apiGetCart,
  BackendCart,
} from "@/lib/api/cart.api";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string;
  variantId?: string;
  variantName?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  distinctCount: number;
  total: number;
  addItem: (item: Partial<CartItem>, qty?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  clearCart: () => void;
  updateQty: (id: string, qty: number, variantId?: string) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/* ---------------- helpers ---------------- */

function normalizeCartItem(raw: any): CartItem {
  const id = raw.id || raw.productId || raw._id || "";
  return {
    id,
    productId: id,
    name: raw.name || raw.title || "Product",
    price: Number(raw.price) || 0,
    qty: Number(raw.qty) || Number(raw.quantity) || 1,
    image_url: raw.image_url || raw.image || "",
    variantId: raw.variantId,
    variantName: raw.variantName,
  };
}

function backendToLocal(cart: BackendCart): CartItem[] {
  return (cart.items || []).map((bi) =>
    normalizeCartItem({
      id: bi.productId,
      name: bi.title,
      price: bi.price,
      qty: bi.qty,
      image_url: bi.image,
      variantId: bi.variantId,
      variantName: bi.variantName,
    })
  );
}

function readInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("kk_cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

/* ---------------- provider ---------------- */

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart);
  const itemsRef = useRef<CartItem[]>(items);

  // keep ref synced
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /* 🔑 KEY FIX: fetch backend cart ONLY when token exists */
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    (async () => {
      try {
        const remote = await apiGetCart();
        setItems(backendToLocal(remote));
      } catch {
        // silent: user not logged in / expired token
      }
    })();
  }, [getAccessToken()]); // re-run after login

  // persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("kk_cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  // cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: StorageEvent) => {
      if (e.key !== "kk_cart" || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          setItems(parsed.map(normalizeCartItem));
        }
      } catch {}
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* ---------------- actions ---------------- */

  const addItem = (item: Partial<CartItem>, qty = 1) => {
    const normalized = normalizeCartItem({ ...item, qty });

    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.id === normalized.id &&
          (p.variantId || null) === (normalized.variantId || null)
      );
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, normalized];
    });

    const token = getAccessToken();
    if (!token) return;

    apiAddToCart(normalized.id, qty, normalized.variantId)
      .then((c) => setItems(backendToLocal(c)))
      .catch(() => {});
  };

  const removeItem = (id: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (p) => !(p.id === id && (p.variantId || null) === (variantId || null))
      )
    );

    const token = getAccessToken();
    if (!token) return;

    apiRemoveCartItem(id, variantId)
      .then((c) => setItems(backendToLocal(c)))
      .catch(() => {});
  };

  const clearCart = () => {
    setItems([]);

    const token = getAccessToken();
    if (!token) return;

    apiClearCart()
      .then((c) => setItems(backendToLocal(c)))
      .catch(() => {});
  };

  const updateQty = (id: string, qty: number, variantId?: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id && (p.variantId || null) === (variantId || null)
          ? { ...p, qty }
          : p
      )
    );

    const token = getAccessToken();
    if (!token) return;

    apiUpdateCartItem(id, qty, variantId)
      .then((c) => setItems(backendToLocal(c)))
      .catch(() => {});
  };

  /* ---------------- derived ---------------- */

  const count = useMemo(
    () => items.reduce((s, it) => s + it.qty, 0),
    [items]
  );
  const distinctCount = items.length;
  const total = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.price, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        distinctCount,
        total,
        addItem,
        removeItem,
        clearCart,
        updateQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
