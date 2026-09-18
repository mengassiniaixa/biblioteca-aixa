import { Book as BookIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "./cn";

export type BookCoverSize = "sm" | "md" | "lg";

interface BookCoverProps {
  src?: string | null;
  alt: string;
  size?: BookCoverSize;
  className?: string;
}

const boxClass: Record<BookCoverSize, string> = {
  sm: "h-14 w-10",
  md: "h-24 w-16",
  lg: "h-56 w-40",
};

const iconPx: Record<BookCoverSize, number> = {
  sm: 14,
  md: 22,
  lg: 40,
};

export function BookCover({ src, alt, size = "sm", className }: BookCoverProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = Boolean(src) && !broken;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded bg-paper-mid text-ink-muted",
        boxClass[size],
        className,
      )}
      aria-hidden={!showImg || undefined}
      data-testid="book-cover"
    >
      {showImg ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <BookIcon size={iconPx[size]} />
      )}
    </div>
  );
}
