import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ConfirmProvider, useConfirm } from "./ConfirmDialog";
import { Button } from "./Button";

const meta: Meta = {
  title: "UI/ConfirmDialog",
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <ConfirmProvider>
        <Story />
      </ConfirmProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function DefaultDemo() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>("—");

  const handleClick = async () => {
    const ok = await confirm({
      title: "¿Devolver el libro?",
      description: "Marcaremos el préstamo como devuelto y liberaremos la copia.",
      confirmLabel: "Sí, devolver",
    });
    setResult(ok ? "Confirmado" : "Cancelado");
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={handleClick}>
        Abrir diálogo (default)
      </Button>
      <p className="text-sm text-ink-mid">
        Última respuesta: <span className="font-mono text-ink">{result}</span>
      </p>
    </div>
  );
}

function DangerDemo() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>("—");

  const handleClick = async () => {
    const ok = await confirm({
      title: "¿Eliminar el libro del catálogo?",
      description:
        "Esta acción no se puede deshacer. Si tiene préstamos o reservas activas se rechazará con error.",
      confirmLabel: "Eliminar",
      cancelLabel: "Volver",
      tone: "danger",
    });
    setResult(ok ? "Confirmado" : "Cancelado");
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="danger" onClick={handleClick}>
        Abrir diálogo (danger)
      </Button>
      <p className="text-sm text-ink-mid">
        Última respuesta: <span className="font-mono text-ink">{result}</span>
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultDemo />,
};

export const Danger: Story = {
  render: () => <DangerDemo />,
};
