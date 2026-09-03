import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider, useConfirm } from "./ConfirmDialog";

function Harness({
  onResult,
}: {
  onResult: (r: boolean) => void;
}) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        const r = await confirm({
          title: "Eliminar libro",
          description: "Esta acción no se puede deshacer.",
          confirmLabel: "Eliminar",
          tone: "danger",
        });
        onResult(r);
      }}
    >
      pedir
    </button>
  );
}

function setup() {
  const results: boolean[] = [];
  const user = userEvent.setup();
  render(
    <ConfirmProvider>
      <Harness onResult={(r) => results.push(r)} />
    </ConfirmProvider>,
  );
  return { user, results };
}

describe("ConfirmProvider + useConfirm", () => {
  it("resuelve true al confirmar", async () => {
    const { user, results } = setup();
    await user.click(screen.getByRole("button", { name: "pedir" }));

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Eliminar libro");
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(results).toEqual([true]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resuelve false al cancelar", async () => {
    const { user, results } = setup();
    await user.click(screen.getByRole("button", { name: "pedir" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(results).toEqual([false]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resuelve false al presionar Escape", async () => {
    const { user, results } = setup();
    await user.click(screen.getByRole("button", { name: "pedir" }));
    await user.keyboard("{Escape}");

    expect(results).toEqual([false]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
