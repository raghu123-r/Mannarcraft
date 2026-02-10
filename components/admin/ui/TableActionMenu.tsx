"use client";

import { ReactNode } from "react";

interface TableActionMenuProps {
  children: ReactNode;
}

export function TableActionMenu({ children }: TableActionMenuProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}
