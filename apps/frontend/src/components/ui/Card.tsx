import { HTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article";
  padded?: boolean;
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ as = "div", padded = true, interactive = false, className, children, ...rest }, ref) => {
    const Component = as as "div";
    return (
      <Component
        ref={ref}
        className={cn(
          "rounded border border-paper-edge bg-paper shadow-card",
          padded && "p-5",
          interactive && "transition-shadow hover:shadow-pop",
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Card.displayName = "Card";

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-ink", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-ink-muted", className)} {...rest}>
      {children}
    </p>
  );
}
