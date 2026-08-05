import { randomUUID } from "crypto";
import { ISBN } from "../value-objects/ISBN";

interface BookProps {
  id: string;
  isbn: ISBN;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export class Book {
  private constructor(private props: BookProps) {}

  static create(input: {
    isbn: string;
    title: string;
    author: string;
    category: string;
    totalCopies: number;
  }): Book {
    if (!input.title.trim()) throw new Error("Title is required");
    if (input.totalCopies <= 0) throw new Error("totalCopies must be > 0");

    return new Book({
      id: randomUUID(),
      isbn: ISBN.create(input.isbn),
      title: input.title,
      author: input.author,
      category: input.category,
      totalCopies: input.totalCopies,
      availableCopies: input.totalCopies,
    });
  }

  static reconstitute(props: BookProps): Book {
    return new Book(props);
  }

  get id() {
    return this.props.id;
  }
  get isbn() {
    return this.props.isbn.value;
  }
  get title() {
    return this.props.title;
  }
  get author() {
    return this.props.author;
  }
  get category() {
    return this.props.category;
  }
  get availableCopies() {
    return this.props.availableCopies;
  }
  get totalCopies() {
    return this.props.totalCopies;
  }

  hasAvailableCopies(): boolean {
    return this.props.availableCopies > 0;
  }

  decreaseAvailability(): void {
    if (!this.hasAvailableCopies()) {
      throw new Error("No available copies to loan");
    }
    this.props.availableCopies -= 1;
  }

  increaseAvailability(): void {
    if (this.props.availableCopies >= this.props.totalCopies) {
      throw new Error("Cannot exceed totalCopies");
    }
    this.props.availableCopies += 1;
  }

  updateDetails(input: {
    title?: string;
    author?: string;
    category?: string;
  }): void {
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new Error("Title is required");
      this.props.title = input.title;
    }
    if (input.author !== undefined) this.props.author = input.author;
    if (input.category !== undefined) this.props.category = input.category;
  }

  updateTotalCopies(newTotal: number): void {
    if (newTotal <= 0) throw new Error("totalCopies must be > 0");
    const loaned = this.props.totalCopies - this.props.availableCopies;
    if (newTotal < loaned) {
      throw new Error(
        `totalCopies cannot be less than currently loaned copies (${loaned})`,
      );
    }
    this.props.availableCopies = newTotal - loaned;
    this.props.totalCopies = newTotal;
  }

  hasLoansOut(): boolean {
    return this.props.availableCopies < this.props.totalCopies;
  }
}
