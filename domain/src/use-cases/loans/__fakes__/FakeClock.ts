import { Clock } from "../../../services/Clock";

export class FakeClock implements Clock {
  constructor(private fixedDate: Date) {}

  now(): Date {
    return this.fixedDate;
  }

  setNow(date: Date): void {
    this.fixedDate = date;
  }
}
