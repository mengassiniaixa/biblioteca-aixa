import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./Toast";
import { Button } from "./Button";

const meta: Meta = {
  title: "UI/Toast",
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function TriggerRow() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        onClick={() => toast.success("Libro guardado correctamente.")}
      >
        Disparar success
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toast.error("No pudimos guardar los cambios. Reintentá en unos segundos.", {
            title: "Error al guardar",
          })
        }
      >
        Disparar error
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info("Reserva promovida a préstamo activo.", {
            title: "Aviso",
          })
        }
      >
        Disparar info
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast.info("Este no se cierra solo. Cerralo con la X.", {
            durationMs: 0,
          })
        }
      >
        Persistente
      </Button>
    </div>
  );
}

export const Playground: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-mid">
        Los toasts aparecen abajo a la derecha. Auto-dismiss por default a los 4s.
      </p>
      <TriggerRow />
    </div>
  ),
};
