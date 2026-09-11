import { BookRepository } from "../../repositories/BookRepository";
import { LoanRepository } from "../../repositories/LoanRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { Clock } from "../../services/Clock";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface GetLibraryStatsInput {
  actorId: string;
}

interface LibraryStatsOutput {
  totalBooks: number;
  activeLoans: number;
  overdueLoans: number;
  totalMembers: number;
}

export class GetLibraryStats {
  constructor(
    private bookRepository: BookRepository,
    private loanRepository: LoanRepository,
    private userRepository: UserRepository,
    private clock: Clock,
  ) {}

  async execute(input: GetLibraryStatsInput): Promise<LibraryStatsOutput> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }
    if (!actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("get library stats");
    }

    const today = this.clock.now();
    const [totalBooks, activeLoans, overdueLoans, totalMembers] =
      await Promise.all([
        this.bookRepository.count(),
        this.loanRepository.countActive(),
        this.loanRepository.findOverdue(today).then((loans) => loans.length),
        this.userRepository.countByRole("MEMBER"),
      ]);

    return { totalBooks, activeLoans, overdueLoans, totalMembers };
  }
}
