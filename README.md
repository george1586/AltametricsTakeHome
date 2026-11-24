# AltametricsTakeHome

A full-stack invoice viewer. A user logs in, sees a paginated table of their own invoices, and clicks any row to open its details in a modal.

The project has three runtime pieces: a React client built with Vite, a NestJS API, and PostgreSQL running in Docker. Logging in returns a JWT. The client sends that token with every invoice request, and the API only returns invoices that belong to the caller.

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Requirements checklist](#requirements-checklist)
- [Tech stack](#tech-stack)
- [System overview](#system-overview)
- [Repository layout](#repository-layout)
- [Environment variables](#environment-variables)
- [API](#api)
- [Data model](#data-model)
- [Client](#client)
- [End-to-end flow](#end-to-end-flow)
- [Design notes](#design-notes)
- [Scripts](#scripts)

## Quick start

**Prerequisites:** Node.js 22.18 or newer (developed on Node 26), npm, and Docker with Docker Compose.

Run these from the repository root, in order.

**1. Create the environment files** from the examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

The defaults work as they are for local development.

**2. Start PostgreSQL** and wait until it is healthy:

```bash
docker compose up -d --wait
```

**3. Install the API, create the tables, seed the demo data and start the server** on `http://localhost:3000`:

```bash
cd server
npm install
npx prisma db init
npm run seed
npm run start:dev
```

**4. In a second terminal, start the client** on `http://localhost:5173`:

```bash
cd client
npm install
npm run dev
```

**5. Open `http://localhost:5173`** and log in with the demo account below.

To start again from an empty database, run `docker compose down -v && docker compose up -d --wait` from the root, then `npx prisma db init` and `npm run seed` from `server/`. The seed can also be re-run on its own at any time: it removes the seed users (and, through the cascade, their invoices) before recreating them.

## Demo accounts

The seed creates three users, all with the password **`Password123!`**:

| Email | Password | Invoices | Useful for |
| ----- | -------- | -------- | ---------- |
| `demo@altametrics.com` | `Password123!` | 25 | The main account: three pages at 10 per page |
| `alice@altametrics.com` | `Password123!` | 8 | Checking that users only see their own invoices |
| `bob@altametrics.com` | `Password123!` | 1 | A single-invoice list |

## Requirements checklist

How each part of the assignment maps to the code:

| Requirement | Where |
| ----------- | ----- |
| Monorepo with `/client` (Vite) and `/server` (NestJS) | Repository root |
| NestJS API in TypeScript | `server/` |
| PostgreSQL, set up with Docker | `docker-compose.yaml` |
| Prisma ORM for data access | `server/prisma/contract.prisma`, `server/src/db/` |
| Prisma seed for all demo data | `server/prisma/seed.ts` |
| JWT with Passport | `server/src/auth/` |
| Zod for DTO validation | `server/src/auth/login.schema.ts`, `server/src/common/pagination.schema.ts`, the `:id` param schema |
| `POST /auth/login`, `GET /invoices`, `GET /invoices/:id` | [Endpoints](#endpoints) |
| Login username and password in the README | [Demo accounts](#demo-accounts) |
| React + TypeScript with Vite | `client/` |
| Redux Toolkit for state management | `client/src/store/` |
| Axios for API requests | `client/src/api/http.ts` |
| React Query for API calls | `client/src/features/` |
| Zod for frontend validation, Tailwind for styling | `client/src/schemas/`, `client/src/index.css` |
| Login page and `/invoices` page | `client/src/features/auth/`, `client/src/features/invoices/` |
| Invoice table (TanStack Table) | `client/src/features/invoices/InvoiceTable.tsx` |
| Row click opens a modal with the invoice details | `client/src/features/invoices/InvoiceModal.tsx` |

Bonus items:

| Bonus | Status |
| ----- | ------ |
| Pagination (API and client) | Done: validated `page` and `limit` query, `{ data, meta }` response, Previous and Next on the client |
| Logging middleware | Done: `server/src/common/middleware.ts` logs method, path, status and duration for every request |
| Good use of exceptions / API error handling | Done: 400, 401 and 404 thrown at the right stage, and the API never crashes on them |
| Error handling for failed requests (client) | Done: readable messages with a retry button, and a 401 logs the user out |
| Unit tests with Vitest | Not included |
| Playwright test | Not included |
| Registration page | Not included |

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Client   | React 19, TypeScript, Vite 8, React Router 8, Redux Toolkit, TanStack Query 5, TanStack Table 9, Axios, Zod 4, Tailwind CSS 4 |
| API      | NestJS 12 (ES modules), TypeScript, Passport JWT, bcrypt, Zod 4, Prisma ORM 8 |
| Database | PostgreSQL 19 in Docker Compose |

## System overview

All the diagrams use the same colours: blue for the client, amber for the API, green for the database, red for error responses. Dashed boxes are dev and test tooling, not part of the running app.

![System overview: React client, NestJS API and PostgreSQL](docs/architecture/overview.svg)

The browser never talks to the database directly. Every request goes through the API, and every invoice route is protected by a JWT guard. The API is the only piece with a database connection; the client only knows `VITE_API_URL`. Prisma owns the data model, the tables and the seed data.

## Repository layout

Each side is organised by feature, so all of the auth code sits in one folder and all of the invoice code in another.

```text
/
├── docker-compose.yaml          # postgres:19, named volume pgdata, healthcheck
├── .env.example                 # POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT
├── README.md
├── docs/architecture/           # the diagrams in this README
│
├── server/                      # NestJS API
│   ├── prisma/
│   │   ├── contract.prisma      # data model (Prisma 8 "contract")
│   │   └── seed.ts              # demo users (bcrypt-hashed passwords) + invoices
│   ├── migrations/              # Prisma migration state
│   ├── prisma.config.ts         # contract path, output folder, DATABASE_URL
│   ├── src/
│   │   ├── main.ts              # CORS, global Zod validation pipe
│   │   ├── app.module.ts        # imports the modules, applies the logger middleware
│   │   ├── db/                  # db.ts (Prisma client), generated contract files, DbModule
│   │   ├── auth/                # controller, service, JWT strategy + guard, Zod schemas
│   │   ├── invoices/            # controller, service, Zod schemas
│   │   └── common/              # logger middleware, pagination schema, @CurrentUser
│   └── .env.example             # DATABASE_URL, JWT_SECRET
│
└── client/                      # React + Vite SPA
    ├── src/
    │   ├── main.tsx             # Redux Provider, QueryClientProvider, routes
    │   ├── api/                 # http.ts (Axios instance), auth.api.ts, invoices.api.ts
    │   ├── store/               # store.ts, authSlice.ts, uiSlice.ts
    │   ├── schemas/             # Zod: login form and response, invoice, page of invoices
    │   ├── lib/                 # money and date formatting, error messages
    │   ├── routes/              # ProtectedRoute.tsx
    │   ├── components/          # AppLayout.tsx (sidebar and top bar)
    │   └── features/
    │       ├── auth/            # LoginPage
    │       └── invoices/        # InvoicesPage, InvoiceTable, InvoiceModal, Pagination
    └── .env.example             # VITE_API_URL
```

## Environment variables

| File | Variable | Example | Used for |
| ---- | -------- | ------- | -------- |
| `.env` | `POSTGRES_USER` | `altametrics` | Database user created on first start |
| `.env` | `POSTGRES_PASSWORD` | `altametrics` | That user's password |
| `.env` | `POSTGRES_DB` | `invoices` | Database created on first start |
| `.env` | `POSTGRES_PORT` | `5432` | Port published on your machine |
| `server/.env` | `DATABASE_URL` | `postgresql://altametrics:altametrics@localhost:5432/invoices` | Prisma's connection; must match the values above |
| `server/.env` | `JWT_SECRET` | any long random string | Signing and verifying tokens |
| `server/.env` | `PORT` | `3000` (default) | Optional API port |
| `client/.env` | `VITE_API_URL` | `http://localhost:3000` | Base URL for every API call |

The `POSTGRES_*` values are only applied when the database volume is first created. After changing them, recreate the volume with `docker compose down -v`.

## API

Every request runs through the same NestJS stages in a fixed order: middleware, then the guard, then the validation pipe, then the route handler. Each stage either passes the request on or throws an `HttpException`, which NestJS turns into a JSON error response.

![Request pipeline for GET /invoices/:id, with 401, 400 and 404 exits](docs/architecture/request-pipeline.svg)

Validation uses Zod schemas through NestJS 12's built-in `StandardSchemaValidationPipe`, registered globally in `main.ts`. A schema is attached to each input, for example `@Body({ schema: AuthSchema })`, `@Query({ schema: paginationQuerySchema })` and `@Param('id', { schema: z.uuid() })`. Invalid input never reaches the controller.

`POST /auth/login` is public, so it skips the guard.

### Module wiring

```text
AppModule
├── DbModule                # @Global, provides the Prisma 8 db client under the 'DB' token
├── AuthModule              # PassportModule + JwtModule (1 hour tokens)
│   ├── AuthController      # POST /auth/login
│   ├── AuthService         # bcrypt.compare, jwt.signAsync({ sub, email })
│   └── JwtStrategy         # validate(payload) → { userId, email }
├── InvoicesModule
│   ├── InvoicesController  # @UseGuards(JwtAuthGuard)
│   └── InvoicesService     # every query filters by user_id
└── LoggerMiddleware        # applied to all routes

main.ts
  useGlobalPipes(new StandardSchemaValidationPipe())
  enableCors({ origin: 'http://localhost:5173' })
```

### Endpoints

| Method | Path | Auth | Input | 200 response | Errors |
| ------ | ---- | ---- | ----- | ------------ | ------ |
| `POST` | `/auth/login` | Public | body `{ email, password }` | `{ accessToken, user: { id, email, name } }` | 400 invalid body · 401 wrong credentials |
| `GET` | `/invoices` | Bearer | query `page` (default 1), `limit` (default 10, max 100) | `{ data: Invoice[], meta: { page, limit, total, totalPages } }` | 400 bad query · 401 |
| `GET` | `/invoices/:id` | Bearer | param `id` (UUID) | `Invoice` | 400 id not a UUID · 401 · 404 missing or not owned |

Errors use NestJS's standard shape, for example:

```json
{ "statusCode": 404, "message": "Invoice not found", "error": "Not Found" }
```

### Trying it with curl

```bash
# log in and copy the accessToken from the response
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@altametrics.com","password":"Password123!"}'

# list the second page of invoices
curl "http://localhost:3000/invoices?page=2" -H "Authorization: Bearer <accessToken>"

# one invoice (use an id from the list)
curl http://localhost:3000/invoices/<id> -H "Authorization: Bearer <accessToken>"
```

## Data model

There are two tables. Ids are UUID v7, generated by Prisma when a row is created, so they are not guessable and they sort by creation time. Field names are snake_case in both PostgreSQL and TypeScript.

![Data model: one User owns many Invoices](docs/architecture/data-model.svg)

One user owns many invoices. `user_id` is indexed because every invoice query filters on it. Deleting a user also deletes that user's invoices.

The model is written in `server/prisma/contract.prisma`. `npx prisma contract emit` compiles it into `server/src/db/contract.json` and `contract.d.ts`, which the app reads at runtime and for its types; both are committed, so a fresh clone doesn't need to emit them. `npx prisma db init` creates the tables from them.

## Client

Client state is split by who owns it:

- **Redux Toolkit** holds state that only the browser knows: the session (token, user) and UI state (the selected invoice and the current page).
- **TanStack Query** holds state that the server owns: invoice rows, cached by query key.

Query results are never copied into Redux.

![Client state: Redux store, components, TanStack Query cache and the Axios instance](docs/architecture/client-state.svg)

Clicking a row does not fetch anything itself. It sets `selectedInvoiceId` in Redux. The modal reads that id, and its query fetches the invoice from `GET /invoices/:id`. A single Axios instance (`api/http.ts`) adds the Bearer token to every request, and when a response comes back 401, it logs the user out, which sends them to `/login`. Zod checks data at both ends of the client: it validates the login form before it is sent, and it parses API responses into typed objects (turning the `amount` string into a number and the due date into a `Date`).

The table follows the provided mock-up: Payee, Description, Due Date, Amount and Status (Paid or Open). The invoice model has no separate invoice date, so the mock-up's Date column is not shown.

## End-to-end flow

The full round trip, from logging in to loading the list and opening one invoice:

![Sequence: log in, load the invoice list, open an invoice](docs/architecture/request-flow.svg)

Solid arrows are calls and dashed arrows are responses. The JWT is issued once at login, and the guard checks it on every later request. The user id used in every query comes from the token, never from the URL or the request body.

## Design notes

- **Invoices are scoped to their owner.** `GET /invoices` filters on the `user_id` from the token. `GET /invoices/:id` matches both `id` and `user_id`, so requesting another user's invoice returns the same 404 as requesting one that doesn't exist.
- **The password hash never leaves the API.** Passwords are stored as bcrypt hashes. The login response only includes `id`, `email` and `name`. A wrong email and a wrong password get the same 401 message, so the API doesn't reveal which emails exist.
- **Money is `Decimal(12,2)`, not a float.** The API returns amounts as strings (`"469.77"`) to keep them exact. The client converts them with `z.coerce.number()` and formats them with `Intl.NumberFormat`.
- **The token is stored in `localStorage`.** This keeps setup and testing simple; a production deployment would use an httpOnly cookie instead. Any 401 clears the token and sends the user back to `/login`.
- **Pagination is a validated query.** `paginationQuerySchema` (page ≥ 1, limit 1–100, with defaults) runs through the global validation pipe. The list endpoint always returns `{ data, meta }`. On the client, `placeholderData: keepPreviousData` keeps the current page on screen while the next one loads.
- **CORS is restricted to one origin.** `enableCors({ origin: 'http://localhost:5173' })` lets the client call the API on `:3000` without opening the API to every origin.
- **Prisma ORM 8.** The project uses Prisma 8 (a release candidate at the time of writing): the data model is a "contract", and queries go through `db.orm.public.<Model>`. The client is provided to NestJS by a global `DbModule` and injected with `@Inject(DB)`.

## Scripts

**`server/`**

| Command | Does |
| ------- | ---- |
| `npm run start:dev` | Starts the API on port 3000 and restarts it on file changes |
| `npm run build` / `npm run start:prod` | Builds to `dist/` and runs the built API |
| `npm run seed` | Recreates the demo users and their invoices |
| `npm run contract:emit` | Regenerates `src/db/contract.json` and `contract.d.ts` after editing `contract.prisma` |
| `npx prisma db init` | Creates the tables in an empty database |

**`client/`**

| Command | Does |
| ------- | ---- |
| `npm run dev` | Starts the client on port 5173 |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the built client |