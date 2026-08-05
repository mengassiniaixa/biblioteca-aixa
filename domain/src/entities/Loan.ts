import { randomUUID } from "crypto";

export type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

interface LoanProps {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: LoanStatus;
}

export class Loan {
  private constructor(private props: LoanProps) {}

  static create(input: {
    bookId: string;
    userId: string;
    loanDate: Date;
    dueDate: Date;
  }): Loan {
    if (input.dueDate <= input.loanDate) {
      throw new Error("dueDate must be after loanDate");
    }

    return new Loan({
      id: randomUUID(),
      ...input,
      status: "ACTIVE",
    });
  }

  static reconstitute(props: LoanProps): Loan {
    return new Loan(props);
  }

  get id() {
    return this.props.id;
  }
  get bookId() {
    return this.props.bookId;
  }
  get userId() {
    return this.props.userId;
  }
  get loanDate() {
    return this.props.loanDate;
  }
  get dueDate() {
    return this.props.dueDate;
  }
  get returnDate() {
    return this.props.returnDate;
  }
  get status() {
    return this.props.status;
  }

  isOverdue(today: Date): boolean {
    return this.props.status === "ACTIVE" && today > this.props.dueDate;
  }

  markAsReturned(returnDate: Date): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Loan already returned");
    }
    this.props.returnDate = returnDate;
    this.props.status = "RETURNED";
  }
}
