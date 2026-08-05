import { randomUUID } from "crypto";
import { Email } from "../value-objects/Email";

export type Role = "MEMBER" | "LIBRARIAN" | "ADMIN";

interface UserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
  }): User {
    if (!input.name.trim()) throw new Error("Name is required");

    return new User({
      id: randomUUID(),
      name: input.name,
      email: Email.create(input.email),
      passwordHash: input.passwordHash,
      role: input.role ?? "MEMBER",
      createdAt: new Date(),
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email.value;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get role() {
    return this.props.role;
  }

  isLibrarianOrAdmin(): boolean {
    return this.props.role === "LIBRARIAN" || this.props.role === "ADMIN";
  }
}
