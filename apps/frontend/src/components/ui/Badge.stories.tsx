import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  args: { children: "Etiqueta" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="default">Default</Badge>
      <Badge tone="muted">Muted</Badge>
      <Badge tone="outline">Outline</Badge>
      <Badge tone="danger">Vencido</Badge>
      <Badge tone="success">Al día</Badge>
    </div>
  ),
};
