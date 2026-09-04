# Reflexión — biblioteca-aixa

Notas sobre las decisiones de diseño, qué quedó fuera de alcance y qué haría distinto en una segunda iteración.

> **Nomenclatura:** en la consigna oficial la Etapa 1 agrupa dominio + backend HTTP, la Etapa 2 es el frontend con Visual TDD, y la Etapa 3 es docker-compose. Las dos primeras secciones acá cubren la Etapa 1 (dominio y backend por separado, porque son decisiones distintas), la tercera cubre la Etapa 2, la cuarta la Etapa 3, la quinta documenta un refactor visual posterior del frontend, y la sexta agrega una feature nueva (`/my-library` para MEMBER) posterior al refactor.

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

- **59 tests / 14 archivos** al cierre inicial de Etapa 2 con Vitest + Testing Library. Cubre componentes presentacionales (unit, sin red) y páginas (integración con `fetch` mockeado). El refactor visual posterior escaló esa cifra a 82 tests / 20 archivos sin tocar los tests existentes (ver sección de refactor).
- Storybook queda como manual de estados visuales; no se corren como tests automáticos pero permiten inspeccionar cada componente aislado.
- **Gotcha con Vitest 2.1:** `toHaveBeenCalledExactlyOnceWith` no existe en esta versión. La combinación `toHaveBeenCalledTimes(1) + toHaveBeenCalledWith(...)` cumple el mismo rol.

### Seed de demo para overdue

`GET /loans/overdue` sólo devuelve algo cuando existen préstamos con `dueDate < today && status === "ACTIVE"`. Como el use-case `LoanBook` calcula el `dueDate` a partir de `clock.now()`, es imposible generar un préstamo vencido "en runtime" sin manipular el clock. Se agregó un `seedDemoOverdue()` detrás de la env var `SEED_DEMO_OVERDUE=true` que crea un MEMBER (`demo-overdue@biblioteca.local`) y un loan de Dune con `dueDate` hace 15 días. Es idempotente y explícitamente dev-only.

### Scope consciente fuera de alcance

- **No hay página `/my-library` dedicada.** Las acciones MEMBER (Prestar / Reservar / Devolver / Cancelar) se ejecutan contextualmente desde `/books` por libro. Preferí no duplicar navegación con una tabla adicional para lo mismo.
- **Sin toasts / sistema de notificaciones al cierre inicial de la etapa.** Los errores de mutations se mostraban con `window.alert`. Feo pero explícito y sin librería nueva. *Cerrado después en el refactor visual (V4): sistema Toast + ConfirmDialog propio.*
- **Sin tests E2E reales**. Los tests de páginas mockean `fetch`; no hay Playwright/Cypress. La verificación E2E fue manual (browser + backend real) al final de cada hito.

## Etapa 3 — Docker & Postgres

### Postgres real, sin ORM

La consigna pedía docker-compose para backend + frontend + DB. Se podía interpretar "DB" en sentido laxo (mantener in-memory y cumplir la letra), pero eso hubiera sido tramposo con el espíritu del enunciado. Se optó por Postgres real, aprovechando que el dominio ya tenía los puertos definidos desde Etapa 1 — el cambio quedó contenido en `apps/backend/src/infra/repositories/Pg*Repository.ts` sin tocar una sola línea del dominio ni de los use-cases. Esa fue la prueba de que la arquitectura hexagonal valía la pena: agregar Postgres fue plumbing, no rediseño.

Sobre el cliente: se descartó Prisma y TypeORM por overkill para 4 tablas. El paquete `pg` directo alcanzó, con SQL a mano y `Row → entity` explícito en cada adapter. Ventajas: cero magia, control total del schema, sin capa de abstracción que oculte el costo de las queries. Desventaja obvia: hay que escribir upserts a mano y el mapeo de columnas snake_case → camelCase también. Para este scope el trade-off fue claramente favorable.

### Migraciones caseras

