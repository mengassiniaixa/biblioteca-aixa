import jwt, { SignOptions } from "jsonwebtoken";
import { TokenService } from "@mi-proyecto/domain";

interface JwtPayload {
  userId: string;
  role: string;
}

export class JwtTokenService implements TokenService {
  constructor(
    private secret: string,
    private expiresIn: string,
  ) {}

  generate(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: this.expiresIn as SignOptions["expiresIn"] };
    return jwt.sign(payload, this.secret, options);
  }

  verify(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }
    return {
      userId: String(decoded.userId),
      role: String(decoded.role),
    };
  }
}
