"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface TableActionButtonProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
}

export function TableActionButton({
  icon,
  label,
  onClick,
}: TableActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-1"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
