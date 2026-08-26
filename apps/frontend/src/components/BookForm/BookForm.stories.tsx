import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BookForm } from "./BookForm";

const meta = {
  title: "Components/BookForm",
  component: BookForm,
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof BookForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Crear: Story = {};

export const Editar: Story = {
  args: {
    mode: "edit",
    initialValues: {
      id: "b1",
      isbn: "978-1",
      title: "Dune",
      author: "Herbert",
      category: "SciFi",
      totalCopies: 3,
      availableCopies: 2,
    },
  },
};

export const ConError: Story = {
  args: {
    errorMessage: "El ISBN ya existe",
  },
};
