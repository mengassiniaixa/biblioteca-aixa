export class ISBN {
  private constructor(private readonly _value: string) {}

  static create(rawIsbn: string): ISBN {
    const cleaned = rawIsbn.replace(/-/g, "").trim();

    if (!/^\d{13}$/.test(cleaned)) {
      throw new Error("Invalid ISBN");
    }

    return new ISBN(cleaned);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ISBN): boolean {
    return this._value === other._value;
  }
}
