"use client";

import React from "react";

interface QuantitySelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export default function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = 99,
  size = "md",
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: "increment" | "decrement"
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (action === "increment") handleIncrement();
      else handleDecrement();
    }
  };

  const btnW = size === "sm" ? "w-7" : "w-8";
  const valW = size === "sm" ? "w-7" : "w-10";

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={handleDecrement}
        onKeyDown={(e) => handleKeyDown(e, "decrement")}
        disabled={value <= min}
        className={`${btnW} h-8 flex items-center justify-center text-red-500 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold border-r border-gray-300`}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <div
        className={`${valW} h-8 flex items-center justify-center text-sm font-semibold text-gray-800`}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        onKeyDown={(e) => handleKeyDown(e, "increment")}
        disabled={value >= max}
        className={`${btnW} h-8 flex items-center justify-center text-red-500 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold border-l border-gray-300`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}