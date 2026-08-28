import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RegisterForm } from "./RegisterForm";

const meta = {
  title: "Components/RegisterForm",
  component: RegisterForm,
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Enviando: Story = {
  args: {
    isSubmitting: true,
  },
};

export const ConError: Story = {
  args: {
    errorMessage: "Ese email ya está registrado",
  },
};
