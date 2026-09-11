import { cn } from "./cn";
import type { ReactNode } from "react";

type Placement = "top" | "bottom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-20 w-56 -translate-x-1/2 rounded bg-ink px-3 py-2 text-xs leading-snug text-paper opacity-0 shadow-pop transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
