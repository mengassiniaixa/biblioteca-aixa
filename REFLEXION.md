# Reflexión — biblioteca-aixa

Notas sobre las decisiones de diseño, qué quedó fuera de alcance y qué haría distinto en una segunda iteración.

## Etapa 1 — Dominio

### Enfoque

Clean / Hexagonal Architecture aplicada de forma estricta en `domain/`:

- **Entidades con constructor privado + factories** `create` / `reconstitute`. Esto separa la creación *de nuevo* (con invariantes validadas: ISBN, email) de la reconstitución desde persistencia (donde los datos ya vienen validados). Evita que un mapper accidental viole invariantes.
- **Value objects** solo para lo que tiene reglas de formato: `Email` (regex) e `ISBN` (checksum 10 y 13). No hice VO para `Role` — es un tipo unión de tres strings sin validación de formato, envolverlo sería sobre-ingeniería.
- **Repositorios como puertos** en `domain/src/repositories/`. La implementación es problema del adaptador (in-memory ahora, Postgres eventualmente). El dominio nunca importa infraestructura.
- **Services como puertos** para todo lo no-determinístico (`Clock`) o técnico (`PasswordHasher`, `TokenService`). Los use-cases reciben la abstracción, los tests inyectan fakes.
- **Errores como jerarquía** con `DomainError` base. Esto le da al backend un solo lugar donde mapear a HTTP status codes (`errorHandler.ts`) por tipo.

### Testing

18 suites / 107 tests con Jest + ts-jest. Coverage global ~90% stmts / 92% lines, use-cases 100%.

Cada carpeta de use-case tiene su propio `__fakes__/` con las implementaciones in-memory que necesita. **Sí, hay duplicación**: `InMemoryBookRepository` aparece en varias carpetas. La decisión fue consciente — mantener cada carpeta autocontenida y evitar que los tests se acoplaran a fakes compartidos que fueran cambiando con el tiempo. En una segunda iteración probaría un `test-utils/` (o `__test-utils__/`) compartido con builders y fakes canónicos, aceptando el acoplamiento controlado a cambio de menos duplicación.

### Scope consciente fuera de alcance

- **`Fine` / `PayFine`**: la entidad `Fine` existe pero no hay `FineRepository` ni use-case `PayFine`. La consigna no pedía multas — fue iniciativa propia que decidí no cerrar para priorizar el backend. Queda documentado como *scope explícito*, no como algo olvidado.
- **`Loan.status === "OVERDUE"`**: no se persiste. Un préstamo está vencido si `dueDate < today && status === "ACTIVE"`. `Loan.isOverdue(today)` alcanza y evita tener que correr un cron que "mueva" préstamos a OVERDUE.
- **`Role` como tipo unión**, no como VO. Sin formato que validar más allá del enum.

## Etapa 2 — Backend

### Enfoque

- **Express** sobre NestJS. Más simple de justificar en el scope del proyecto y de configurar. Nest habría sido overkill dado que el dominio ya resuelve inyección de dependencias.
- **Yarn workspaces** con `domain` + `apps/*`. El backend importa `@mi-proyecto/domain` directamente desde `src/` (`domain/package.json` apunta `main` a `src/index.ts`) para no necesitar un build previo cuando se corre con `tsx watch`.
- **Layered dentro del backend**: `http/` (routers zod), `middleware/` (auth + errorHandler), `infra/` (repositorios y servicios), `composition/` (container que arma todo), `config.ts` (env). La composición se hace en un solo lugar y el resto del código no conoce cómo se inyectan las dependencias.
- **Repositorios in-memory consolidados** en `apps/backend/src/infra/repositories/`. Estas son las implementaciones "reales" para esta etapa; los `__fakes__/` del dominio se dejan intactos para tests. Postgres queda para una eventual Etapa 3.
- **Zod para validación HTTP**. El schema del router y el input del use-case están cerca pero no acoplados — el schema traduce del "borde exterior" (JSON crudo) al DTO tipado que el use-case espera.
- **Auth JWT** con `bcryptjs` para hashing. El middleware `authenticate` verifica el token y adjunta `{ userId, role }` al request. La autorización por rol vive en los use-cases (`isLibrarianOrAdmin()`), no en el middleware — el middleware solo autentica.

### Mapeo de errores a HTTP

Un `errorHandler` centralizado en `apps/backend/src/middleware/errorHandler.ts` mapea:

- `InvalidCredentialsError` → 401 (login fallido, token faltante o inválido)
- `UnauthorizedError` → 403 (rol insuficiente)
- `*NotFoundError` → 404
- `EmailAlreadyInUse`, `BookAlreadyLoaned`, `LoanLimitExceeded`, etc. → 409
- `DomainError` genérico → 400
- `ZodError` → 400 con `details[]`

La separación 401 / 403 es explícita: 401 = "no sé quién sos", 403 = "sé quién sos pero no podés hacer esto". El primer draft del middleware devolvía 403 en token faltante — se corrigió.

### Seed inicial

`RegisterUser` fuerza `role: "MEMBER"` por diseño (endpoint público). Para poder probar endpoints protegidos por rol sin una migración de base de datos, el container siembra una LIBRARIAN al arrancar (`SEED_LIBRARIAN_*`). Es explícitamente un mecanismo de desarrollo/demo.

## Qué haría distinto en una segunda iteración

1. **Fakes compartidos para tests** — `domain/src/__test-utils__/` con builders (`aUser().withRole("LIBRARIAN").build()`) y fakes canónicos, en lugar de duplicar `__fakes__/` por carpeta.
2. **Explicit output DTOs** — los use-cases hoy devuelven objetos "planos" armados a mano dentro del `execute`. Podría formalizarse con mappers dedicados para que el shape del output esté claro y sea consistente.
3. **Un adapter Postgres real** — el dominio ya está listo para recibirlo (los puertos existen), solo falta el driver. Con TypeORM/Prisma o SQL a mano.
4. **Tests de integración del backend** — hoy solo hay tests del dominio. Un `supertest` sobre `buildApp()` con el container real (in-memory) cubriría el mapeo HTTP → use-case → error.
5. **Logging estructurado y correlación de request-id** — hoy el server hace `console.log` mínimo. Un pino/winston con request-id ayudaría a debug en un despliegue real.
6. **Rate limiting y helmet** — no incluidos porque no eran parte del scope, pero son la primera capa que agregaría antes de exponer esto a Internet.
7. **Cerrar `Fine` / `PayFine`** si el negocio lo pidiera. Hoy la entidad está huérfana.
