import type { Meta, StoryObj } from "@storybook/react";
import { BookCover } from "./BookCover";

const meta: Meta<typeof BookCover> = {
  title: "UI/BookCover",
  component: BookCover,
  args: {
    alt: "Portada de Dune",
    src: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
  },
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof BookCover>;

export const Small: Story = {
  args: { size: "sm" },
};

export const Medium: Story = {
  args: { size: "md" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Fallback: Story = {
  name: "Fallback (sin URL)",
  args: { size: "lg", src: null },
};

export const BrokenUrl: Story = {
  name: "Fallback (URL rota)",
  args: {
    size: "lg",
    src: "https://httpbin.org/status/404",
    alt: "Portada inexistente",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <BookCover size="sm" alt="Dune sm" src="https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg" />
      <BookCover size="md" alt="Dune md" src="https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg" />
      <BookCover size="lg" alt="Dune lg" src="https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg" />
    </div>
  ),
};
