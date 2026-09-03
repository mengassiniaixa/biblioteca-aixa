import { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "default" | "muted" | "outline" | "danger" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE: Record<BadgeTone, string> = {
  default: "bg-ink text-paper",
  muted: "bg-paper-mid text-ink-mid",
  outline: "bg-transparent text-ink-mid border border-paper-edge",
  danger: "bg-accent-soft text-accent-hover",
  success: "bg-emerald-100 text-emerald-800",
};

export function Badge({
  tone = "default",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
