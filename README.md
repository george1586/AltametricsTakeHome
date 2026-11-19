# AltametricsTakeHome

A full-stack invoice viewer. A user logs in, sees a paginated table of their own invoices, and clicks any row to open its details in a modal.

The project has three runtime pieces: a React client built with Vite, a NestJS API, and PostgreSQL running in Docker. Logging in returns a JWT. The client sends that token with every invoice request, and the API only returns invoices that belong to the caller.

- [Tech stack](#tech-stack)
- [System overview](#system-overview)
- [Repository layout](#repository-layout)
- [API](#api)
- [Data model](#data-model)
- [Client](#client)
- [End-to-end flow](#end-to-end-flow)
- [Design notes](#design-notes)

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Client   | React, TypeScript, Vite, React Router, Redux Toolkit, TanStack Query, Axios, Zod, Tailwind CSS, TanStack Table |
| API      | NestJS, TypeScript, Passport JWT, bcrypt, Prisma |
| Database | PostgreSQL 16 in Docker Compose |
| Testing  | Service unit tests (`*.spec.ts`), Playwright end-to-end tests |

## System overview

All the diagrams use the same colours: blue for the client, amber for the API, green for the database, red for error responses. Dashed boxes are dev and test tooling, not part of the running app.

![System overview: React client, NestJS API and PostgreSQL](docs/architecture/overview.svg)

The browser never talks to the database directly. Every request goes through the API, and every invoice route is protected by a JWT guard. The API is the only piece with a database connection; the client only knows `VITE_API_URL`. Prisma owns the schema, the migrations and the seed data. The seed creates a demo user and a set of invoices owned by that user.

## Repository layout

Each side is organised by feature, so all of the auth code sits in one folder and all of the invoice code in another.

```text
/
├── docker-compose.yml          # postgres:16 + named volume
├── package.json                # root scripts: db:up, setup, dev
├── README.md
│
├── server/                     # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts             # demo user (bcrypt-hashed) + invoices
│   ├── src/
│   │   ├── main.ts             # CORS, global ValidationPipe, global exception filter
│   │   ├── app.module.ts
│   │   ├── prisma/             # PrismaModule, PrismaService
│   │   ├── auth/               # controller, service, JWT strategy, guard, DTOs
│   │   ├── invoices/           # controller, service, DTOs, unit tests
│   │   └── common/             # logger middleware, exception filter, pagination DTO, @CurrentUser
│   └── .env.example            # DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN
│
└── client/                     # React + Vite SPA
    ├── src/
    │   ├── main.tsx            # Redux Provider, QueryClientProvider, RouterProvider
    │   ├── api/                # http.ts (Axios instance), auth.api.ts, invoices.api.ts
    │   ├── store/              # store.ts, authSlice.ts, uiSlice.ts
    │   ├── schemas/            # Zod: loginSchema, invoiceSchema, paginatedSchema
    │   ├── features/
    │   │   ├── auth/           # LoginPage, useLogin
    │   │   └── invoices/       # InvoicesPage, InvoiceTable, InvoiceModal, useInvoices, useInvoice
    │   └── routes/             # router.tsx, ProtectedRoute.tsx
    ├── e2e/                    # Playwright tests
    └── .env.example            # VITE_API_URL
```

## API

Every request runs through the same NestJS stages in a fixed order: middleware, then the guard, then the pipes, then the route handler. Each stage either passes the request on or throws an `HttpException`. A single global `HttpExceptionFilter` converts every exception into the same JSON error shape.

![Request pipeline for GET /invoices/:id, with 401, 400 and 404 exits](docs/architecture/request-pipeline.svg)

`GET /invoices` takes the same path. A `PaginationQueryDto` validates `?page&limit`, and the service runs `findMany({ skip, take })` and `count()` in a single `$transaction`. `POST /auth/login` is public, so it skips the guard.

### Module wiring

```text
AppModule
├── ConfigModule.forRoot({ isGlobal: true })
├── PrismaModule            # @Global, exports PrismaService
├── AuthModule              # PassportModule + JwtModule
│   ├── AuthController      # POST /auth/login
│   ├── AuthService         # bcrypt.compare, jwt.signAsync({ sub, email })
│   └── JwtStrategy         # validate(payload) → { userId, email }
├── InvoicesModule
│   ├── InvoicesController  # @UseGuards(JwtAuthGuard)
│   └── InvoicesService     # every query filters by userId
└── LoggerMiddleware        # applied to all routes

main.ts
  enableCors({ origin: CORS_ORIGIN })
  useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  useGlobalFilters(new HttpExceptionFilter())
```

### Endpoints

| Method | Path             | Auth   | Input | 200 response | Errors |
| ------ | ---------------- | ------ | ----- | ------------ | ------ |
| `POST` | `/auth/login`    | Public | body `{ email, password }` | `{ accessToken, user: { id, email, name } }` | 400 invalid body · 401 wrong credentials |
| `POST` | `/auth/register` | Public | body `{ email, password, name }` | `{ accessToken, user }` | 400 invalid body · 409 email taken |
| `GET`  | `/invoices`      | Bearer | query `page=1&limit=10` | `{ data: Invoice[], meta: { page, limit, total, totalPages } }` | 400 bad query · 401 |
| `GET`  | `/invoices/:id`  | Bearer | param `id` (integer) | `Invoice` | 400 id not a number · 401 · 404 missing or not owned |

Every error response uses the same shape: `{ statusCode, message, path, timestamp }`.

## Data model

There are two tables. Columns are snake_case in PostgreSQL, and Prisma maps them to camelCase in TypeScript.

![Data model: one User owns many Invoices](docs/architecture/data-model.svg)

One user owns many invoices. `user_id` is indexed because every invoice query filters on it. Deleting a user also deletes that user's invoices.

## Client

Client state is split by who owns it:

- **Redux Toolkit** holds state that only the browser knows: the session (token, user) and UI state (the selected invoice and the current page).
- **TanStack Query** holds state that the server owns: invoice rows, cached by query key.

Query results are never copied into Redux.

![Client state: Redux store, components, TanStack Query cache and the Axios instance](docs/architecture/client-state.svg)

Clicking a row does not fetch anything itself. It sets `selectedInvoiceId` in Redux. The modal reads that id, and its query fetches the invoice. A single Axios instance (`api/http.ts`) adds the Bearer token to every request. When a response comes back 401, the same instance logs the user out and clears the query cache. Zod checks data at both ends of the client: it validates form input before it is sent, and it parses API responses into typed objects.

## End-to-end flow

The full round trip, from logging in to loading the list and opening one invoice:

![Sequence: log in, load the invoice list, open an invoice](docs/architecture/request-flow.svg)

Solid arrows are calls and dashed arrows are responses. The JWT is issued once at login, and the guard checks it on every later request. The user id used in every query comes from the token, never from the URL or the request body.

## Design notes

- **Invoices are scoped to their owner.** `GET /invoices` filters on the `userId` from the token. `GET /invoices/:id` uses `findFirst({ where: { id, userId } })`, so requesting another user's invoice returns the same 404 as requesting one that doesn't exist.
- **The password hash never leaves the API.** Passwords are stored as bcrypt hashes. User responses only include `id`, `email` and `name`. A wrong email and a wrong password get the same 401 message.
- **Money is `Decimal(12,2)`, not a float.** Prisma serialises Decimal values as strings. The client converts them with `z.coerce.number()` and formats them with `Intl.NumberFormat`.
- **The token is stored in `localStorage`.** This keeps setup and end-to-end testing simple; a production deployment would use an httpOnly cookie instead. Any 401 clears the token and sends the user back to `/login`.
- **Pagination is a validated query DTO.** `PaginationQueryDto` (page ≥ 1, limit 1–100, with defaults) goes through the global `ValidationPipe`. The list endpoint always returns `{ data, meta }`. On the client, `placeholderData: keepPreviousData` keeps the current page on screen while the next one loads.
- **CORS is restricted to one origin.** `enableCors({ origin: CORS_ORIGIN })` lets the client on `:5173` call the API on `:3000` without opening the API to every origin.
