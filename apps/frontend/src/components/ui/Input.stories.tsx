import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Escribí algo…",
  },
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Basic: Story = {
  args: { label: "Nombre" },
};

export const WithHint: Story = {
  args: {
    label: "Email",
    type: "email",
    hint: "Usá el email con el que te registraste.",
    placeholder: "socio@biblioteca.local",
  },
};

export const WithError: Story = {
  args: {
    label: "ISBN",
    defaultValue: "978-invalido",
    error: "ISBN inválido. Ingresá 10 o 13 dígitos.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Categoría",
    defaultValue: "Novela",
    disabled: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    placeholder: "Buscar por título o autor…",
  },
};
