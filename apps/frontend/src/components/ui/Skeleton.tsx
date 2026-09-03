import { HTMLAttributes } from "react";
import { cn } from "./cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "span";
}

export function Skeleton({
  as = "div",
  className,
  ...rest
}: SkeletonProps) {
  const Component = as as "div";
  return (
    <Component
      aria-hidden="true"
      className={cn(
        "block h-3 w-full animate-pulse rounded bg-paper-mid",
        className,
      )}
      {...rest}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  ariaLabel?: string;
}

export function TableSkeleton({
  rows = 4,
  columns = 5,
  ariaLabel = "Cargando…",
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card"
    >
      <div className="border-b border-paper-edge bg-paper-mid px-3 py-2">
        <div className="flex gap-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-paper-edge">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3 px-3 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
