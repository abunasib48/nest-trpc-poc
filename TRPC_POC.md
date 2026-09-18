# NestJS + HTTP + tRPC + PostgreSQL + TypeORM — POC

One NestJS process serves a **REST/HTTP API** and a **tRPC API**. Both go through the
same `UserService`, the same TypeORM repository and the same PostgreSQL database.

## Architecture

```text
HTTP Controller                tRPC Router
  (UserController)              (TrpcRouter)
       │                             │
       └──────────┬──────────────────┘
                  ▼
             UserService          ← the only place DB/business logic lives
                  │
                  ▼
               TypeORM
                  │
                  ▼
              PostgreSQL
```

Both entry points are constructor-injected with the **same singleton** `UserService`
provider (exported by `UserModule`, imported by `TrpcModule`). There is no second
database implementation for tRPC.

### Files

| File | Role |
| --- | --- |
| `src/user/user.entity.ts` | `User` entity — `id`, `name`, `email` |
| `src/user/user.service.ts` | **Shared** service: `getById(id)`, `create()` |
| `src/user/user.controller.ts` | HTTP: `GET /users/:id`, `POST /users` |
| `src/user/user.module.ts` | Wires entity + service + controller, exports `UserService` |
| `src/trpc/trpc.base.ts` | `initTRPC` instance (`router`, `publicProcedure`) |
| `src/trpc/trpc.router.ts` | tRPC router — injects `UserService`; exports `AppRouter` type |
| `src/trpc/trpc.module.ts` | Mounts the tRPC express handler at `/trpc` as Nest middleware |
| `src/trpc/client.example.ts` | Tiny typed client demonstrating end-to-end inference |
| `src/app.module.ts` | `ConfigModule` + `TypeOrmModule.forRoot` + `UserModule` + `TrpcModule` |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker run -d --name nest-trpc-poc-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nest_trpc_poc \
  -p 5432:5432 postgres:16-alpine
```

Any local PostgreSQL works too — just point `.env` at it. Copy `.env.example` to
`.env` if you don't have one:

```bash
cp .env.example .env
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nest_trpc_poc
PORT=3000
```

`synchronize: true` is enabled (POC only), so the `users` table is created on boot.

### 3. Start the server

```bash
npm run start          # or: npm run start:dev
```

One process, one port: `http://localhost:3000`.

## Create a test user

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
```

```json
{ "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" }
```

## HTTP request

```bash
curl http://localhost:3000/users/1
```

```json
{ "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" }
```

## tRPC request

Raw HTTP (a tRPC query is a `GET` with a JSON-encoded `input` query param):

```bash
curl 'http://localhost:3000/trpc/user.getById?input=%7B%22id%22%3A1%7D'
# input decodes to {"id":1}
```

```json
{ "result": { "data": { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" } } }
```

Typed client (`src/trpc/client.example.ts`):

```bash
npm run build
npm run trpc:client        # or: npm run trpc:client -- 2
```

```text
tRPC user.getById -> { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' }
inferred fields   -> 1 ADA LOVELACE ada@example.com
```

## Type safety

The client imports **only a type** — `import type { AppRouter } from './trpc.router.js'` —
so nothing from the server ships at runtime, yet the compiler knows the whole contract.
No code generation, no OpenAPI spec, no shared DTO package. These all fail `tsc`:

```ts
await client.user.getById.query({ id: '1' });  // Type 'string' is not assignable to type 'number'
user.nope;                                     // Property 'nope' does not exist on type
                                               //   '{ id: number; name: string; email: string }'
await client.user.nonExistent.query({});       // Property 'nonExistent' does not exist
```

## What this POC proves

1. A single NestJS application/process serves both REST and tRPC — no second
   Express app, no sidecar service.
2. tRPC integrates as ordinary Nest middleware, so the router is a normal
   `@Injectable()` and participates in Nest's DI.
3. Both transports share one business/data layer: `UserService` → TypeORM →
   PostgreSQL. Reading a row inserted by the HTTP API through tRPC (and
   vice-versa) returns identical data from the same table.
4. tRPC gives a compile-time-checked contract between server and TypeScript
   client with zero build step.

Verified: a row inserted via `POST /users`, a row inserted via raw SQL, and the
same rows read back through both `GET /users/:id` and `trpc/user.getById`.

## HTTP vs tRPC — the differences that matter

| | HTTP / REST | tRPC |
| --- | --- | --- |
| **Contract** | Convention + docs (OpenAPI, hand-written types) | The router's TypeScript type, inferred automatically |
| **Client** | Any HTTP client, any language | Best with a TypeScript client; other languages must hand-roll the JSON-RPC calls |
| **Routing** | URL paths + verbs (`GET /users/:id`) | Procedure paths (`user.getById`), always `GET` for queries / `POST` for mutations |
| **Validation** | Nest pipes (`ParseIntPipe`, DTOs) | zod schema on `.input()`, which is also the source of the client's types |
| **Errors** | Nest exceptions → HTTP status (`404 Not Found`) | `TRPCError` → JSON-RPC error body **and** an HTTP status (`NOT_FOUND` → 404) |
| **Nest features** | Full: guards, interceptors, pipes, filters, Swagger | Not applied — requests bypass the Nest router; use tRPC middleware instead |
| **Batching** | One request per call | `httpBatchLink` batches several procedure calls into one request |
| **Best for** | Public/third-party APIs, non-TS consumers, webhooks | Internal TS frontends/BFFs where server and client ship together |

The key trade-off: tRPC's type safety comes from server and client sharing a
TypeScript codebase. REST stays the right choice for anything consumed outside it —
which is exactly why serving both from one Nest app is useful.
