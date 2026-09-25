import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div>
          <CardTitle>Préstamos activos</CardTitle>
          <CardDescription>2 libros en tu poder ahora mismo.</CardDescription>
        </div>
      </CardHeader>
      <p className="text-sm text-ink-mid">
        El próximo vencimiento es en 5 días. Recordá devolverlo a tiempo para evitar sanciones.
      </p>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card interactive className="max-w-md cursor-pointer">
      <CardHeader>
        <CardTitle>Explorar libros</CardTitle>
      </CardHeader>
      <CardDescription>
        Buscá por título, autor o categoría. Hover para ver el efecto interactivo.
      </CardDescription>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Nuevo libro</CardTitle>
        <Button size="sm" variant="ghost" iconRight={<ArrowRight size={14} />}>
          Ver form
        </Button>
      </CardHeader>
      <CardDescription>
        Solo bibliotecarixs pueden dar de alta libros nuevos al catálogo.
      </CardDescription>
    </Card>
  ),
};

export const NoPadding: Story = {
  render: () => (
    <Card padded={false} className="max-w-md overflow-hidden">
      <div className="border-b border-paper-edge bg-paper-mid px-5 py-3">
        <CardTitle>Header sin padding externo</CardTitle>
      </div>
      <div className="p-5 text-sm text-ink-mid">
        Útil cuando el contenido necesita bordes hasta el filo (tablas, listados densos).
      </div>
    </Card>
  ),
};
