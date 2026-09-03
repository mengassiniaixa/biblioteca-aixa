import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { cn } from "./cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className, containerClassName, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wide text-ink-muted"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded border border-paper-edge bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
            "transition-colors hover:border-ink-muted",
            "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-paper-soft",
            Boolean(error) && "border-accent hover:border-accent focus:border-accent focus:ring-accent",
            "disabled:bg-paper-mid disabled:text-ink-muted disabled:cursor-not-allowed",
            className,
          )}
          {...rest}
        />
        {hint && !error ? (
          <p id={hintId} className="text-xs text-ink-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-xs text-accent">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
