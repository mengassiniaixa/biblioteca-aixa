import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, TableSkeleton } from "./Skeleton";

const meta: Meta = {
  title: "UI/Skeleton",
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

export const SingleLine: Story = {
  render: () => (
    <div className="max-w-md">
      <Skeleton />
    </div>
  ),
};

export const ParagraphLike: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};

export const TableDefault: Story = {
  render: () => (
    <div className="max-w-3xl">
      <TableSkeleton />
    </div>
  ),
};

export const TableCustom: Story = {
  render: () => (
    <div className="max-w-3xl">
      <TableSkeleton rows={6} columns={3} ariaLabel="Cargando préstamos vencidos…" />
    </div>
  ),
};
