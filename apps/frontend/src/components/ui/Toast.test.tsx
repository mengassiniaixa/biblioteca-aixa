import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./Toast";

function Trigger({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useToast>) => void;
}) {
  const api = useToast();
  onReady(api);
  return null;
}

function renderWithProvider() {
  let api: ReturnType<typeof useToast> | null = null;
  render(
    <ToastProvider>
      <Trigger onReady={(a) => (api = a)} />
    </ToastProvider>,
  );
  if (!api) throw new Error("useToast no se inicializó");
  return api as ReturnType<typeof useToast>;
}

describe("ToastProvider + useToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra un toast success con role=status", () => {
    const toast = renderWithProvider();
    act(() => {
      toast.success("Guardado");
    });
    const el = screen.getByTestId("toast-success");
    expect(el).toHaveAttribute("role", "status");
    expect(el).toHaveTextContent("Guardado");
  });

  it("muestra un toast error con role=alert y titulo", () => {
    const toast = renderWithProvider();
    act(() => {
      toast.error("Ups", { title: "Falló" });
    });
    const el = screen.getByTestId("toast-error");
    expect(el).toHaveAttribute("role", "alert");
    expect(el).toHaveTextContent("Falló");
    expect(el).toHaveTextContent("Ups");
  });

  it("auto-descarta luego de durationMs", () => {
    vi.useFakeTimers();
    const toast = renderWithProvider();
    act(() => {
      toast.info("hola", { durationMs: 1000 });
    });
    expect(screen.getByTestId("toast-info")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByTestId("toast-info")).not.toBeInTheDocument();
  });

  it("se descarta manualmente con el botón cerrar", async () => {
    const user = userEvent.setup();
    const toast = renderWithProvider();
    act(() => {
      toast.info("hola", { durationMs: 0 });
    });
    expect(screen.getByTestId("toast-info")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(screen.queryByTestId("toast-info")).not.toBeInTheDocument();
  });

  it("apila multiples toasts", () => {
    const toast = renderWithProvider();
    act(() => {
      toast.success("uno", { durationMs: 0 });
      toast.error("dos", { durationMs: 0 });
    });
    expect(screen.getByTestId("toast-success")).toBeInTheDocument();
    expect(screen.getByTestId("toast-error")).toBeInTheDocument();
  });
});