Se rechazó `node-pg-migrate` por el mismo motivo que se rechazó `cors` en Etapa 2: lo que se resuelve en 30 líneas de código explícito no justifica una dependencia. El runner en `apps/backend/src/infra/db/migrator.ts` es un loop simple: lee `.sql` en orden, revisa contra la tabla `schema_migrations`, aplica los faltantes en una transacción por archivo. No hay `down` migrations — para el ciclo de vida de este proyecto (o incluso de la mayoría de proyectos reales), *forward-only* con pequeñas migraciones aditivas es suficiente. Cuando algo falla en producción se escribe otra migración que corrige, no se hace rollback.

### Switch `REPOSITORY_MODE` — mantener los dos modos

Decisión importante: se mantuvo el modo `memory` como default en vez de eliminar los in-memory ahora que hay Postgres. Los `InMemory*Repository.ts` no son código muerto: son la vía rápida para dev local (`yarn backend:dev` sin docker), son los fakes canónicos para futuros tests de integración, y son un contraste conceptual útil (dos implementaciones concretas del mismo puerto). El costo de mantenerlos es cero — no hay lógica que se duplique, cada uno hace su implementación.

El switch vive en `container.ts::buildRepositories()`, una única función que decide qué familia armar. El resto del backend no cambia: sigue recibiendo `UserRepository`, `BookRepository`, etc. como interfaces.

### El truco del `domain/package.json` en el Dockerfile

Este fue el punto más incómodo del setup. `domain/package.json` tiene `main: "src/index.ts"` para que `tsx` en dev pueda importar el TypeScript raw sin build previo. Pero en runtime Docker se corre con `node dist/index.js` — node no sabe TypeScript y se rompe al intentar cargar `.../domain/src/index.ts`.

Alternativas evaluadas:
1. **Cambiar `main` permanentemente a `dist/index.js`** — habría obligado a correr `yarn workspace @mi-proyecto/domain build` antes de cada `yarn backend:dev`. Rompe la fricción cero del dev flow.
2. **Bundler tipo esbuild** — habría inlineado el dominio en el bundle del backend. Simple para prod, pero suma una dependencia de build y pierde el mapping 1:1 al source original.
3. **`tsx` en runtime** — la opción más simple, rechazada por peso de imagen y por no ser convención.
4. **Parchear `package.json` en el builder stage del Dockerfile** — la que ganó.

El parche vive en el stage `builder` como una línea de `node -e` que reescribe `main` y `types` a `dist/`. El runtime copia ese `package.json` parchado, no el original. Consecuencia: los dos flujos (`tsx` en dev, `node dist` en Docker) conviven sin fricción y sin cambios al workflow. Es feo pero está contenido en el Dockerfile y no contamina el repo.

### Frontend estático servido con nginx

El frontend es una SPA, así que la mejor unidad de despliegue es HTML+JS+CSS estático detrás de un servidor web. Se descartó `vite preview` (dev server) y también servir con node — nginx sirve archivos estáticos con menos memoria y mejor caching que cualquier alternativa Node. El único detalle específico del stack es el fallback SPA (`try_files $uri $uri/ /index.html`) para que react-router pueda resolver `/books`, `/overdue`, etc. cuando el usuario refresca la página. Sin ese fallback nginx respondería 404.

### `VITE_API_BASE_URL` como build arg, no runtime

Vite inlinea las variables `import.meta.env.VITE_*` en el bundle en tiempo de build — no las lee en runtime. Esto obliga a decidir la URL del backend al construir la imagen del frontend, no al arrancar el container. Para desarrollo con compose alcanza (`http://localhost:3000` como default). Para producción real (donde frontend y backend pueden vivir en dominios distintos) la solución correcta sería o (a) rebuild de la imagen por ambiente o (b) reverse proxy en nginx que redirija `/api/*` al backend interno — así el frontend usa rutas relativas y no necesita saber la URL. Por scope no se hizo, pero está bien identificado.

### El bug del port publish de Postgres

