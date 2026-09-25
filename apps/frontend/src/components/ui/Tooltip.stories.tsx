import type { Meta, StoryObj } from "@storybook/react";
import { Info } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { Button } from "./Button";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const OnButton: Story = {
  name: "En un botón (top)",
  render: () => (
    <Tooltip content="Reservás cuando el libro no tiene copias disponibles. Al devolverse la primera, tu reserva se promueve automáticamente.">
      <Button variant="secondary">Reservar</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  name: "Placement bottom",
  render: () => (
    <Tooltip placement="bottom" content="Este texto aparece abajo del trigger.">
      <Button variant="ghost" iconLeft={<Info size={14} />}>
        Hover para ver
      </Button>
    </Tooltip>
  ),
};

export const OnIcon: Story = {
  name: "En un icono suelto",
  render: () => (
    <Tooltip content="Ícono informativo. Útil para explicar campos o estados sin saturar la UI.">
      <span tabIndex={0} className="inline-flex text-ink-muted focus:outline-none focus:text-ink">
        <Info size={18} />
      </span>
    </Tooltip>
  ),
};
