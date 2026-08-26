import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BookList } from "./BookList";
import type { Book } from "../../api/types";

const sample: Book[] = [
  {
    id: "b1",
    isbn: "978-1",
    title: "Dune",
    author: "Frank Herbert",
    category: "SciFi",
    totalCopies: 3,
    availableCopies: 2,
  },
  {
    id: "b2",
    isbn: "978-2",
    title: "El Hobbit",
    author: "J.R.R. Tolkien",
    category: "Fantasía",
    totalCopies: 1,
    availableCopies: 0,
  },
];

const meta = {
  title: "Components/BookList",
  component: BookList,
} satisfies Meta<typeof BookList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { books: sample },
};

export const Vacio: Story = {
  args: { books: [] },
};

export const ConAccionesDeLibrarian: Story = {
  args: {
    books: sample,
    canManage: true,
    onEdit: fn(),
    onDelete: fn(),
  },
};
