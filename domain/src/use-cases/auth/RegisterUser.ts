import { User, Role } from "../../entities/User";
import { UserRepository } from "../../repositories/UserRepository";
import { PasswordHasher } from "../../services/PasswordHasher";
import { EmailAlreadyInUseError } from "../../errors/EmailAlreadyInUseError";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

interface RegisterUserOutput {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export class RegisterUser {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
