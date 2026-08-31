-- Esquema inicial biblioteca-aixa
-- Los IDs son UUIDs generados por el dominio (crypto.randomUUID), se persisten como TEXT
-- para no depender de la extension pgcrypto.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('MEMBER', 'LIBRARIAN', 'ADMIN')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id               TEXT PRIMARY KEY,
  isbn             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  author           TEXT NOT NULL,
  category         TEXT NOT NULL,
  total_copies     INTEGER NOT NULL CHECK (total_copies > 0),
  available_copies INTEGER NOT NULL CHECK (available_copies >= 0),
  CHECK (available_copies <= total_copies)
);

CREATE INDEX IF NOT EXISTS books_title_lower_idx    ON books (LOWER(title));
CREATE INDEX IF NOT EXISTS books_author_lower_idx   ON books (LOWER(author));
CREATE INDEX IF NOT EXISTS books_category_lower_idx ON books (LOWER(category));

CREATE TABLE IF NOT EXISTS loans (
  id          TEXT PRIMARY KEY,
  book_id     TEXT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  loan_date   TIMESTAMPTZ NOT NULL,
  due_date    TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status      TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE'))
);

CREATE INDEX IF NOT EXISTS loans_user_status_idx ON loans (user_id, status);
CREATE INDEX IF NOT EXISTS loans_book_status_idx ON loans (book_id, status);
CREATE INDEX IF NOT EXISTS loans_due_date_idx    ON loans (due_date);

CREATE TABLE IF NOT EXISTS reservations (
  id               TEXT PRIMARY KEY,
  book_id          TEXT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reservation_date TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('PENDING', 'AVAILABLE', 'FULFILLED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS reservations_user_status_idx ON reservations (user_id, status);
CREATE INDEX IF NOT EXISTS reservations_book_status_idx ON reservations (book_id, status);
