import { PasswordHasher } from "../../../services/PasswordHasher";

// Fake simple: no hashea de verdad, solo simula el contrato para tests.
export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`;
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainPassword}`;
  }
}
