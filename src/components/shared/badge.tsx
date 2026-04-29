import type { ReactNode } from "react";

import { cn } from "@lib/utils";
import type { TimesheetStatus } from "@/types";

interface BadgeProps {
  status?: TimesheetStatus;
  children?: ReactNode;
  className?: string;
}

const toneMap: Record<TimesheetStatus, string> = {
  COMPLETED: "bg-[var(--app-green-bg)] text-[var(--app-green-text)]",
  INCOMPLETE: "bg-[var(--app-yellow-bg)] text-[var(--app-yellow-text)]",
  MISSING: "bg-[var(--app-pink-bg)] text-[var(--app-pink-text)]",
};

export function Badge({ status = "COMPLETED", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-[8px] px-3 text-[11px] font-semibold uppercase tracking-[0.01em]",
        toneMap[status],
        className,
      )}
    >
      {children ?? status}
    </span>
  );
}
