import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink-soft border border-ink disabled:bg-ink-muted disabled:border-ink-muted",
  secondary:
    "bg-paper text-ink border border-paper-edge hover:bg-paper-mid disabled:text-ink-faint disabled:bg-paper-soft",
  ghost:
    "bg-transparent text-ink-mid border border-transparent hover:bg-paper-mid hover:text-ink disabled:text-ink-faint",
  danger:
    "bg-accent text-paper border border-accent hover:bg-accent-hover hover:border-accent-hover disabled:bg-ink-muted disabled:border-ink-muted",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-3.5 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2",
};

export function buttonClassName(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const variant = opts?.variant ?? "secondary";
  const size = opts?.size ?? "md";
  return cn(
    "inline-flex items-center justify-center rounded font-medium transition-colors",
    "disabled:cursor-not-allowed",
    VARIANT[variant],
    SIZE[size],
    opts?.className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      className,
      iconLeft,
      iconRight,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={buttonClassName({ variant, size, className })}
        {...rest}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          iconLeft
        )}
        {children}
        {!isLoading && iconRight}
      </button>
    );
  },
);
Button.displayName = "Button";
