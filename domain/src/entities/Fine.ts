import { randomUUID } from "crypto";

interface FineProps {
  id: string;
  loanId: string;
  userId: string;
  amount: number;
  paid: boolean;
  createdAt: Date;
}

export class Fine {
  private constructor(private props: FineProps) {}

  static create(input: {
    loanId: string;
    userId: string;
    amount: number;
  }): Fine {
    if (input.amount <= 0) throw new Error("Fine amount must be > 0");

    return new Fine({
      id: randomUUID(),
      ...input,
      paid: false,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: FineProps): Fine {
    return new Fine(props);
  }

  get id() {
    return this.props.id;
  }
  get loanId() {
    return this.props.loanId;
  }
  get userId() {
    return this.props.userId;
  }
  get amount() {
    return this.props.amount;
  }
  get paid() {
    return this.props.paid;
  }

  markAsPaid(): void {
    if (this.props.paid) throw new Error("Fine already paid");
    this.props.paid = true;
  }
}
