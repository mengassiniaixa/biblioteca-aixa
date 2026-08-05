# biblioteca-aixa

Sistema de gestión de biblioteca. Monorepo con la capa de dominio separada de las apps, siguiendo Clean / Hexagonal Architecture.

## Estructura

```
biblioteca-aixa/
├── apps/
│   ├── backend/    # API (en construcción)
│   └── frontend/   # UI (en construcción)
└── domain/         # lógica de negocio pura (TypeScript, sin frameworks)
    └── src/
        ├── entities/         # Book, User, Loan, Reservation, Fine
        ├── value-objects/    # Email, ISBN, Role
        ├── repositories/     # interfaces (puertos)
        ├── services/         # Clock, PasswordHasher, TokenService (puertos)
        ├── use-cases/        # auth, books, loans, reservations
        └── errors/           # jerarquía basada en DomainError
```

## Dominio

Entidades con constructor privado y factories `create` / `reconstitute`. Los use-cases reciben repositorios y servicios como puertos (dependency injection) y son testeables sin infraestructura mediante fakes en memoria.

## Requisitos

- Node.js 20+
- Yarn o npm

## Uso

Los tests del dominio corren con Jest + ts-jest:

```bash
cd domain
yarn install
yarn test
```

Otros comandos disponibles en `domain/`:

- `yarn build` — compila a `dist/`
- `yarn test:watch` — modo watch
- `yarn test:coverage` — reporte de cobertura

## Estado

- ✅ Dominio: entidades, value-objects, errores, use-cases principales (auth, books, loans, reservations)
- 🚧 `apps/backend`: pendiente (implementación de repositorios y adaptadores HTTP)
- 🚧 `apps/frontend`: pendiente
