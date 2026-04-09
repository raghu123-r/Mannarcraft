'use client';

import React from 'react';
import { Check } from 'lucide-react';

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

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onVariantChange: (variant: Variant) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Try to map a variant name to a CSS color value for the swatch.
 * Returns null if the name doesn't look like a colour.
 */
function resolveColor(name: string): string | null {
  const n = name.toLowerCase().trim();

  const colorMap: Record<string, string> = {
    // reds
    red: '#ef4444', 'dark red': '#991b1b', crimson: '#dc143c', maroon: '#800000',
    // pinks
    pink: '#ec4899', 'light pink': '#fbcfe8', 'hot pink': '#ff69b4', rose: '#f43f5e',
    // oranges
    orange: '#f97316', peach: '#ffcba4', coral: '#ff6b6b', salmon: '#fa8072',
    // yellows
    yellow: '#eab308', gold: '#f59e0b', cream: '#fffdd0', ivory: '#fffff0', beige: '#f5f0e8',
    // greens
    green: '#22c55e', 'dark green': '#15803d', olive: '#6b7c2e', mint: '#a8e6cf', lime: '#84cc16', teal: '#14b8a6',
    // blues
    blue: '#3b82f6', 'dark blue': '#1d4ed8', navy: '#1e3a5f', 'sky blue': '#38bdf8', 'light blue': '#bfdbfe', cobalt: '#0047ab', denim: '#1560bd',
    // purples / violets
    purple: '#a855f7', violet: '#8b5cf6', lavender: '#e9d5ff', lilac: '#c4b5fd', magenta: '#d946ef',
    // neutrals
    white: '#ffffff', off_white: '#f9f6f0', 'off white': '#f9f6f0',
    black: '#111827', charcoal: '#374151', 'dark grey': '#4b5563', 'dark gray': '#4b5563',
    grey: '#9ca3af', gray: '#9ca3af', 'light grey': '#e5e7eb', 'light gray': '#e5e7eb', silver: '#d1d5db',
    brown: '#92400e', tan: '#d4a574', khaki: '#c3b091', camel: '#c19a6b',
    // extras
    multicolor: 'linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)',
    multi: 'linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)',
  };

  // Direct match first
  if (colorMap[n]) return colorMap[n];

  // Partial match (e.g. "Royal Blue", "Forest Green")
  for (const [key, val] of Object.entries(colorMap)) {
    if (n.includes(key) || key.includes(n)) return val;
  }

  // CSS named-color check (very lightweight)
  const testEl = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (testEl) {
    testEl.style.backgroundColor = n;
    if (testEl.style.backgroundColor) return n;
  }

  return null;
}

/**
 * Decide whether this set of variants represents sizes or colours.
 * If ANY variant resolves to a color swatch → treat as colour selector.
 */
function detectMode(variants: Variant[]): 'color' | 'size' {
  const colorHits = variants.filter((v) => resolveColor(v.name) !== null).length;
  // If more than half look like colours → colour mode
  return colorHits >= Math.ceil(variants.length / 2) ? 'color' : 'size';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ColorSwatch({
  variant,
  isSelected,
  onClick,
}: {
  variant: Variant;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isOutOfStock = variant.stock === 0 || !variant.isActive;
  const colorVal = resolveColor(variant.name) ?? '#9ca3af';
  const isGradient = colorVal.startsWith('linear-gradient');
  const isLight =
    !isGradient &&
    (colorVal === '#ffffff' ||
      colorVal === '#f9f6f0' ||
      colorVal === '#fffdd0' ||
      colorVal === '#ffffff' ||
      colorVal.includes('f9') ||
      colorVal.includes('ff'));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => !isOutOfStock && onClick()}
        disabled={isOutOfStock}
        title={variant.name}
        className={`
          relative w-10 h-10 rounded-full transition-all duration-200
          ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'hover:scale-105'}
          ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${isLight ? 'border border-gray-300' : 'border border-transparent'}
          shadow-sm
        `}
        style={
          isGradient
            ? { background: colorVal }
            : { backgroundColor: colorVal }
        }
      >
        {isSelected && !isGradient && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Check
              size={16}
              strokeWidth={3}
              className={isLight ? 'text-gray-800' : 'text-white'}
            />
          </span>
        )}
        {isOutOfStock && (
          // Diagonal strike-through line
          <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <span
              className="block w-[140%] h-[2px] bg-red-400 rotate-45 origin-center"
              style={{ opacity: 0.8 }}
            />
          </span>
        )}
      </button>
      <span
        className={`text-[10px] leading-tight text-center max-w-[48px] truncate font-medium ${
          isSelected ? 'text-emerald-700' : 'text-gray-500'
        }`}
      >
        {variant.name}
      </span>
    </div>
  );
}

function SizeButton({
  variant,
  isSelected,
  onClick,
}: {
  variant: Variant;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isOutOfStock = variant.stock === 0 || !variant.isActive;

  return (
    <button
      onClick={() => !isOutOfStock && onClick()}
      disabled={isOutOfStock}
      title={isOutOfStock ? 'Out of Stock' : variant.name}
      className={`
        relative min-w-[52px] px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-150 select-none
        ${
          isSelected
            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-200'
            : isOutOfStock
            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer'
        }
      `}
    >
      {variant.name}
      {isOutOfStock && (
        /* diagonal line across the button */
        <span className="absolute inset-0 overflow-hidden rounded-[6px] pointer-events-none">
          <span className="block absolute top-1/2 left-0 w-full h-[1.5px] bg-gray-300 rotate-[-18deg] origin-center" />
        </span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  const mode = detectMode(variants);
  const selected = variants.find((v) => v._id === selectedVariantId) ?? null;

  if (mode === 'color') {
    return (
      <div className="mb-6">
        {/* Label row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">Colour:</span>
          {selected && (
            <span className="text-sm font-bold text-gray-900">{selected.name}</span>
          )}
        </div>

        {/* Swatches */}
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => (
            <ColorSwatch
              key={variant._id}
              variant={variant}
              isSelected={selectedVariantId === variant._id}
              onClick={() => onVariantChange(variant)}
            />
          ))}
        </div>

        {/* Low stock warning */}
        {selected && selected.stock > 0 && selected.stock <= 5 && (
          <p className="mt-2 text-xs font-semibold text-orange-600">
            Only {selected.stock} left in this colour!
          </p>
        )}
      </div>
    );
  }

  // ── Size mode (default) ───────────────────────────────────────────────────
  return (
    <div className="mb-6">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">Size:</span>
        {selected && (
          <span className="text-sm font-bold text-gray-900">{selected.name}</span>
        )}
      </div>

      {/* Size buttons */}
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <SizeButton
            key={variant._id}
            variant={variant}
            isSelected={selectedVariantId === variant._id}
            onClick={() => onVariantChange(variant)}
          />
        ))}
      </div>

      {/* Low stock warning */}
      {selected && selected.stock > 0 && selected.stock <= 5 && (
        <p className="mt-2 text-xs font-semibold text-orange-600">
          Only {selected.stock} left in this size!
        </p>
      )}
    </div>
  );
}