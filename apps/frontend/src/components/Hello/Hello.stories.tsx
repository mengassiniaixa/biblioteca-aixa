import type { Meta, StoryObj } from "@storybook/react";
import { Hello } from "./Hello";

const meta = {
  title: "Components/Hello",
  component: Hello,
  args: {
    name: "biblioteca-aixa",
  },
} satisfies Meta<typeof Hello>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OtroNombre: Story = {
  args: {
    name: "Aixa",
  },
};
