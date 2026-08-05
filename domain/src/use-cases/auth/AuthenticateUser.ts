import { UserRepository } from "../../repositories/UserRepository";
import { PasswordHasher } from "../../services/PasswordHasher";
import { TokenService } from "../../services/TokenService";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";

interface AuthenticateUserInput {
  email: string;
  password: string;
}

interface AuthenticateUserOutput {
  token: string;
}

export class AuthenticateUser {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokenService.generate({
      userId: user.id,
      role: user.role,
    });

    return { token };
  }
}
