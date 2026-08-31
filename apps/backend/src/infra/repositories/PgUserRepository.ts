import { Email, User, UserRepository } from "@mi-proyecto/domain";
import type { Pool } from "pg";

interface Row {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "MEMBER" | "LIBRARIAN" | "ADMIN";
  created_at: Date;
}

function toEntity(row: Row): User {
  return User.reconstitute({
    id: row.id,
    name: row.name,
    email: Email.create(row.email),
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  });
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role`,
      [user.id, user.name, user.email, user.passwordHash, user.role],
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<Row>(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query<Row>(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1",
      [id],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }
}