Al probar el compose la primera vez apareció un problema real: si el host tiene otro Postgres corriendo en `:5432`, el compose falla con `port is already allocated` o (peor) el container arranca sin network attachment y el backend rompe con `getaddrinfo ENOTFOUND db`. El fix: **no publicar el puerto de la DB al host por default**. El backend le pega a Postgres por la red interna del compose (hostname `db`), no vía localhost — no necesita el port mapping. La sección `ports:` de `db` quedó como bloque comentado, para descomentarla solo cuando se quiera conectar pgAdmin/psql desde el host.

Es una decisión pequeña pero interesante: el instinto es "expongo todo por si acaso", pero cada puerto publicado es una superficie de conflicto y (en producción) de ataque. El principio correcto es publicar solo lo que realmente se consume desde afuera.

### Scope consciente fuera de alcance

- **Sin migrations `down`.** Forward-only. Si algo se va a romper, se escribe otra migración.
- **Sin tests de integración contra Postgres real.** Los adapters PG hoy están cubiertos indirectamente por el smoke E2E manual del compose. Un `pg-mem` o un `testcontainers` con Postgres real serían el próximo paso natural.
- **Sin healthcheck HTTP en el backend.** Compose usa `depends_on: db healthy` para el orden de arranque, pero no chequea el `/health` del backend. Si el backend arranca en un estado degradado, compose no lo detecta.
- **Sin reverse proxy nginx**. Frontend y backend hablan directo (browser → `:3000`). Con proxy se podría exponer solo `:8080` con `/api/*` interno, cerrando el `:3000` al exterior y simplificando CORS. No se hizo por scope.
- **Sin gestión de secretos.** `JWT_SECRET` viene por env plana. Para producción real habría que integrar con un secret manager (Docker secrets, Vault, o el equivalente cloud).
- **Sin CI/CD.** No hay pipeline que corra `docker build` en push a `main`. Todo local.

## Refactor visual del frontend (post-Etapa 3)

### Motivación

Al cerrar Etapa 3 el frontend era funcional pero incompleto de identidad: colores slate genéricos, tipografía del sistema, `window.alert` / `window.confirm` para feedback de mutations, estados de carga con "Cargando…" plano, "biblioteca-aixa" (el nombre del repo) usado como si fuera el nombre del producto en la UI. Se dedicó un ciclo específico a pulir esto antes de considerar el proyecto entregable. La regla base: **NO tocar los tests**. Si un cambio visual forzaba re-escritura de tests, el cambio estaba mal.

Se estructuró en 6 hitos incrementales (V1..V6) más un rename final, cada uno commiteable de forma independiente.

### Sistema de diseño

