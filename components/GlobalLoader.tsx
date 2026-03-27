"use client";

interface GlobalLoaderProps {
  size?: "small" | "medium" | "large";
}

export default function GlobalLoader({ size = "medium" }: GlobalLoaderProps) {
  const sizeMap = {
    small: "w-6 h-6 border-2",
    medium: "w-10 h-10 border-2",
    large: "w-14 h-14 border-[3px]",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeMap[size]} rounded-full border-slate-200 border-t-emerald-500 animate-spin`}
      />
    </div>
  );
}