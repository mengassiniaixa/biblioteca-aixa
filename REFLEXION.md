# Reflexión — biblioteca-aixa

Notas sobre las decisiones de diseño, qué quedó fuera de alcance y qué haría distinto en una segunda iteración.

> **Nomenclatura:** en la consigna oficial la Etapa 1 agrupa dominio + backend HTTP, la Etapa 2 es el frontend con Visual TDD, y la Etapa 3 es docker-compose. Las dos primeras secciones acá cubren la Etapa 1 (dominio y backend por separado, porque son decisiones distintas); la tercera cubre la Etapa 2.

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

## Etapa 1 — Backend HTTP

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

## Etapa 2 — Frontend

### Stack y estructura

- **Vite + React + TypeScript** con Storybook 8, Vitest, Testing Library, Tailwind v3, react-router v6 y TanStack Query v5. Vite sobre CRA por velocidad de arranque; Vitest sobre Jest porque comparte pipeline con Vite y evita duplicar config.
- **Capas dentro de `apps/frontend/src/`**: `api/` (client con `fetch` + endpoints tipados + `ApiError`), `auth/` (`AuthContext` con JWT en localStorage), `hooks/` (queries y mutations con TanStack Query), `components/` (presentacionales con tests + stories), `routes/` (páginas + router + `ProtectedRoute`).
- **Presentacional vs. contenedor**: los componentes en `components/` reciben `data` y callbacks por props y no saben de red; las páginas en `routes/pages/` conectan los hooks, resuelven errores y disparan mutations. Esto hace que las stories sean triviales (sólo props) y los tests unitarios no necesiten mockear la red.

### Visual TDD

Cada componente presentacional tiene stories cubriendo sus estados relevantes (vacío, con datos, cargando, con error, con acciones habilitadas por rol). En la práctica el flow fue: pensar los estados → escribir stories → escribir tests con Testing Library sobre esos mismos casos → implementar el componente. Storybook queda como documentación viva y como "safety net" visual para cambios de estilos.

### Auth y guards

- JWT persistido en `localStorage`; `AuthContext` lo decodifica a `{ userId, role }` en cada mount.
- El contexto expone `api` (con token auto-inyectado en cada request), `login`, `logout`, `user` e `isAuthenticated`. Los componentes no manipulan tokens.
- `ProtectedRoute` soporta un prop `roles?: Role[]`. Sin roles: sólo pide sesión. Con roles: además verifica que el rol coincida y si no redirige a `/`. Esto se usa para `/overdue` (LIBRARIAN/ADMIN).
- La página `/register` hace un auto-login post-signup con las mismas credenciales y redirige a `/books`. Alternativa considerada (redirigir a `/login`) descartada por UX: `RegisterResponse` no incluye token, así que el auto-login es una segunda request explícita.

### Estado del servidor con TanStack Query

- TanStack Query como *single source of truth* para todo lo remoto. Cada hook expone una query y las mutations invalidan las query keys relacionadas en `onSuccess`.
- **`enabled` opcional en los hooks `useMyLoans` / `useMyReservations` / `useOverdueLoans`**: se pasa `false` cuando el rol no corresponde para evitar fetches innecesarios. Además evita ordenar respuestas mock en tests que no ejercen esos flows.

### Acciones contextuales en `BookList`

En vez de renderizar un menú fijo por libro, `BookList` recibe `myLoans`, `myReservations` y `canMember`, y una función interna `resolveMemberAction(book)` decide qué CTA mostrar: Prestar / Reservar / Devolver / Cancelar reserva. Esto mantiene el componente presentacional (no llama la red) y encapsula toda la lógica de "qué puedo hacer con este libro" en un solo lugar.

### CORS

El backend no exponía CORS al principio de la etapa (no era necesario para los tests de dominio ni la Postman). Al empezar a fetchear desde el browser hubo que agregar un middleware manual (sin librería `cors`) que permite el origen `CORS_ORIGIN` (default `http://localhost:5173`) y responde `OPTIONS` con 204. La decisión de no traer `cors` es consistente con no traer helpers para lo que se puede escribir en 10 líneas. En Etapa 3 (docker-compose) es probable que esto pueda simplificarse si backend y frontend quedan detrás del mismo host.

