import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "./cn";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  title?: string;
  durationMs: number;
}

export interface ToastOptions {
  title?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string, opts?: ToastOptions) => string;
  success: (message: string, opts?: ToastOptions) => string;
  error: (message: string, opts?: ToastOptions) => string;
  info: (message: string, opts?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string, opts: ToastOptions = {}) => {
      idRef.current += 1;
      const id = `t${idRef.current}`;
      const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
      setToasts((prev) => [
        ...prev,
        { id, kind, message, title: opts.title, durationMs },
      ]);
      return id;
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, opts) => toast("success", message, opts),
      error: (message, opts) => toast("error", message, opts),
      info: (message, opts) => toast("info", message, opts),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}

const KIND_STYLES: Record<
  ToastKind,
  { border: string; icon: ReactNode; iconWrap: string; role: "status" | "alert" }
> = {
  success: {
    border: "border-l-4 border-l-emerald-500",
    icon: <CheckCircle2 size={18} />,
    iconWrap: "text-emerald-600",
    role: "status",
  },
  error: {
    border: "border-l-4 border-l-accent",
    icon: <AlertCircle size={18} />,
    iconWrap: "text-accent-hover",
    role: "alert",
  },
  info: {
    border: "border-l-4 border-l-ink",
    icon: <Info size={18} />,
    iconWrap: "text-ink",
    role: "status",
  },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  const style = KIND_STYLES[toast.kind];

  return (
    <div
      role={style.role}
      data-testid={`toast-${toast.kind}`}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded bg-paper p-3 pr-2 shadow-pop",
        style.border,
      )}
    >
      <span aria-hidden="true" className={cn("mt-0.5 shrink-0", style.iconWrap)}>
        {style.icon}
      </span>
      <div className="flex-1 text-sm">
        {toast.title ? (
          <p className="font-semibold text-ink">{toast.title}</p>
        ) : null}
        <p className="text-ink-mid">{toast.message}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(toast.id)}
        className="rounded p-1 text-ink-muted hover:bg-paper-mid hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}
