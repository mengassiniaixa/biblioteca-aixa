import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BookSearchForm } from "./BookSearchForm";

const meta = {
  title: "Components/BookSearchForm",
  component: BookSearchForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof BookSearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConValoresIniciales: Story = {
  args: {
    initialValues: { title: "Dune", author: "Herbert" },
  },
};

export const Buscando: Story = {
  args: { isSearching: true },
};
