"use client";

export default function TopAnnouncementBar() {
  return (
    <div className="relative w-full overflow-hidden bg-black h-[40px]">
      <div className="absolute whitespace-nowrap flex items-center h-full animate-marquee gap-12 px-4 text-white text-sm font-medium">
        <span className="flex items-center gap-2">
          🚚 <span>Free Shipping On All Orders Above ₹500 Within India</span>
        </span>

        <span className="flex items-center gap-2">
          🛒 <span>DM For International Orders</span>
        </span>

        <span className="flex items-center gap-2">
          🚚 <span>Free Shipping On All Orders Above ₹500 Within India</span>
        </span>

        <span className="flex items-center gap-2">
          🛒 <span>DM For International Orders</span>
        </span>
      </div>
    </div>
  );
}
