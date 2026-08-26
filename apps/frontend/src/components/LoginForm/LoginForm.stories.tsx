import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { LoginForm } from "./LoginForm";

const meta = {
  title: "Components/LoginForm",
  component: LoginForm,
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof LoginForm>;

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
    errorMessage: "Credenciales inválidas",
  },
};
