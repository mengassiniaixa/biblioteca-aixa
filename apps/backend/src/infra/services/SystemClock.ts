import { Clock } from "@mi-proyecto/domain";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
