# Lamma (لَمّة)

Subscription & debt-collection app for Egyptian businesses.
Architecture: `docs/superpowers/specs/2026-10-11-lamma-architecture-design.md`.
Design reference: `lamma-design-handoff/`.

## Layout

| Path | What |
|---|---|
| `packages/shared` | Domain rules, API types, ar/en translations, design tokens |
| `apps/backend` | NestJS API (`/api/v1`) + Prisma/PostgreSQL |
| `apps/mobile` | React Native owner app (phase 3) |
| `apps/web` | Next.js pay page + landing (phase 5) |

## First-time setup

Requirements: Node 24+, Yarn (any version; the repo pins 4.18.1), Docker Desktop.

```bash
yarn install                                   # also builds packages/shared and generates the Prisma client
docker compose up -d                           # postgres (lamma + lamma_test), redis, mailpit
cp apps/backend/.env.example apps/backend/.env # then replace both secrets with long random strings
yarn workspace @lamma/backend db:deploy        # apply migrations to the dev database
yarn workspace @lamma/backend start:dev        # http://localhost:3000/api/v1/health
```

In development, OTP codes are printed in the backend log (`[OTP] [phone] +2010… → 123456`).

**No Docker?** Use Prisma's local dev servers instead of `docker compose`:

```bash
cd apps/backend
npx prisma dev --name lamma --detach        # dev database
npx prisma dev --name lamma-test --detach   # test database
npx prisma dev ls                           # shows the TCP URL of each server
```

Put the first TCP URL in `DATABASE_URL` in `apps/backend/.env` and the second in `apps/backend/.env.test.local`
(git-ignored; it overrides the Docker default committed in `.env.test`), e.g.
`DATABASE_URL=<second URL>` as its only line.
After a reboot, restart both servers with `npx prisma dev start lamma lamma-test`.

## Everyday commands

```bash
yarn test          # unit tests in every workspace
yarn test:e2e      # backend e2e tests against lamma_test
yarn lint          # type-check every workspace
yarn format        # prettier
yarn workspace @lamma/backend db:migrate --name <change>   # new migration after editing schema.prisma
```

After editing `packages/shared`, run `yarn build:shared` so the apps' type-checks see the change. Backend tests read the shared source directly.

## API (v1)

All owner routes need `Authorization: Bearer <accessToken>`. Errors are `{ code, message, details? }`; translate `code` with `packages/shared/src/i18n`.

| Method & path | What |
|---|---|
| `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/refresh` · `POST /auth/logout` | OTP sign-up / login, tokens |
| `GET/PATCH /business` · `GET /business/usage` · `POST /business/upgrade-request` | Business settings and plan |
| `GET /customers?search=&status=` · `POST /customers` · `POST /customers/batch` | List (status + balance) / create |
| `GET/PATCH/DELETE /customers/:id` · `GET /customers/:id/history` | Detail, edit, archive, timeline |
| `GET/POST /charges` · `PATCH /charges/:id` | Monthly and one-time charges |
| `POST /invoices/:id/cash-payment` | Record cash |
| `GET/PUT /reminders/rule` · `GET /reminders/today` · `GET /reminders/invoices/:id` · `POST /reminders/:invoiceId/sent` | WhatsApp reminders |
| `GET /dashboard/home` · `GET /reports/monthly?period=YYYY-MM` | Home screen and monthly report |

Monthly invoices are created when a charge is created and back-filled on every read (`InvoiceGenerator.ensureUpToDate`); there is no background job yet.

## Conventions

- Feature folders: `apps/backend/src/modules/<feature>/` with controller → service → repository.
- Files stay under ~150 lines; one class/component per file.
- Errors: throw `AppError(code)`; clients translate `code` via `packages/shared/src/i18n`.
