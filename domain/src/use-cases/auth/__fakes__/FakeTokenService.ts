import { TokenService } from "../../../services/TokenService";

// Fake simple: codifica el payload en base64, solo para tests.
export class FakeTokenService implements TokenService {
  generate(payload: { userId: string; role: string }): string {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  verify(token: string): { userId: string; role: string } {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  }
}
