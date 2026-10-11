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

## Conventions

- Feature folders: `apps/backend/src/modules/<feature>/` with controller → service → repository.
- Files stay under ~150 lines; one class/component per file.
- Errors: throw `AppError(code)`; clients translate `code` via `packages/shared/src/i18n`.
