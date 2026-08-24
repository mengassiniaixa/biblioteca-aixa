# biblioteca-aixa

Sistema de gestión de biblioteca. Monorepo TypeScript con la capa de dominio separada del backend HTTP, siguiendo Clean / Hexagonal Architecture.

## Estructura

```
biblioteca-aixa/
├── apps/
│   ├── backend/       # API Express (auth JWT + CRUD sobre repositorios in-memory)
│   │   └── postman/   # colección Postman con todos los endpoints
│   └── frontend/      # UI (pendiente)
└── domain/            # lógica de negocio pura (TypeScript, sin frameworks)
    └── src/
        ├── entities/         # Book, User, Loan, Reservation, Fine
        ├── value-objects/    # Email, ISBN
        ├── repositories/     # interfaces (puertos)
        ├── services/         # Clock, PasswordHasher, TokenService (puertos)
        ├── use-cases/        # auth, books, loans, reservations
        └── errors/           # jerarquía basada en DomainError
```

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
- `SEED_LIBRARIAN_NAME`, `SEED_LIBRARIAN_EMAIL`, `SEED_LIBRARIAN_PASSWORD` — usuaria LIBRARIAN creada al arrancar para poder probar endpoints protegidos sin migraciones.

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

El backend usa implementaciones **in-memory** de los repositorios (`apps/backend/src/infra/repositories/`). Los datos se pierden al reiniciar el server. Postgres queda para una eventual Etapa 3.

## Probar la API

Importar `apps/backend/postman/biblioteca-aixa.postman_collection.json` en Postman o Insomnia. La colección auto-guarda tokens y IDs entre requests: correr en orden **Auth → Books → Loans → Reservations**.

## Dominio

Entidades con constructor privado y factories `create` / `reconstitute`. Los use-cases reciben repositorios y servicios como puertos (dependency injection) y se testean con fakes en memoria bajo `__fakes__/`.

Estado del dominio: **18 suites / 107 tests en verde**, coverage ~90% stmts / 92% lines. `Fine` y su use-case `PayFine` quedan fuera de alcance por decisión (ver [REFLEXION.md](./REFLEXION.md)).
