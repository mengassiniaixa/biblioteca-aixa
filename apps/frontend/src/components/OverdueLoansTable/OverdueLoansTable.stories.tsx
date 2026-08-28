import type { Meta, StoryObj } from "@storybook/react";
import { OverdueLoansTable } from "./OverdueLoansTable";
import type { OverdueLoan } from "../../api/types";

const sample: OverdueLoan[] = [
  {
    id: "loan-1",
    loanDate: "2026-01-01T00:00:00.000Z",
    dueDate: "2026-01-15T00:00:00.000Z",
    daysOverdue: 17,
    book: {
      id: "b1",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
    },
    member: {
      id: "u1",
      name: "Ana Pérez",
      email: "ana@test.com",
    },
  },
  {
    id: "loan-2",
    loanDate: "2026-01-05T00:00:00.000Z",
    dueDate: "2026-01-19T00:00:00.000Z",
    daysOverdue: 1,
    book: {
      id: "b2",
      title: "El Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "9780618968633",
    },
    member: {
      id: "u2",
      name: "Beto Gómez",
      email: "beto@test.com",
    },
  },
];

const meta = {
  title: "Components/OverdueLoansTable",
  component: OverdueLoansTable,
} satisfies Meta<typeof OverdueLoansTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConVencidos: Story = {
  args: {
    loans: sample,
  },
};

export const SinVencidos: Story = {
  args: {
    loans: [],
  },
};
