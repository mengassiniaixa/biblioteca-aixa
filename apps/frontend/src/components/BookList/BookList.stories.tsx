import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BookList } from "./BookList";
import type { Book, Loan, Reservation } from "../../api/types";

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

const memberLoans: Loan[] = [
  {
    id: "loan-1",
    bookId: "b1",
    userId: "u1",
    loanDate: "2026-08-01T00:00:00.000Z",
    dueDate: "2026-08-15T00:00:00.000Z",
    status: "ACTIVE",
    book: { id: "b1", title: "Dune", author: "Frank Herbert", isbn: "978-1" },
  },
];

const memberReservations: Reservation[] = [
  {
    id: "res-1",
    bookId: "b2",
    userId: "u1",
    reservationDate: "2026-08-01T00:00:00.000Z",
    status: "PENDING",
    book: {
      id: "b2",
      title: "El Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-2",
    },
  },
];

export const ConAccionesDeMember: Story = {
  args: {
    books: sample,
    canMember: true,
    myLoans: memberLoans,
    myReservations: memberReservations,
    onLoan: fn(),
    onReturn: fn(),
    onReserve: fn(),
    onCancelReservation: fn(),
  },
};

export const ConAccionesDeMemberSinRelacion: Story = {
  args: {
    books: sample,
    canMember: true,
    myLoans: [],
    myReservations: [],
    onLoan: fn(),
    onReserve: fn(),
  },
};