- **Paleta B/N con acento rojo (#EF4444)**. Minimal (no compite con el contenido: libros, ISBNs, nombres) y con un único color acento reservado para acciones destructivas y estados de error/vencimiento. Los tokens en `tailwind.config.js` viven bajo nombres semánticos (`ink/paper/accent` con escalas `soft/mid/muted/faint/edge/hover/soft`) en vez de la escala neutral de Tailwind directa — el propósito del color queda explícito en el código.
- **Inter** como fuente sans, self-hosted vía `@fontsource/inter` (sin CDN externo). Elegida por su rendering fino en tamaños chicos (labels, hints).
- **lucide-react** para iconos. Tree-shakeable por icono (import por nombre), estética consistente, cero config.

### Primitivos en `components/ui/`

Se crearon primitivos con tests + stories antes de reemplazar los usos concretos:

- **Button** (`variant: primary | secondary | ghost | danger`, `size: sm | md | lg`, `isLoading`, `iconLeft/iconRight`). Expone `buttonClassName()` como helper para reusar el estilo en `<Link>` de react-router sin renderizar un `<button>`. `forwardRef` para permitir foco programático (lo usa `ConfirmDialog`).
- **Input** con `label`, `hint`, `error`, `aria-describedby` y `aria-invalid` automáticos. El label se pinta con `uppercase tracking-wide` como decisión de estilo, pero el texto en el DOM se mantiene igual al que se le pasa como prop — clave para que `getByLabelText(/email/i)` de los tests siga funcionando sin cambios.
- **Card** + `CardHeader/Title/Description`, con prop `interactive` para hover shadow.
- **Badge** (`default | muted | outline | danger | success`) para categoría, disponibilidad, rol en topbar y días vencido.
- **Skeleton** y **TableSkeleton** para estados de carga con `role="status"` + `aria-label`.
- **Toast** y **ConfirmDialog** como sistema propio (ver más abajo).

### AppShell + Topbar + rutas inmersivas

Las rutas se dividieron en dos grupos con layout distinto:

- **Con shell** (`/`, `/books`, `/overdue`, `*`): dentro de `AppShell` con `Topbar` sticky y container `max-w-6xl` centrado.
- **Sin shell** (`/login`, `/register`): experiencias inmersivas full-screen con hero de dos columnas (aside ink con texto de marca + section paper con el form).

La motivación de sacar login/register del shell es que la primera impresión del producto no debería estar enmarcada por la navegación interna — el usuario todavía no está adentro. El `Topbar` unifica logo, nav con `NavLink` activo, badge de rol y botón "Salir" (o "Ingresar" / "Crear cuenta" para anónimos): un único lugar donde vive el estado de sesión visible.

### Toasts y confirm dialogs propios (en vez de `sonner`)

Se descartó `sonner` / `react-hot-toast` y se implementó un sistema propio:

- **`ToastProvider` + `useToast()`** en `components/ui/Toast.tsx`. Context con `success/error/info`, auto-dismiss configurable (default 4s), cierre manual, viewport fixed bottom-right con `aria-live="polite"`. Cada toast usa el `role` correcto según kind (`status` para success/info, `alert` para error).
- **`ConfirmProvider` + `useConfirm()`** basado en promesa: `const ok = await confirm({ title, description, tone, confirmLabel, cancelLabel })`. El diálogo maneja foco inicial en confirmar (Enter directo), Escape cancela, overlay clickeable cancela.

Justificación de no traer una lib: son ~200 líneas entre los dos, cero dependencias, control total del look y de los roles ARIA. Consistente con la decisión de no traer `cors` en Etapa 2 ni `node-pg-migrate` en Etapa 3 — el criterio es que lo que se resuelve en poco código explícito no justifica una dependencia.

Con esto se reemplazaron los `window.alert` / `window.confirm` de `BooksPage`. Cerrado el ítem correspondiente del "qué haría distinto".

### Skeletons y empty states

Los estados intermedios recibieron atención específica:

- **Loading**: `TableSkeleton` con N filas y N columnas configurables reemplaza el "Cargando libros…" plano de `BooksPage` y `OverduePage`. Header y filas son bloques con `animate-pulse bg-paper-mid`.
- **Empty**: cada tabla tiene un empty state con icono (`BookX` en gris para "sin libros", `CheckCircle2` en verde para "sin vencidos"), titular y copy de segunda línea que sugiere acción o transmite tono. Reemplaza el texto plano "No hay libros para mostrar."
- **Hover en filas**: `transition-colors hover:bg-paper-soft`. Micro-detalle pero cambia la sensación de tabla estática a tabla interactiva.

### Rename del nombre visible

En la UI aparecía "biblioteca-aixa" (nombre del repo, marca personal) como si fuera el nombre del producto. Se renombró a "Sistema de biblioteca" en topbar, hero de Login/Register, footer y `<title>` del navegador. **El `TOKEN_STORAGE_KEY = "biblioteca-aixa.token"` se mantuvo intocado** — es un identificador interno, no visible, y cambiarlo hubiese invalidado tokens ya emitidos.

Lección: nombres visibles y nombres internos tienen ciclos de vida y consumidores distintos. El nombre visible describe el producto y puede cambiar libremente; el nombre interno es un identificador estable.

### La regla de no tocar los tests

El refactor tocó ~12 archivos entre primitivos, páginas, formularios y tablas, agregó 4 archivos de tests nuevos (Toast, ConfirmDialog, Skeleton, TableSkeleton) y llevó la suite de 70/70 a 82/82. **Ninguno de los tests existentes tuvo que cambiar.** Esto validó tres cosas de la Etapa 2:

- Los tests que buscan por accesibilidad (`getByLabelText`, `getByRole`, `getByText`) sobreviven cambios de CSS y de estructura HTML.
- El texto visible (botones "Nuevo libro", "Editar", "Eliminar") no cambió — solo su estilo, así que las queries por texto siguieron matcheando.
- Los tests de integración de páginas dependían del contrato `LoginForm({ onSubmit, errorMessage })`, no de su implementación interna. Migrar el form a primitivos `Input`/`Button` fue transparente.

Cada vez que un cambio visual amenazaba con romper un test, la señal era que el cambio se estaba metiendo con la semántica accesible del componente, no con el look. Ajustar en esos casos era ajustar el visual para preservar el label / role, no el test.

### Scope consciente fuera de alcance

- **Sin dark mode.** Los tokens `ink/paper` están diseñados para invertirse pero la app hoy asume paleta clara. Agregar `dark:` variants a todos los primitivos y un toggle global quedó fuera de scope.
- **Sin Storybook para primitivos V4/V5/V6.** Los nuevos (Toast, ConfirmDialog, Skeleton) tienen tests pero no stories. Storybook fue central en Etapa 2 y no se mantuvo estrictamente en el refactor visual.
- **Sin animaciones de entrada/salida en toasts.** Aparecen y desaparecen en seco. Un `framer-motion` o transiciones CSS resolverían esto pero suman superficie.

## Feature `/my-library` — vista consolidada del MEMBER (post-refactor)

### Motivación

Al cierre de Etapa 2 las acciones del MEMBER (Prestar / Devolver / Reservar / Cancelar) vivían todas contextualmente en `/books`, por libro, resueltas por `resolveMemberAction` dentro de `BookList`. Era suficiente para el flow básico pero no daba una vista consolidada de "lo que tengo" — el MEMBER que quería saber qué debía devolver tenía que scrollear el catálogo entero. La feature agrega una página dedicada `/my-library` con tres secciones (préstamos activos, reservas activas, historial) sin sacar las acciones contextuales de `/books`: ambas conviven.

Este ítem estaba en el "Qué haría distinto" original y se cerró ahora.

### El enriquecimiento del output de los use-cases (dominio)

`ListMyLoans` y `ListMyReservations` originalmente devolvían solo IDs (`bookId`) sin datos del libro. En `/books` eso alcanzaba porque el catálogo ya se listaba en paralelo y `BookList` cruzaba por `bookId`. Pero en `/my-library` no querés forzar al MEMBER a mirar el catálogo entero para saber qué libro es "b1a2c3...".

Se agregó `BookRepository` como dependencia inyectada de los tres use-cases (`ListMyLoans`, `ListMyReservations`, `ListMyLoanHistory`) y cada output devuelve `book: { id, title, author, isbn }` embebido por entry. **Se sigue el mismo patrón que `ListOverdueLoans`** (que ya enriquecía con `book` y `member`): si el book fue eliminado pero el loan/reservation aún existe, la entry se filtra silenciosamente en vez de romper. Es data inconsistente que no debería llegar al UI.

El nuevo use-case `ListMyLoanHistory` es hermano de `ListMyLoans` con dos diferencias: no filtra por status (trae activos + devueltos) y expone `returnDate: Date | null`. Se agregó el port `LoanRepository.findByUser(userId)` sin filtro de status (el `findActiveByUser` existente devuelve solo ACTIVE). Ordena por `loanDate DESC` en el use-case para que la responsabilidad de "orden cronológico" esté en el dominio, no en el adaptador ni en el frontend.

Dominio pasó de 122 a 131 tests con la feature (5 nuevos de `ListMyLoanHistory`, 4 más de ajustes en `ListMyLoans` / `ListMyReservations` con el book enriquecido).

### Cambios contractuales de la API — decisión de romper el shape en vez de duplicar endpoint

`GET /loans/mine` y `GET /reservations/mine` cambiaron su shape (agregaron `book`) sin bump de versión ni endpoint alternativo. Alternativa considerada: dejar los endpoints existentes intactos y crear `/loans/mine/detailed` o similar. Se descartó por dos motivos:

1. **No hay clientes externos.** El único consumidor es este frontend, y se actualizó en el mismo commit-set. Mantener el shape viejo sería precaución ceremonial sin usuario real.
2. **El shape enriquecido es estrictamente más informativo.** Un cliente que solo usaba `bookId` sigue funcionando (la propiedad no cambió). Solo suma `book`.

`GET /loans/mine/history` sí es endpoint nuevo — no había forma de obtener historial antes. Los adaptadores PG e in-memory implementaron `findByUser` (Pg con `ORDER BY loan_date DESC` a nivel query, aunque el use-case también reordena, para consistencia si algún adapter no ordena).

En el frontend, la actualización de los tipos (`Loan.book: BookSummary`, `Reservation.book: BookSummary`, nuevo `LoanHistoryEntry`) forzó ajustes en los mocks de tests y stories de `BookList`. TypeScript los detectó al hacer typecheck — validación gratis de que ningún consumo del tipo quedó desactualizado.

### Diseño de la página `/my-library`

Tres secciones apiladas verticalmente, cada una autocontenida (`ActiveLoansSection`, `ActiveReservationsSection`, `HistorySection`) con su propio empty state, estado de loading (`TableSkeleton`) y manejo de error. Se usa un componente wrapper `SectionShell` que unifica el patrón `<icono> <titulo> <descripción>` para las tres — evita repetición sin abstraer prematuramente lógica (las secciones internas son distintas).

Decisiones concretas:

- **`DueBadge` local** que computa `daysUntil(dueDate)` y elige tono según el resultado: vencido (danger, rojo), hoy (danger), 1-3 días (outline, alerta suave), 4+ días (muted). La lógica vive en la página, no en el dominio — el dominio ya expone `dueDate: Date` y "cómo mostrar la urgencia" es decisión de UX que puede cambiar sin tocar el use-case.
- **Confirmaciones antes de acciones destructivas**: Devolver y Cancelar reserva pasan por `useConfirm()` (el sistema propio del refactor visual). Devolver es "confirm neutro" (`tone: default`); Cancelar reserva es `tone: "danger"` porque es una acción que se pierde definitivamente (el turno se libera y hay que reservar de nuevo).
- **Invalidación de la nueva key en las mutations**: `useLoanBook` y `useReturnLoan` invalidan también `loans/mine/history` en `onSuccess` para que la página se refresque después de acciones. Sin esto, la sección historial mostraba estado stale hasta un refresh manual.
- **Link en Topbar solo para MEMBER**: `isMember = user?.role === "MEMBER"`. LIBRARIAN/ADMIN ven "Vencidos" pero no "Mi biblioteca" — no tiene sentido que un bibliotecario vea "sus" préstamos si el rol no puede prestar/reservar.

### Tests y contratos

Se agregó `MyLibraryPage.test.tsx` con tres tests de integración (fetch mockeado): renderiza las tres secciones con datos reales, muestra empty states cuando todo viene vacío, y dispara `POST /loans/:id/return` cuando el usuario confirma en el diálogo. `Topbar.test.tsx` se extendió con un test que verifica que el link "Mi biblioteca" aparece solo para MEMBER. Cerrado con 86/86 verde.

**Gotcha con el mock de `fetch` en Vitest**: el client hace `fetch(new URL(...), ...)`, no `fetch("string", ...)`. Los mocks que asumen `url: string` fallan con `url.endsWith is not a function` cuando el argumento es un `URL`. La solución es normalizar en el mock: `const url = typeof input === "string" ? input : input.toString()`. Se documenta acá porque va a repetirse en cualquier test futuro que quiera enrutar respuestas mock por URL.

### Scope consciente fuera de alcance

- **Sin paginación del historial.** El historial se muestra completo. Para un MEMBER activo con años de uso esto puede pesar; con paginación real (cursor por `loanDate`) o infinite scroll sería el próximo paso.
- **Sin filtros ni búsqueda dentro del historial.** No hay filtro por año, por título ni por estado. Volumen actual no lo justifica.
- **Sin optimistic updates.** La UI espera la respuesta del server. Es una versión más de lo mismo del item pendiente 8 del "Qué haría distinto".
- **Sin ordenamiento configurable.** El historial siempre viene ordenado por `loanDate DESC`. No hay toggle para orden ascendente ni por libro.

## Qué haría distinto en una segunda iteración

1. **Fakes compartidos para tests** — `domain/src/__test-utils__/` con builders (`aUser().withRole("LIBRARIAN").build()`) y fakes canónicos, en lugar de duplicar `__fakes__/` por carpeta.
2. **Explicit output DTOs** — los use-cases hoy devuelven objetos "planos" armados a mano dentro del `execute`. Podría formalizarse con mappers dedicados para que el shape del output esté claro y sea consistente.
3. **Tests de integración de los adapters PG** — con `testcontainers` levantando un Postgres real en el pipeline de tests. Cubriría upserts, constraints, casos borde de reservas y préstamos concurrentes.
4. **Tests de integración del backend HTTP** — hoy solo hay tests del dominio. Un `supertest` sobre `buildApp()` con el container real (in-memory alcanza) cubriría el mapeo HTTP → use-case → error.
5. **Logging estructurado y correlación de request-id** — hoy el server hace `console.log` mínimo. Un pino/winston con request-id ayudaría a debug en un despliegue real.
6. **Rate limiting y helmet** — no incluidos porque no eran parte del scope, pero son la primera capa que agregaría antes de exponer esto a Internet.
7. **Cerrar `Fine` / `PayFine`** si el negocio lo pidiera. Hoy la entidad está huérfana.
8. **Optimistic updates en mutations** — hoy `useLoanBook`, `useReserveBook`, etc. esperan la respuesta del server para invalidar y disparar el refetch. Con optimistic updates la UI reflejaría el cambio al instante y revertiría en `onError`. Vale la pena cuando la latencia sea real (Postgres remoto, no in-memory).
9. ~~**Toasts en vez de `window.alert`** para errores de mutations.~~ *Cerrado en el refactor visual con un `ToastProvider` propio (ver sección "Refactor visual del frontend").*
10. **Tests E2E con Playwright** — los tests de páginas hoy mockean `fetch`, cubren el mapeo props↔UI pero no el flow real browser→backend. Playwright contra el compose ya levantado sería el complemento natural.
11. ~~**Página `/my-library` para el MEMBER** si el volumen de préstamos/reservas crece. Hoy las acciones contextuales por libro alcanzan pero no dan una vista consolidada de "lo que tengo".~~ *Cerrado post-refactor: `/my-library` con 3 secciones (activos, reservas, historial), enriqueciendo los use-cases `ListMyLoans` / `ListMyReservations` con `book` y sumando el use-case `ListMyLoanHistory` (ver sección "Feature `/my-library`").*
12. **Reverse proxy nginx que unifique frontend + backend detrás de un solo puerto**, con `/api/*` ruteado al backend interno. Simplificaría CORS, cerraría el `:3000` al exterior y haría que el frontend pueda usar rutas relativas (sin `VITE_API_BASE_URL` acoplado al build).
13. **Healthcheck HTTP del backend en compose** para que `frontend` no arranque hasta que el backend responda `/health`, no solo hasta que el proceso levantó.
14. **CI mínimo en GitHub Actions** — al menos `yarn test` de dominio + `yarn frontend:test` + `docker build` de ambas imágenes en push a `main`.
