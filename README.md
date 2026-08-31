# biblioteca-aixa

Sistema de gestión de biblioteca. Monorepo TypeScript con la capa de dominio separada del backend HTTP, siguiendo Clean / Hexagonal Architecture.

## Estructura

```
biblioteca-aixa/
├── apps/
│   ├── backend/       # API Express (auth JWT + CRUD, in-memory o Postgres)
│   │   ├── migrations/  # SQL numeradas, corren al arrancar en modo pg
│   │   └── postman/     # colección Postman con todos los endpoints
│   └── frontend/      # SPA React + Vite + Tailwind + TanStack Query
└── domain/            # lógica de negocio pura (TypeScript, sin frameworks)
    └── src/
        ├── entities/         # Book, User, Loan, Reservation, Fine
        ├── value-objects/    # Email, ISBN
        ├── repositories/     # interfaces (puertos)
        ├── services/         # Clock, PasswordHasher, TokenService (puertos)
        ├── use-cases/        # auth, books, loans, reservations
        └── errors/           # jerarquía basada en DomainError
```

`docker-compose.yml` (raíz) levanta el stack completo con Postgres. Ver [Docker Compose (Etapa 3)](#docker-compose-etapa-3).

`apps/backend` depende de `@mi-proyecto/domain` como workspace de yarn.

## Requisitos

- Node.js 20+
- Yarn (el proyecto usa Yarn workspaces, no npm)

## Setup

```bash
yarn install
cp apps/backend/.env.example apps/backend/.env
```

## Scripts (desde el root)

- `yarn test` — corre los tests del dominio (Jest)
- `yarn test:coverage` — reporte de cobertura del dominio
- `yarn typecheck` — `tsc --noEmit` en todos los workspaces
- `yarn backend:dev` — levanta el backend en modo watch (`tsx watch`)

## Backend

```bash
yarn backend:dev
# biblioteca-aixa backend escuchando en :3000
#   seed LIBRARIAN: librarian@biblioteca.local / librarian123
```

### Variables de entorno

Ver `apps/backend/.env.example`:

- `PORT` (default `3000`)
- `JWT_SECRET` (default `dev-only-secret`)
- `JWT_EXPIRES_IN` (default `1d`)
- `REPOSITORY_MODE` — `memory` (default) o `pg`. En `pg` requiere `DATABASE_URL`.
- `DATABASE_URL` — connection string Postgres (ej. `postgres://user:pass@host:5432/db`).
- `SEED_LIBRARIAN_NAME`, `SEED_LIBRARIAN_EMAIL`, `SEED_LIBRARIAN_PASSWORD` — usuaria LIBRARIAN creada al arrancar para poder probar endpoints protegidos sin migraciones.
- `SEED_DEMO_OVERDUE=true` — siembra un socio demo con un préstamo vencido (para probar la vista de LIBRARIAN).

### Endpoints

Todos los endpoints protegidos requieren `Authorization: Bearer <token>`.

| Método | Ruta | Autenticación | Rol |
|---|---|---|---|
| GET | `/health` | — | — |
| POST | `/auth/register` | — | crea MEMBER |
| POST | `/auth/login` | — | — |
| GET | `/books` | — | — |
| POST | `/books` | sí | LIBRARIAN / ADMIN |
| PUT | `/books/:id` | sí | LIBRARIAN / ADMIN |
| DELETE | `/books/:id` | sí | LIBRARIAN / ADMIN |
| POST | `/loans` | sí | MEMBER |
| POST | `/loans/:id/return` | sí | MEMBER |
| GET | `/loans/overdue` | sí | LIBRARIAN / ADMIN |
| POST | `/reservations` | sí | MEMBER |
| POST | `/reservations/:id/cancel` | sí | dueño de la reserva |

### Códigos de error

Definidos en `apps/backend/src/middleware/errorHandler.ts`:

- `400` — `ValidationError` (zod) o `DomainError` genérico
- `401` — `InvalidCredentialsError` (login fallido / token faltante o inválido)
- `403` — `UnauthorizedError` (rol insuficiente)
- `404` — `BookNotFound`, `UserNotFound`, `LoanNotFound`, `ReservationNotFound`
- `409` — conflictos de estado (email en uso, libro ya prestado, límite de préstamos, etc.)

### Persistencia

El backend soporta dos modos, elegidos con `REPOSITORY_MODE`:

- `memory` (default) — implementaciones in-memory en `apps/backend/src/infra/repositories/InMemory*Repository.ts`. Los datos se pierden al reiniciar. Útil para dev rápido sin dependencias externas.
- `pg` — adapters Postgres en `apps/backend/src/infra/repositories/Pg*Repository.ts`. Requiere `DATABASE_URL`. Al arrancar corre las migraciones pendientes de `apps/backend/migrations/` (runner casero, trackea en tabla `schema_migrations`).

## Docker Compose (Etapa 3)

Todo el stack (backend + frontend + Postgres) se levanta con:

```bash
cp .env.example .env    # opcional, tiene defaults razonables
docker compose up --build
```

Servicios expuestos:

| Servicio | Puerto host (default) | Notas |
|---|---|---|
| `db` | `5432` | Postgres 16, volumen `db-data` persiste entre reinicios |
| `backend` | `3000` | corre con `REPOSITORY_MODE=pg`, aplica migraciones al arrancar |
| `frontend` | `8080` | nginx sirviendo el build de Vite (SPA con fallback a `index.html`) |

Login inicial: `librarian@biblioteca.local / librarian123` (LIBRARIAN sembrado por el backend). Se puede pedir un socio demo con préstamo vencido pasando `SEED_DEMO_OVERDUE=true`.

Para levantar solo Postgres (útil para dev local del backend contra la DB real):

```bash
docker compose up -d db
REPOSITORY_MODE=pg DATABASE_URL=postgres://biblioteca:biblioteca@localhost:5432/biblioteca yarn backend:dev
```

## Probar la API

Importar `apps/backend/postman/biblioteca-aixa.postman_collection.json` en Postman o Insomnia. La colección auto-guarda tokens y IDs entre requests: correr en orden **Auth → Books → Loans → Reservations**.

## Dominio

Entidades con constructor privado y factories `create` / `reconstitute`. Los use-cases reciben repositorios y servicios como puertos (dependency injection) y se testean con fakes en memoria bajo `__fakes__/`.

Estado del dominio: **18 suites / 107 tests en verde**, coverage ~90% stmts / 92% lines. `Fine` y su use-case `PayFine` quedan fuera de alcance por decisión (ver [REFLEXION.md](./REFLEXION.md)).
