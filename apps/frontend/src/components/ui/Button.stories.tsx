import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Guardar cambios",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancelar" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Eliminar", iconLeft: <Trash2 size={14} /> },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="primary">Small</Button>
      <Button size="md" variant="primary">Medium</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    variant: "primary",
    iconLeft: <Plus size={16} />,
    children: "Nuevo libro",
  },
};

export const Loading: Story = {
  args: { variant: "primary", isLoading: true, children: "Enviando…" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};