### Testing

- **59 tests / 14 archivos** con Vitest + Testing Library. Cubre componentes presentacionales (unit, sin red) y páginas (integración con `fetch` mockeado).
- Storybook queda como manual de estados visuales; no se corren como tests automáticos pero permiten inspeccionar cada componente aislado.
- **Gotcha con Vitest 2.1:** `toHaveBeenCalledExactlyOnceWith` no existe en esta versión. La combinación `toHaveBeenCalledTimes(1) + toHaveBeenCalledWith(...)` cumple el mismo rol.

### Seed de demo para overdue

`GET /loans/overdue` sólo devuelve algo cuando existen préstamos con `dueDate < today && status === "ACTIVE"`. Como el use-case `LoanBook` calcula el `dueDate` a partir de `clock.now()`, es imposible generar un préstamo vencido "en runtime" sin manipular el clock. Se agregó un `seedDemoOverdue()` detrás de la env var `SEED_DEMO_OVERDUE=true` que crea un MEMBER (`demo-overdue@biblioteca.local`) y un loan de Dune con `dueDate` hace 15 días. Es idempotente y explícitamente dev-only.

### Scope consciente fuera de alcance

- **No hay página `/my-library` dedicada.** Las acciones MEMBER (Prestar / Reservar / Devolver / Cancelar) se ejecutan contextualmente desde `/books` por libro. Preferí no duplicar navegación con una tabla adicional para lo mismo.
- **Sin toasts / sistema de notificaciones.** Los errores de mutations se muestran con `window.alert`. Es feo pero explícito y no requiere una librería más.
- **Sin tests E2E reales**. Los tests de páginas mockean `fetch`; no hay Playwright/Cypress. La verificación E2E fue manual (browser + backend real) al final de cada hito.

## Qué haría distinto en una segunda iteración

1. **Fakes compartidos para tests** — `domain/src/__test-utils__/` con builders (`aUser().withRole("LIBRARIAN").build()`) y fakes canónicos, en lugar de duplicar `__fakes__/` por carpeta.
2. **Explicit output DTOs** — los use-cases hoy devuelven objetos "planos" armados a mano dentro del `execute`. Podría formalizarse con mappers dedicados para que el shape del output esté claro y sea consistente.
3. **Un adapter Postgres real** — el dominio ya está listo para recibirlo (los puertos existen), solo falta el driver. Con TypeORM/Prisma o SQL a mano.
4. **Tests de integración del backend** — hoy solo hay tests del dominio. Un `supertest` sobre `buildApp()` con el container real (in-memory) cubriría el mapeo HTTP → use-case → error.
5. **Logging estructurado y correlación de request-id** — hoy el server hace `console.log` mínimo. Un pino/winston con request-id ayudaría a debug en un despliegue real.
6. **Rate limiting y helmet** — no incluidos porque no eran parte del scope, pero son la primera capa que agregaría antes de exponer esto a Internet.
7. **Cerrar `Fine` / `PayFine`** si el negocio lo pidiera. Hoy la entidad está huérfana.
8. **Optimistic updates en mutations** — hoy `useLoanBook`, `useReserveBook`, etc. esperan la respuesta del server para invalidar y disparar el refetch. Con optimistic updates la UI reflejaría el cambio al instante y revertiría en `onError`. Vale la pena cuando la latencia sea real (Postgres remoto, no in-memory).
9. **Toasts en vez de `window.alert`** para errores de mutations. Un `Toaster` global (por ejemplo `sonner` o el propio de shadcn/ui) sacaría los `alert()` sincrónicos que rompen el flow.
10. **Tests E2E con Playwright** — los tests de páginas hoy mockean `fetch`, cubren el mapeo props↔UI pero no el flow real browser→backend. Playwright contra el backend real (in-memory) sería el complemento natural.
11. **Página `/my-library` para el MEMBER** si el volumen de préstamos/reservas crece. Hoy las acciones contextuales por libro alcanzan pero no dan una vista consolidada de "lo que tengo".
