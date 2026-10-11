# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Lamma monorepo with the shared domain package and a NestJS backend whose OTP + JWT authentication works end to end against PostgreSQL.

**Architecture:** Yarn 4 workspaces monorepo. `packages/shared` is a pure-TypeScript ESM package (domain rules, types, i18n strings, design tokens) built to `dist/` and consumed by the apps. `apps/backend` is a NestJS 12 (ESM) app using Prisma 7 with the `pg` driver adapter. Features live in `src/modules/<feature>`, cross-cutting pieces in `src/common`, adapters in `src/infra`. Tests use Vitest: unit specs beside the code, e2e specs in `test/` against a dedicated `lamma_test` database.

**Tech Stack:** Node 24, Yarn 4.18.1, TypeScript ~6.0.2, NestJS 12, Prisma 7.10.0 + `@prisma/adapter-pg`, PostgreSQL 17 (Docker), Vitest 4, Supertest 7, class-validator, zod 4, `@nestjs/jwt`, `@nestjs/throttler`.

**Spec:** `docs/superpowers/specs/2026-10-11-lamma-architecture-design.md` (sections 2, 3, 4, 5 and phase 1 of section 8).

## Global Constraints

- Target ≤ 150 lines per file; any file nearing 200 lines must be split.
- One component / service / DTO per file. Controllers are thin; services hold logic; repositories are the only code that touches Prisma.
- No hardcoded user-facing strings in the apps; translations live in `packages/shared/src/i18n`.
- TypeScript `strict` everywhere. ESM everywhere: relative imports end in `.js`.
- Status rules, money formatting, contact normalization, error codes and tokens have exactly one implementation, in `packages/shared`.
- Every error response body is `{ code, message, details? }` where `code` is an `ErrorCode` from `packages/shared`.
- Business time zone is `Africa/Cairo`. Amounts are integer Egyptian pounds and always shown with Western digits.
- OTP: 6 digits, stored hashed, expires after 5 minutes, max 5 attempts, 60-second resend cooldown. Refresh tokens are stored hashed and rotated on every use.
- Never log OTP codes in production. The console OTP sender must refuse to start when `NODE_ENV=production`.
- Pin `prisma` and `@prisma/client` to exactly `7.10.0` (npm `latest` currently points to an 8.0 release candidate).
- Git commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **One owner, many phone spellings.** `01012345678`, `010 1234 5678`, `+20 10 1234 5678`, `00201012345678` and `٠١٠١٢٣٤٥٦٧٨` must all reach the same account. Pinned by `contact.test.ts` (Task 4) and the "logs in with a differently formatted phone" e2e test (Task 12).
2. **Arabic keyboard OTP.** An owner typing the code as `١٢٣٤٥٦` must be accepted. Pinned by the "accepts the code typed in Arabic-Indic digits" e2e test (Task 12).
3. **Login before signup.** An unknown number pressing "login" must get `SIGNUP_REQUIRED` without burning the code, so the signup form can reuse it. Pinned by the "unknown contact … then signs up with the same code" e2e test (Task 12).
4. **Stolen or replayed refresh token.** A refresh token that was already rotated or logged out must be rejected with `TOKEN_INVALID`. Pinned by `refresh-token.service.spec.ts` (Task 11) and `refresh-logout.e2e-spec.ts` (Task 12).
5. **Late-night due dates.** 22:30 UTC on 20 September is already 21 September in Cairo; status must use the Cairo calendar date. Pinned by `dates.test.ts` (Task 2).

---

## File Map

```
C:\dev\Lama\
├── package.json  .yarnrc.yml  .gitignore  .gitattributes  .editorconfig
├── .prettierrc.json  .prettierignore  tsconfig.base.json  README.md
├── docker-compose.yml  docker/postgres/init.sql
├── packages/shared/
│   ├── package.json  tsconfig.json  tsconfig.build.json  vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── domain/   dates.ts  invoiceStatus.ts  contact.ts  money.ts  plans.ts  (+ *.test.ts)
│       ├── types/    locale.ts  errors.ts  business.ts  auth.ts
│       ├── i18n/     index.ts  translation.ts  ar/common.ts  ar/errors.ts  en/common.ts  en/errors.ts  i18n.test.ts
│       └── tokens/   theme.ts  light.ts  dark.ts  contrast.ts  status.ts  typography.ts  layout.ts  index.ts  tokens.test.ts
└── apps/backend/
    ├── package.json  tsconfig.json  tsconfig.build.json  nest-cli.json
    ├── vitest.config.ts  vitest.config.e2e.ts  prisma.config.ts  .env.example  .env.test
    ├── prisma/schema.prisma  prisma/migrations/…
    ├── src/
    │   ├── main.ts  app.module.ts  app.setup.ts
    │   ├── config/        env.ts  env.spec.ts  config.module.ts
    │   ├── common/
    │   │   ├── errors/    app-error.ts
    │   │   ├── filters/   to-error-response.ts  to-error-response.spec.ts  app-exception.filter.ts
    │   │   ├── pipes/     validation.pipe.ts
    │   │   ├── crypto/    hash.ts  hash.spec.ts
    │   │   └── auth/      auth-core.module.ts  access-token.service.ts  access-token.service.spec.ts
    │   │                  jwt-auth.guard.ts  authenticated-request.ts  current-business-id.decorator.ts
    │   ├── infra/prisma/  prisma.service.ts  prisma.module.ts
    │   ├── modules/
    │   │   ├── health/    health.controller.ts  health.module.ts
    │   │   ├── business/  business.repository.ts  business.service.ts  business.mapper.ts
    │   │   │              business.controller.ts  business.module.ts  business.types.ts
    │   │   └── auth/      auth.module.ts  auth.controller.ts  auth.service.ts
    │   │                  normalize-target.ts  normalize-target.spec.ts
    │   │                  dto/  otp-request.dto.ts  otp-verify.dto.ts  signup-details.dto.ts  refresh-token.dto.ts
    │   │                  otp/  otp-code.ts  otp-code.spec.ts  otp-sender.ts  console-otp-sender.ts
    │   │                        otp.repository.ts  otp.service.ts  otp.service.spec.ts
    │   │                  tokens/ refresh-token.repository.ts  refresh-token.service.ts  refresh-token.service.spec.ts
    │   ├── testing/       test-env.ts  fake-otp-sender.ts  in-memory-otp.repository.ts
    │   │                  in-memory-refresh-token.repository.ts
    │   └── generated/prisma/   (generated, git-ignored)
    └── test/
        ├── setup-env.ts  global-setup.ts
        ├── support/  create-test-app.ts  reset-database.ts  factories.ts  auth-flow.ts
        ├── health.e2e-spec.ts  prisma.e2e-spec.ts
        ├── business/get-business.e2e-spec.ts
        └── auth/  signup-login.e2e-spec.ts  otp-failures.e2e-spec.ts
                   refresh-logout.e2e-spec.ts  throttle.e2e-spec.ts
```

---

### Task 1: Monorepo root and local infrastructure

**Files:**
- Create: `package.json`, `.yarnrc.yml`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `tsconfig.base.json`, `docker-compose.yml`, `docker/postgres/init.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: Yarn 4 workspaces over `apps/*` and `packages/*`; `tsconfig.base.json` that every package extends; Postgres on `localhost:5432` (user/password `lamma`/`lamma`) with databases `lamma` and `lamma_test`; Redis on `6379`; Mailpit SMTP on `1025` with UI on `8025`.

Prerequisite: Docker Desktop is installed and running (`docker version` prints a Server section). If Docker can't be used, skip the docker steps and run `npx prisma dev` later (see README in Task 13). Only `DATABASE_URL` changes.

- [ ] **Step 1: Pin Yarn 4 for the repo**

Run from `C:\dev\Lama`:

```bash
yarn set version 4.18.1
yarn -v
```

Expected: `4.18.1`. This creates `.yarnrc.yml` (with `yarnPath`) and `.yarn/releases/yarn-4.18.1.cjs`.

- [ ] **Step 2: Write the root files**

`package.json`:

```json
{
  "name": "lamma",
  "private": true,
  "packageManager": "yarn@4.18.1",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build:shared": "yarn workspace @lamma/shared build",
    "test": "yarn build:shared && yarn workspaces foreach -A run test",
    "test:e2e": "yarn build:shared && yarn workspace @lamma/backend test:e2e",
    "lint": "yarn build:shared && yarn workspaces foreach -A run lint",
    "format": "prettier --write .",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  },
  "devDependencies": {
    "prettier": "^3.9.10",
    "typescript": "~6.0.2"
  }
}
```

Append to the generated `.yarnrc.yml` (keep the `yarnPath` line Yarn wrote):

```yaml
nodeLinker: node-modules
enableTelemetry: false
```

`.gitignore`:

```gitignore
node_modules/
dist/
coverage/
*.tsbuildinfo
.env
.env.local
apps/backend/src/generated/
apps/backend/uploads/
.yarn/*
!.yarn/releases
```

`.gitattributes`:

```gitattributes
* text=auto eol=lf
*.png binary
```

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`.prettierrc.json`:

```json
{ "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

`.prettierignore`:

```
.yarn/
dist/
coverage/
lamma-design-handoff/
apps/backend/src/generated/
apps/backend/prisma/migrations/
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Write the Docker services**

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: lamma
      POSTGRES_PASSWORD: lamma
      POSTGRES_DB: lamma
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U lamma']
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  mailpit:
    image: axllent/mailpit
    ports:
      - '1025:1025'
      - '8025:8025'

volumes:
  pgdata:
```

`docker/postgres/init.sql`:

```sql
CREATE DATABASE lamma_test;
```

- [ ] **Step 4: Verify install and infrastructure**

```bash
yarn install
docker compose config -q && echo compose-ok
docker compose up -d
docker compose exec postgres psql -U lamma -lqt | cut -d '|' -f1 | grep -w lamma_test
```

Expected: install succeeds; `compose-ok`; the last command prints `lamma_test`.

- [ ] **Step 5: Commit (root files plus the design handoff as reference)**

```bash
git add package.json .yarnrc.yml .yarn/releases yarn.lock .gitignore .gitattributes .editorconfig .prettierrc.json .prettierignore tsconfig.base.json docker-compose.yml docker lamma-design-handoff
git commit -m "chore: set up yarn workspaces monorepo and local infrastructure

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Shared package scaffold and Cairo calendar dates

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/tsconfig.build.json`, `packages/shared/vitest.config.ts`, `packages/shared/src/index.ts`, `packages/shared/src/domain/dates.ts`
- Test: `packages/shared/src/domain/dates.test.ts`
- Modify: `package.json` (root — add `postinstall`)

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1).
- Produces (exported from `@lamma/shared`):
  - `BUSINESS_TIME_ZONE: 'Africa/Cairo'`
  - `type IsoDate = string` (`"YYYY-MM-DD"`)
  - `toBusinessDate(instant: Date, timeZone?: string): IsoDate`
  - `daysBetween(from: IsoDate, to: IsoDate): number` (positive when `to` is later)
  - `periodOf(date: IsoDate): string` (`"YYYY-MM"`)
  - `dueDateInPeriod(period: string, dayOfMonth: number): IsoDate` (clamped to the month's last day)

- [ ] **Step 1: Write the package files**

`packages/shared/package.json`:

```json
{
  "name": "@lamma/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vitest": "^4.1.2"
  }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

`packages/shared/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test.ts"]
}
```

`packages/shared/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

Root `package.json`: add to `"scripts"`:

```json
"postinstall": "yarn build:shared",
```

- [ ] **Step 2: Write the failing test**

`packages/shared/src/domain/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { daysBetween, dueDateInPeriod, periodOf, toBusinessDate } from './dates.js';

describe('toBusinessDate', () => {
  it('uses the Cairo calendar day, not the UTC day (summer, UTC+3)', () => {
    expect(toBusinessDate(new Date('2026-09-20T22:30:00Z'))).toBe('2026-09-21');
    expect(toBusinessDate(new Date('2026-09-20T20:30:00Z'))).toBe('2026-09-20');
  });

  it('uses the Cairo calendar day in winter (UTC+2)', () => {
    expect(toBusinessDate(new Date('2026-01-15T22:30:00Z'))).toBe('2026-01-16');
    expect(toBusinessDate(new Date('2026-01-15T21:30:00Z'))).toBe('2026-01-15');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days, negative when the target is earlier', () => {
    expect(daysBetween('2026-09-20', '2026-09-23')).toBe(3);
    expect(daysBetween('2026-09-20', '2026-09-20')).toBe(0);
    expect(daysBetween('2026-09-20', '2026-09-19')).toBe(-1);
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
  });
});

describe('periodOf', () => {
  it('returns YYYY-MM', () => {
    expect(periodOf('2026-09-20')).toBe('2026-09');
  });
});

describe('dueDateInPeriod', () => {
  it('builds the due date for a day of the month', () => {
    expect(dueDateInPeriod('2026-09', 20)).toBe('2026-09-20');
    expect(dueDateInPeriod('2026-09', 5)).toBe('2026-09-05');
  });

  it('clamps to the last day of short months', () => {
    expect(dueDateInPeriod('2026-02', 31)).toBe('2026-02-28');
    expect(dueDateInPeriod('2026-04', 31)).toBe('2026-04-30');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `./dates.js`.

- [ ] **Step 4: Write the implementation**

`packages/shared/src/domain/dates.ts`:

```ts
export const BUSINESS_TIME_ZONE = 'Africa/Cairo';

/** Calendar date in "YYYY-MM-DD" form. */
export type IsoDate = string;

const MS_PER_DAY = 86_400_000;

export function toBusinessDate(instant: Date, timeZone: string = BUSINESS_TIME_ZONE): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const diff = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(diff / MS_PER_DAY);
}

export function periodOf(date: IsoDate): string {
  return date.slice(0, 7);
}

export function dueDateInPeriod(period: string, dayOfMonth: number): IsoDate {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${period}-${String(day).padStart(2, '0')}`;
}
```

`packages/shared/src/index.ts`:

```ts
export * from './domain/dates.js';
```

- [ ] **Step 5: Run tests and build**

```bash
yarn workspace @lamma/shared test
yarn install
ls packages/shared/dist/index.js packages/shared/dist/index.d.ts
```

Expected: all `dates` tests PASS. `yarn install` runs `postinstall`, which builds `dist/`. Both files are listed.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock packages/shared
git commit -m "feat(shared): add shared package with Cairo calendar date helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Invoice status rule

**Files:**
- Create: `packages/shared/src/domain/invoiceStatus.ts`
- Test: `packages/shared/src/domain/invoiceStatus.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `IsoDate`, `daysBetween` (Task 2).
- Produces:
  - `INVOICE_STATUSES = ['paid', 'awaiting_confirmation', 'overdue', 'due_soon', 'upcoming'] as const`
  - `type InvoiceStatus = (typeof INVOICE_STATUSES)[number]`
  - `DUE_SOON_DAYS = 3`
  - `interface InvoiceStatusInput { dueDate: IsoDate; paidAt: Date | string | null; hasPendingClaim: boolean }`
  - `computeInvoiceStatus(input: InvoiceStatusInput, today: IsoDate): InvoiceStatus`. Callers pass `today = toBusinessDate(new Date())`.

- [ ] **Step 1: Write the failing test**

`packages/shared/src/domain/invoiceStatus.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeInvoiceStatus } from './invoiceStatus.js';

const today = '2026-09-20';
const open = { paidAt: null, hasPendingClaim: false };

describe('computeInvoiceStatus', () => {
  it('is paid once paidAt is set, even with a pending claim or a past due date', () => {
    const input = { dueDate: '2026-09-01', paidAt: new Date(), hasPendingClaim: true };
    expect(computeInvoiceStatus(input, today)).toBe('paid');
  });

  it('is awaiting confirmation while a claim is pending, even if overdue', () => {
    const input = { dueDate: '2026-09-10', paidAt: null, hasPendingClaim: true };
    expect(computeInvoiceStatus(input, today)).toBe('awaiting_confirmation');
  });

  it('is overdue from the day after the due date', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-19' }, today)).toBe('overdue');
  });

  it('is due soon on the due date and up to 3 days before it', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-20' }, today)).toBe('due_soon');
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-23' }, today)).toBe('due_soon');
  });

  it('is upcoming more than 3 days before the due date', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-24' }, today)).toBe('upcoming');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `./invoiceStatus.js`.

- [ ] **Step 3: Write the implementation**

`packages/shared/src/domain/invoiceStatus.ts`:

```ts
import { daysBetween, type IsoDate } from './dates.js';

export const INVOICE_STATUSES = [
  'paid',
  'awaiting_confirmation',
  'overdue',
  'due_soon',
  'upcoming',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const DUE_SOON_DAYS = 3;

export interface InvoiceStatusInput {
  dueDate: IsoDate;
  paidAt: Date | string | null;
  hasPendingClaim: boolean;
}

export function computeInvoiceStatus(input: InvoiceStatusInput, today: IsoDate): InvoiceStatus {
  if (input.paidAt) return 'paid';
  if (input.hasPendingClaim) return 'awaiting_confirmation';

  const daysLeft = daysBetween(today, input.dueDate);
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= DUE_SOON_DAYS) return 'due_soon';
  return 'upcoming';
}
```

Append to `packages/shared/src/index.ts`:

```ts
export * from './domain/invoiceStatus.js';
```

- [ ] **Step 4: Run tests**

Run: `yarn workspace @lamma/shared test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add invoice status rule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Contact normalization, money formatting and plan limits

**Files:**
- Create: `packages/shared/src/domain/contact.ts`, `packages/shared/src/domain/money.ts`, `packages/shared/src/domain/plans.ts`, `packages/shared/src/types/locale.ts`
- Test: `packages/shared/src/domain/contact.test.ts`, `packages/shared/src/domain/money.test.ts`, `packages/shared/src/domain/plans.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `LOCALES = ['ar', 'en'] as const`, `type Locale`
  - `CONTACT_CHANNELS = ['phone', 'email'] as const`, `type ContactChannel`
  - `toWesternDigits(value: string): string`
  - `normalizeEgyptianPhone(raw: string): string | null`, returning E.164 such as `+201012345678`
  - `normalizeEmail(raw: string): string | null` (trimmed, lowercased)
  - `normalizeContact(channel: ContactChannel, raw: string): string | null`
  - `CURRENCY_LABEL: Record<Locale, string>` (`ar: 'ج.م'`, `en: 'EGP'`)
  - `formatAmount(amount: number): string` (`23400 → '23,400'`)
  - `formatMoney(amount: number, locale: Locale): { amount: string; currency: string }`
  - `PLANS = ['free', 'basic', 'pro'] as const`, `type Plan`
  - `PLAN_LIMITS: Record<Plan, { maxCustomers: number; priceEgp: number; autoWhatsApp: boolean }>`
  - `canAddCustomers(plan: Plan, currentCount: number, adding: number): boolean`

- [ ] **Step 1: Write the failing tests**

`packages/shared/src/domain/contact.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  normalizeContact,
  normalizeEgyptianPhone,
  normalizeEmail,
  toWesternDigits,
} from './contact.js';

describe('toWesternDigits', () => {
  it('converts Arabic-Indic and Persian digits', () => {
    expect(toWesternDigits('٤٥٠')).toBe('450');
    expect(toWesternDigits('۴۵۰')).toBe('450');
    expect(toWesternDigits('abc 12')).toBe('abc 12');
  });
});

describe('normalizeEgyptianPhone', () => {
  it.each([
    '01012345678',
    '010 1234 5678',
    '010-1234-5678',
    '+20 10 1234 5678',
    '00201012345678',
    '201012345678',
    '٠١٠١٢٣٤٥٦٧٨',
  ])('normalizes %s to E.164', (raw) => {
    expect(normalizeEgyptianPhone(raw)).toBe('+201012345678');
  });

  it('accepts all four mobile prefixes', () => {
    for (const prefix of ['010', '011', '012', '015']) {
      expect(normalizeEgyptianPhone(`${prefix}12345678`)).toBe(`+20${prefix.slice(1)}12345678`);
    }
  });

  it.each(['0101234567', '01312345678', '012345678901', 'abc', ''])('rejects %s', (raw) => {
    expect(normalizeEgyptianPhone(raw)).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });

  it.each(['no-at-sign', 'a@b', '@example.com', 'a b@example.com'])('rejects %s', (raw) => {
    expect(normalizeEmail(raw)).toBeNull();
  });
});

describe('normalizeContact', () => {
  it('dispatches on channel', () => {
    expect(normalizeContact('phone', '01012345678')).toBe('+201012345678');
    expect(normalizeContact('email', 'A@B.co')).toBe('a@b.co');
    expect(normalizeContact('phone', 'a@b.co')).toBeNull();
  });
});
```

`packages/shared/src/domain/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatAmount, formatMoney } from './money.js';

describe('formatAmount', () => {
  it('uses Western digits with thousands separators and no decimals', () => {
    expect(formatAmount(23400)).toBe('23,400');
    expect(formatAmount(450)).toBe('450');
    expect(formatAmount(0)).toBe('0');
  });
});

describe('formatMoney', () => {
  it('returns the number and the currency label separately so UIs can size them', () => {
    expect(formatMoney(2850, 'ar')).toEqual({ amount: '2,850', currency: 'ج.م' });
    expect(formatMoney(2850, 'en')).toEqual({ amount: '2,850', currency: 'EGP' });
  });
});
```

`packages/shared/src/domain/plans.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canAddCustomers, PLAN_LIMITS } from './plans.js';

describe('plans', () => {
  it('matches the pricing in the design', () => {
    expect(PLAN_LIMITS.free).toEqual({ maxCustomers: 20, priceEgp: 0, autoWhatsApp: false });
    expect(PLAN_LIMITS.basic).toEqual({ maxCustomers: 150, priceEgp: 199, autoWhatsApp: false });
    expect(PLAN_LIMITS.pro).toEqual({ maxCustomers: 500, priceEgp: 399, autoWhatsApp: true });
  });

  it('allows adding customers up to the limit and no further', () => {
    expect(canAddCustomers('free', 19, 1)).toBe(true);
    expect(canAddCustomers('free', 20, 1)).toBe(false);
    expect(canAddCustomers('pro', 0, 500)).toBe(true);
    expect(canAddCustomers('basic', 100, 51)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `./contact.js`, `./money.js`, `./plans.js`.

- [ ] **Step 3: Write the implementations**

`packages/shared/src/types/locale.ts`:

```ts
export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
```

`packages/shared/src/domain/contact.ts`:

```ts
export const CONTACT_CHANNELS = ['phone', 'email'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
const EGYPTIAN_MOBILE = /^1[0125]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toWesternDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const index = ARABIC_INDIC.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN.indexOf(digit));
  });
}

/** Returns the number in E.164 form (+20…) or null when it is not an Egyptian mobile. */
export function normalizeEgyptianPhone(raw: string): string | null {
  let digits = toWesternDigits(raw).replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);

  if (digits.startsWith('0020')) digits = digits.slice(4);
  else if (digits.startsWith('20')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  return EGYPTIAN_MOBILE.test(digits) ? `+20${digits}` : null;
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

export function normalizeContact(channel: ContactChannel, raw: string): string | null {
  return channel === 'phone' ? normalizeEgyptianPhone(raw) : normalizeEmail(raw);
}
```

`packages/shared/src/domain/money.ts`:

```ts
import type { Locale } from '../types/locale.js';

export const CURRENCY_LABEL: Record<Locale, string> = { ar: 'ج.م', en: 'EGP' };

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Western digits with thousands separators, e.g. 23400 → "23,400". */
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}

export function formatMoney(amount: number, locale: Locale): { amount: string; currency: string } {
  return { amount: formatAmount(amount), currency: CURRENCY_LABEL[locale] };
}
```

`packages/shared/src/domain/plans.ts`:

```ts
export const PLANS = ['free', 'basic', 'pro'] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanLimits {
  maxCustomers: number;
  priceEgp: number;
  autoWhatsApp: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxCustomers: 20, priceEgp: 0, autoWhatsApp: false },
  basic: { maxCustomers: 150, priceEgp: 199, autoWhatsApp: false },
  pro: { maxCustomers: 500, priceEgp: 399, autoWhatsApp: true },
};

export function canAddCustomers(plan: Plan, currentCount: number, adding: number): boolean {
  return currentCount + adding <= PLAN_LIMITS[plan].maxCustomers;
}
```

Append to `packages/shared/src/index.ts`:

```ts
export * from './types/locale.js';
export * from './domain/contact.js';
export * from './domain/money.js';
export * from './domain/plans.js';
```

- [ ] **Step 4: Run tests**

Run: `yarn workspace @lamma/shared test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add contact normalization, money formatting and plan limits

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Shared API types, error codes and i18n resources

**Files:**
- Create: `packages/shared/src/types/errors.ts`, `packages/shared/src/types/business.ts`, `packages/shared/src/types/auth.ts`, `packages/shared/src/i18n/translation.ts`, `packages/shared/src/i18n/ar/common.ts`, `packages/shared/src/i18n/ar/errors.ts`, `packages/shared/src/i18n/en/common.ts`, `packages/shared/src/i18n/en/errors.ts`, `packages/shared/src/i18n/index.ts`
- Test: `packages/shared/src/i18n/i18n.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `Locale`, `ContactChannel`, `Plan` (Task 4); `INVOICE_STATUSES` (Task 3).
- Produces:
  - `ERROR_CODES` (const tuple) and `type ErrorCode`: `VALIDATION_FAILED | UNAUTHORIZED | TOKEN_INVALID | NOT_FOUND | OTP_INVALID | OTP_EXPIRED | OTP_TOO_MANY_ATTEMPTS | OTP_COOLDOWN | SIGNUP_REQUIRED | CONTACT_INVALID | RATE_LIMITED | PLAN_LIMIT_REACHED | INTERNAL_ERROR`
  - `interface ApiErrorBody { code: ErrorCode; message: string; details?: unknown }`
  - `BUSINESS_TYPES = ['academy', 'building', 'tutor', 'nursery', 'other'] as const`, `type BusinessType`
  - `interface BusinessDto { id; name; type: BusinessType; instapayAddress; phone: string | null; email: string | null; plan: Plan; logoUrl: string | null; area: string | null; weeklyBackup: boolean }`
  - `interface SignupDetails { businessName: string; businessType: BusinessType; instapayAddress: string }`
  - `interface OtpRequestBody { channel: ContactChannel; contact: string }`
  - `interface OtpVerifyBody extends OtpRequestBody { code: string; signup?: SignupDetails }`
  - `interface AuthTokens { accessToken: string; refreshToken: string; accessTokenExpiresIn: number }`
  - `interface AuthResponse { business: BusinessDto; tokens: AuthTokens; isNewBusiness: boolean }`
  - `resources` (`{ ar: { common, errors }, en: { common, errors } }`), `type TranslationNamespace`, `DEFAULT_LOCALE`, `isRtl(locale): boolean`

Note: translations are TypeScript modules rather than `.json` files, so the compiler checks that English has every key Arabic has. This is a small refinement of spec section 4. The content and the per-namespace layout stay the same.

- [ ] **Step 1: Write the failing test**

`packages/shared/src/i18n/i18n.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INVOICE_STATUSES } from '../domain/invoiceStatus.js';
import { BUSINESS_TYPES } from '../types/business.js';
import { ERROR_CODES } from '../types/errors.js';
import { LOCALES } from '../types/locale.js';
import { DEFAULT_LOCALE, isRtl, resources } from './index.js';

describe('i18n resources', () => {
  it.each(LOCALES)('%s has a non-empty message for every error code', (locale) => {
    for (const code of ERROR_CODES) {
      expect(resources[locale].errors[code], `${locale}.errors.${code}`).toMatch(/\S/);
    }
  });

  it.each(LOCALES)('%s labels every invoice status and business type', (locale) => {
    for (const status of INVOICE_STATUSES) {
      expect(resources[locale].common.status[status]).toMatch(/\S/);
    }
    for (const type of BUSINESS_TYPES) {
      expect(resources[locale].common.businessType[type]).toMatch(/\S/);
    }
  });

  it('uses the design copy for the four payment chips', () => {
    expect(resources.ar.common.status).toMatchObject({
      paid: 'مدفوع',
      due_soon: 'مستحق قريب',
      overdue: 'متأخر',
      awaiting_confirmation: 'في انتظار التأكيد',
    });
  });

  it('defaults to Arabic, which is right-to-left', () => {
    expect(DEFAULT_LOCALE).toBe('ar');
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `../types/business.js`.

- [ ] **Step 3: Write the types**

`packages/shared/src/types/errors.ts`:

```ts
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'TOKEN_INVALID',
  'NOT_FOUND',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_TOO_MANY_ATTEMPTS',
  'OTP_COOLDOWN',
  'SIGNUP_REQUIRED',
  'CONTACT_INVALID',
  'RATE_LIMITED',
  'PLAN_LIMIT_REACHED',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
```

`packages/shared/src/types/business.ts`:

```ts
import type { Plan } from '../domain/plans.js';

export const BUSINESS_TYPES = ['academy', 'building', 'tutor', 'nursery', 'other'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export interface BusinessDto {
  id: string;
  name: string;
  type: BusinessType;
  instapayAddress: string;
  phone: string | null;
  email: string | null;
  plan: Plan;
  logoUrl: string | null;
  area: string | null;
  weeklyBackup: boolean;
}
```

`packages/shared/src/types/auth.ts`:

```ts
import type { ContactChannel } from '../domain/contact.js';
import type { BusinessDto, BusinessType } from './business.js';

export interface SignupDetails {
  businessName: string;
  businessType: BusinessType;
  instapayAddress: string;
}

export interface OtpRequestBody {
  channel: ContactChannel;
  contact: string;
}

export interface OtpVerifyBody extends OtpRequestBody {
  code: string;
  signup?: SignupDetails;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  accessTokenExpiresIn: number;
}

export interface AuthResponse {
  business: BusinessDto;
  tokens: AuthTokens;
  isNewBusiness: boolean;
}
```

- [ ] **Step 4: Write the translations**

`packages/shared/src/i18n/translation.ts`:

```ts
/** Same keys as T, every leaf a string. Lets other locales mirror the Arabic source. */
export type TranslationShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};
```

`packages/shared/src/i18n/ar/common.ts`:

```ts
export const arCommon = {
  appName: 'لَمّة',
  currency: 'ج.م',
  status: {
    paid: 'مدفوع',
    due_soon: 'مستحق قريب',
    overdue: 'متأخر',
    awaiting_confirmation: 'في انتظار التأكيد',
    upcoming: 'مستحق',
  },
  businessType: {
    academy: 'أكاديمية',
    building: 'عمارة',
    tutor: 'مدرّس',
    nursery: 'حضانة',
    other: 'حاجة تانية',
  },
} as const;
```

`packages/shared/src/i18n/en/common.ts`:

```ts
import type { arCommon } from '../ar/common.js';
import type { TranslationShape } from '../translation.js';

export const enCommon: TranslationShape<typeof arCommon> = {
  appName: 'Lamma',
  currency: 'EGP',
  status: {
    paid: 'Paid',
    due_soon: 'Due soon',
    overdue: 'Overdue',
    awaiting_confirmation: 'Awaiting confirmation',
    upcoming: 'Upcoming',
  },
  businessType: {
    academy: 'Academy',
    building: 'Building',
    tutor: 'Tutor',
    nursery: 'Nursery',
    other: 'Other',
  },
};
```

`packages/shared/src/i18n/ar/errors.ts`:

```ts
import type { ErrorCode } from '../../types/errors.js';

export const arErrors: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'في بيانات ناقصة أو مش مظبوطة',
  UNAUTHORIZED: 'لازم تسجّل دخول الأول',
  TOKEN_INVALID: 'الجلسة خلصت، سجّل دخول تاني',
  NOT_FOUND: 'مش لاقيين اللي بتدوّر عليه',
  OTP_INVALID: 'الكود مش صح',
  OTP_EXPIRED: 'الكود خلص وقته، اطلب كود جديد',
  OTP_TOO_MANY_ATTEMPTS: 'جرّبت كتير، اطلب كود جديد',
  OTP_COOLDOWN: 'استنى دقيقة قبل ما تطلب كود تاني',
  SIGNUP_REQUIRED: 'الرقم ده مش متسجّل، اعمل حساب جديد',
  CONTACT_INVALID: 'الرقم أو الإيميل مش مظبوط',
  RATE_LIMITED: 'طلبات كتير، استنى شوية وجرّب تاني',
  PLAN_LIMIT_REACHED: 'وصلت لأقصى عدد عملاء في باقتك',
  INTERNAL_ERROR: 'حصلت مشكلة، جرّب تاني',
};
```

`packages/shared/src/i18n/en/errors.ts`:

```ts
import type { ErrorCode } from '../../types/errors.js';

export const enErrors: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some details are missing or invalid',
  UNAUTHORIZED: 'Please log in first',
  TOKEN_INVALID: 'Your session ended, please log in again',
  NOT_FOUND: "We couldn't find that",
  OTP_INVALID: 'That code is not correct',
  OTP_EXPIRED: 'The code expired, request a new one',
  OTP_TOO_MANY_ATTEMPTS: 'Too many tries, request a new code',
  OTP_COOLDOWN: 'Wait a minute before requesting another code',
  SIGNUP_REQUIRED: 'This number is not registered, create an account',
  CONTACT_INVALID: 'That phone number or email is not valid',
  RATE_LIMITED: 'Too many requests, try again shortly',
  PLAN_LIMIT_REACHED: "You've reached your plan's customer limit",
  INTERNAL_ERROR: 'Something went wrong, try again',
};
```

`packages/shared/src/i18n/index.ts`:

```ts
import type { Locale } from '../types/locale.js';
import { arCommon } from './ar/common.js';
import { arErrors } from './ar/errors.js';
import { enCommon } from './en/common.js';
import { enErrors } from './en/errors.js';

export const resources = {
  ar: { common: arCommon, errors: arErrors },
  en: { common: enCommon, errors: enErrors },
} as const;

export type TranslationNamespace = keyof (typeof resources)['ar'];

export const DEFAULT_LOCALE: Locale = 'ar';

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export type { TranslationShape } from './translation.js';
```

Append to `packages/shared/src/index.ts`:

```ts
export * from './types/errors.js';
export * from './types/business.js';
export * from './types/auth.js';
export * from './i18n/index.js';
```

- [ ] **Step 5: Run tests and type-check**

```bash
yarn workspace @lamma/shared test
yarn workspace @lamma/shared lint
```

Expected: tests PASS; `tsc` reports no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add API types, error codes and ar/en translations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Design tokens with light and dark themes

**Files:**
- Create: `packages/shared/src/tokens/theme.ts`, `light.ts`, `dark.ts`, `contrast.ts`, `status.ts`, `typography.ts`, `layout.ts`, `index.ts` (all under `packages/shared/src/tokens/`)
- Test: `packages/shared/src/tokens/tokens.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `InvoiceStatus` (Task 3).
- Produces:
  - `type ThemeName = 'light' | 'dark'`, `type StatusKey = 'paid' | 'dueSoon' | 'overdue' | 'awaiting'`
  - `interface ThemeColors` with keys `bg, surface, ink, muted, line, inputBorder, primary, primaryDark, primarySoft, primaryInk, onPrimary, gold, goldSoft, logoAccent, whatsapp, whatsappSoft, danger, dangerSoft, disabledBg, chatBg`
  - `interface Theme { name: ThemeName; colors: ThemeColors; status: Record<StatusKey, { fg: string; bg: string }> }`
  - `lightTheme`, `darkTheme`, `themes: Record<ThemeName, Theme>`
  - `statusKeyFor(status: InvoiceStatus): StatusKey | null` (`upcoming → null`)
  - `contrastRatio(a: string, b: string): number`
  - `FONT_FAMILY`, `FONT_WEIGHTS`, `TYPE_SCALE`, `type TypeVariant`, `RADIUS`, `SIZES`, `SPACING`, `BREAKPOINTS`

`primaryInk` (primary-colored text and icons) and `onPrimary` (text on primary buttons) are additions to the handoff palette. Dark mode needs a lighter teal for text than for button backgrounds.

- [ ] **Step 1: Write the failing test**

`packages/shared/src/tokens/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.js';
import { darkTheme, lightTheme, themes } from './index.js';
import { statusKeyFor } from './status.js';
import type { Theme } from './theme.js';

const AA = 4.5;

function readablePairs(theme: Theme): Array<[string, string, string]> {
  const c = theme.colors;
  return [
    ['ink on bg', c.ink, c.bg],
    ['ink on surface', c.ink, c.surface],
    ['muted on bg', c.muted, c.bg],
    ['muted on surface', c.muted, c.surface],
    ['onPrimary on primary', c.onPrimary, c.primary],
    ['onPrimary on whatsapp', c.onPrimary, c.whatsapp],
    ['primaryInk on surface', c.primaryInk, c.surface],
    ['danger on surface', c.danger, c.surface],
    ...Object.entries(theme.status).map(
      ([key, s]) => [`status ${key}`, s.fg, s.bg] as [string, string, string],
    ),
  ];
}

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#0F5E56', '#0F5E56')).toBeCloseTo(1, 5);
  });
});

describe('themes', () => {
  it('light theme uses the handoff palette', () => {
    expect(lightTheme.colors.bg).toBe('#F6F4EF');
    expect(lightTheme.colors.primary).toBe('#0F5E56');
    expect(lightTheme.status.overdue).toEqual({ fg: '#A8231B', bg: '#FBE4E1' });
  });

  it('dark and light expose exactly the same keys', () => {
    expect(Object.keys(darkTheme.colors).sort()).toEqual(Object.keys(lightTheme.colors).sort());
    expect(Object.keys(darkTheme.status).sort()).toEqual(Object.keys(lightTheme.status).sort());
  });

  it.each(Object.values(themes))('$name theme text pairs meet WCAG AA', (theme) => {
    for (const [label, fg, bg] of readablePairs(theme)) {
      expect(contrastRatio(fg, bg), `${theme.name}: ${label}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('statusKeyFor', () => {
  it('maps invoice statuses to chip colors, with no chip for upcoming', () => {
    expect(statusKeyFor('paid')).toBe('paid');
    expect(statusKeyFor('due_soon')).toBe('dueSoon');
    expect(statusKeyFor('overdue')).toBe('overdue');
    expect(statusKeyFor('awaiting_confirmation')).toBe('awaiting');
    expect(statusKeyFor('upcoming')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `./contrast.js`.

- [ ] **Step 3: Write the theme types and palettes**

`packages/shared/src/tokens/theme.ts`:

```ts
export type ThemeName = 'light' | 'dark';
export type StatusKey = 'paid' | 'dueSoon' | 'overdue' | 'awaiting';

export interface StatusColors {
  fg: string;
  bg: string;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  inputBorder: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  /** Primary-colored text and icons. */
  primaryInk: string;
  /** Text and icons on primary or WhatsApp buttons. */
  onPrimary: string;
  gold: string;
  goldSoft: string;
  logoAccent: string;
  whatsapp: string;
  whatsappSoft: string;
  danger: string;
  dangerSoft: string;
  disabledBg: string;
  chatBg: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  status: Record<StatusKey, StatusColors>;
}
```

`packages/shared/src/tokens/light.ts`:

```ts
import type { Theme } from './theme.js';

/** Values from lamma-design-handoff/design-tokens.json. */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    bg: '#F6F4EF',
    surface: '#FFFFFF',
    ink: '#1C2B2A',
    muted: '#5E6A67',
    line: '#E4DFD5',
    inputBorder: '#D6D0C4',
    primary: '#0F5E56',
    primaryDark: '#0A4540',
    primarySoft: '#E2EEEB',
    primaryInk: '#0F5E56',
    onPrimary: '#FFFFFF',
    gold: '#B7791F',
    goldSoft: '#F6ECD8',
    logoAccent: '#F3D9A4',
    whatsapp: '#177A45',
    whatsappSoft: '#DCF3E4',
    danger: '#A8231B',
    dangerSoft: '#FBE4E1',
    disabledBg: '#D9D5CC',
    chatBg: '#EFE7DC',
  },
  status: {
    paid: { fg: '#1B6B43', bg: '#E2F1E8' },
    dueSoon: { fg: '#8A5300', bg: '#FBEFD6' },
    overdue: { fg: '#A8231B', bg: '#FBE4E1' },
    awaiting: { fg: '#2A578F', bg: '#E4ECF7' },
  },
};
```

`packages/shared/src/tokens/dark.ts`:

```ts
import type { Theme } from './theme.js';

/** Derived from the brand palette; tuned for contrast on a deep teal-black background. */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    bg: '#0E1716',
    surface: '#16211F',
    ink: '#E8EEEC',
    muted: '#9AAAA6',
    line: '#2A3835',
    inputBorder: '#3A4A46',
    primary: '#1F7A70',
    primaryDark: '#16605A',
    primarySoft: '#173A36',
    primaryInk: '#6CC9BB',
    onPrimary: '#FFFFFF',
    gold: '#D9A04A',
    goldSoft: '#3A2E1A',
    logoAccent: '#6B5528',
    whatsapp: '#177A45',
    whatsappSoft: '#15301F',
    danger: '#F08A80',
    dangerSoft: '#3A1A17',
    disabledBg: '#2F3A37',
    chatBg: '#1A2321',
  },
  status: {
    paid: { fg: '#7DD3A0', bg: '#15301F' },
    dueSoon: { fg: '#F2C26B', bg: '#3A2C12' },
    overdue: { fg: '#F49A90', bg: '#3D1A17' },
    awaiting: { fg: '#93B8EC', bg: '#172A44' },
  },
};
```

- [ ] **Step 4: Write the helpers and scales**

`packages/shared/src/tokens/contrast.ts`:

```ts
function linearChannel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = linearChannel((n >> 16) & 255);
  const g = linearChannel((n >> 8) & 255);
  const b = linearChannel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two "#RRGGBB" colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
```

`packages/shared/src/tokens/status.ts`:

```ts
import type { InvoiceStatus } from '../domain/invoiceStatus.js';
import type { StatusKey } from './theme.js';

const KEY_BY_STATUS: Record<InvoiceStatus, StatusKey | null> = {
  paid: 'paid',
  due_soon: 'dueSoon',
  overdue: 'overdue',
  awaiting_confirmation: 'awaiting',
  upcoming: null,
};

export function statusKeyFor(status: InvoiceStatus): StatusKey | null {
  return KEY_BY_STATUS[status];
}
```

`packages/shared/src/tokens/typography.ts`:

```ts
export const FONT_FAMILY = 'IBM Plex Sans Arabic';
export const FONT_WEIGHTS = [400, 500, 600, 700] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

export const TYPE_SCALE = {
  display: { size: 38, weight: 700, lineHeight: 1.35 },
  screenTitle: { size: 22, weight: 700, lineHeight: 1.3 },
  section: { size: 18, weight: 700, lineHeight: 1.4 },
  body: { size: 16, weight: 400, lineHeight: 1.7 },
  caption: { size: 13, weight: 500, lineHeight: 1.5 },
} as const;

export type TypeVariant = keyof typeof TYPE_SCALE;
```

`packages/shared/src/tokens/layout.ts`:

```ts
export const RADIUS = { chip: 999, button: 14, input: 14, card: 18, cardLarge: 22, iconTile: 14 } as const;

export const SIZES = {
  buttonPrimary: 56,
  buttonSecondary: 52,
  minTapTarget: 44,
  input: 56,
  bottomNav: 72,
  avatar: 40,
} as const;

export const SPACING = { screenPaddingX: 16, stackGap: 14, cardPadding: 16 } as const;

export const BREAKPOINTS = { mobile: 375, desktop: 1280 } as const;
```

`packages/shared/src/tokens/index.ts`:

```ts
import { darkTheme } from './dark.js';
import { lightTheme } from './light.js';
import type { Theme, ThemeName } from './theme.js';

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };

export { lightTheme, darkTheme };
export * from './theme.js';
export * from './contrast.js';
export * from './status.js';
export * from './typography.js';
export * from './layout.js';
```

Append to `packages/shared/src/index.ts`:

```ts
export * from './tokens/index.js';
```

- [ ] **Step 5: Run tests, type-check and build**

```bash
yarn workspace @lamma/shared test
yarn workspace @lamma/shared lint
yarn build:shared
```

Expected: all PASS. If a contrast assertion fails, adjust only that dark-theme value until it reaches ≥ 4.5 and note the change in the commit message.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add design tokens with light and dark themes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Backend scaffold — config, error contract, health

**Files:**
- Create: `apps/backend/package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `.env.example`, `.env.test`
- Create: `apps/backend/src/main.ts`, `src/app.module.ts`, `src/app.setup.ts`, `src/config/env.ts`, `src/config/config.module.ts`, `src/common/errors/app-error.ts`, `src/common/filters/to-error-response.ts`, `src/common/filters/app-exception.filter.ts`, `src/common/pipes/validation.pipe.ts`, `src/modules/health/health.controller.ts`, `src/modules/health/health.module.ts`, `src/testing/test-env.ts`
- Create: `apps/backend/test/setup-env.ts`, `test/support/create-test-app.ts`
- Test: `src/config/env.spec.ts`, `src/common/filters/to-error-response.spec.ts`, `test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: `ErrorCode`, `ApiErrorBody` from `@lamma/shared`.
- Produces:
  - `ENV` (injection token, `Symbol('ENV')`), `type Env`, `parseEnv(source: Record<string, string | undefined>): Env`. Fields: `NODE_ENV, PORT, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL_SECONDS, REFRESH_TTL_DAYS, OTP_SECRET, OTP_TTL_SECONDS, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS`
  - `ConfigModule` (global, provides `ENV`)
  - `class AppError extends Error { code: ErrorCode; details?: unknown; status: number }` — `new AppError(code, message?, details?)`
  - `toErrorResponse(exception: unknown): { status: number; body: ApiErrorBody }`
  - `configureApp(app: INestApplication): void` — prefix `api/v1`, validation pipe, error filter, CORS
  - `testEnv(overrides?): Env` for unit tests
  - `createTestApp(): Promise<TestApp>` with `TestApp { app; api(): supertest agent }` (extended in Tasks 8 and 12)

- [ ] **Step 1: Write the package files**

`apps/backend/package.json`:

```json
{
  "name": "@lamma/backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "test": "vitest run",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@lamma/shared": "workspace:^",
    "@nestjs/common": "^12.0.1",
    "@nestjs/core": "^12.0.1",
    "@nestjs/platform-express": "^12.0.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "dotenv": "^18.0.7",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@nestjs/cli": "^12.0.8",
    "@nestjs/schematics": "^12.0.6",
    "@nestjs/testing": "^12.0.1",
    "@types/express": "^5.0.6",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.2.1",
    "supertest": "^7.3.1",
    "typescript": "~6.0.2",
    "vitest": "^4.1.2"
  }
}
```

`apps/backend/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "resolvePackageJsonExports": true,
    "strictPropertyInitialization": false,
    "types": ["node"]
  },
  "include": ["src", "test", "*.config.ts", "*.config.e2e.ts"]
}
```

`apps/backend/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "rootDir": "src" },
  "include": ["src"],
  "exclude": ["src/**/*.spec.ts", "src/testing"]
}
```

`apps/backend/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "tsConfigPath": "tsconfig.build.json" }
}
```

`apps/backend/vitest.config.ts` (the alias makes tests use the shared source, so they never run against a stale `dist/`):

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const sharedSrc = fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: { alias: { '@lamma/shared': sharedSrc } },
  test: { root: './', include: ['src/**/*.spec.ts'] },
});
```

`apps/backend/vitest.config.e2e.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const sharedSrc = fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: { alias: { '@lamma/shared': sharedSrc } },
  test: {
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup-env.ts'],
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
```

`apps/backend/.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://lamma:lamma@localhost:5432/lamma?schema=public
JWT_ACCESS_SECRET=replace-with-a-random-string-of-32-chars-or-more
JWT_ACCESS_TTL_SECONDS=900
REFRESH_TTL_DAYS=30
OTP_SECRET=replace-with-another-random-string-of-32-chars
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
```

`apps/backend/.env.test` (committed; test-only values):

```dotenv
NODE_ENV=test
PORT=0
DATABASE_URL=postgresql://lamma:lamma@localhost:5432/lamma_test?schema=public
JWT_ACCESS_SECRET=test-access-secret-0123456789abcdef0123
OTP_SECRET=test-otp-secret-0123456789abcdef01234567
```

Then run `yarn install` from the repo root.

- [ ] **Step 2: Write the failing unit tests**

`apps/backend/src/config/env.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  OTP_SECRET: 'b'.repeat(32),
};

describe('parseEnv', () => {
  it('applies defaults for optional values', () => {
    const env = parseEnv(valid);
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TTL_DAYS: 30,
      OTP_TTL_SECONDS: 300,
      OTP_MAX_ATTEMPTS: 5,
      OTP_RESEND_COOLDOWN_SECONDS: 60,
    });
  });

  it('coerces numeric strings', () => {
    expect(parseEnv({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('names every missing variable in the error', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL.*JWT_ACCESS_SECRET.*OTP_SECRET/);
  });

  it('rejects short secrets', () => {
    expect(() => parseEnv({ ...valid, OTP_SECRET: 'short' })).toThrow(/OTP_SECRET/);
  });
});
```

`apps/backend/src/common/filters/to-error-response.spec.ts`:

```ts
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { toErrorResponse } from './to-error-response.js';

describe('toErrorResponse', () => {
  it('maps AppError to its status and code, keeping details', () => {
    const result = toErrorResponse(new AppError('OTP_COOLDOWN', 'wait', { seconds: 60 }));
    expect(result).toEqual({
      status: 429,
      body: { code: 'OTP_COOLDOWN', message: 'wait', details: { seconds: 60 } },
    });
  });

  it('maps Nest HTTP exceptions to stable codes', () => {
    expect(toErrorResponse(new NotFoundException()).body.code).toBe('NOT_FOUND');
    expect(toErrorResponse(new BadRequestException()).body.code).toBe('VALIDATION_FAILED');
    expect(toErrorResponse(new HttpException('slow down', 429))).toMatchObject({
      status: 429,
      body: { code: 'RATE_LIMITED' },
    });
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    const result = toErrorResponse(new Error('db password is hunter2'));
    expect(result).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — cannot resolve `./env.js` and `../errors/app-error.js`.

- [ ] **Step 4: Write config and error handling**

`apps/backend/src/config/env.ts`:

```ts
import { z } from 'zod';

export const ENV = Symbol('ENV');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().nonnegative().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return result.data;
}
```

`apps/backend/src/config/config.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { ENV, parseEnv } from './env.js';

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => parseEnv(process.env) }],
  exports: [ENV],
})
export class ConfigModule {}
```

`apps/backend/src/common/errors/app-error.ts`:

```ts
import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@lamma/shared';

const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  OTP_INVALID: HttpStatus.BAD_REQUEST,
  OTP_EXPIRED: HttpStatus.BAD_REQUEST,
  OTP_TOO_MANY_ATTEMPTS: HttpStatus.TOO_MANY_REQUESTS,
  OTP_COOLDOWN: HttpStatus.TOO_MANY_REQUESTS,
  SIGNUP_REQUIRED: HttpStatus.NOT_FOUND,
  CONTACT_INVALID: HttpStatus.BAD_REQUEST,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  PLAN_LIMIT_REACHED: HttpStatus.FORBIDDEN,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** The only error type services throw. Clients translate `code`; `message` is for logs. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? code);
  }

  get status(): HttpStatus {
    return STATUS_BY_CODE[this.code];
  }
}
```

`apps/backend/src/common/filters/to-error-response.ts`:

```ts
import { HttpException } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@lamma/shared';
import { AppError } from '../errors/app-error.js';

export interface ErrorResponse {
  status: number;
  body: ApiErrorBody;
}

function codeForHttpStatus(status: number): ErrorCode {
  if (status === 400) return 'VALIDATION_FAILED';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    const { code, message, details } = exception;
    return { status: exception.status, body: { code, message, details } };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return { status, body: { code: codeForHttpStatus(status), message: exception.message } };
  }
  return { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
}
```

Note: in the `AppError` case, `details` may be `undefined`. The spec's `toEqual` ignores undefined properties, and JSON drops them.

`apps/backend/src/common/filters/app-exception.filter.ts`:

```ts
import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { toErrorResponse } from './to-error-response.js';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) this.logger.error(exception);
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
```

`apps/backend/src/common/pipes/validation.pipe.ts`:

```ts
import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';

export interface FieldError {
  field: string;
  constraints: string[];
}

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, constraints: Object.keys(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new AppError('VALIDATION_FAILED', 'Validation failed', flatten(errors)),
  });
}
```

- [ ] **Step 5: Run unit tests**

Run: `yarn workspace @lamma/backend test`
Expected: PASS.

- [ ] **Step 6: Write the failing e2e test and harness**

`apps/backend/test/setup-env.ts`:

```ts
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });
```

`apps/backend/test/support/create-test-app.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

export interface TestApp {
  app: INestApplication<App>;
  api: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return { app, api: () => request(app.getHttpServer()) };
}
```

`apps/backend/test/health.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/create-test-app.js';

describe('health and error contract (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    const res = await t.api().get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes use the error contract', async () => {
    const res = await t.api().get('/api/v1/does-not-exist').expect(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND' });
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e`
Expected: FAIL — cannot resolve `../../src/app.module.js`.

- [ ] **Step 7: Write the app, setup and health module**

`apps/backend/src/modules/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
```

`apps/backend/src/modules/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

`apps/backend/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [ConfigModule, HealthModule],
})
export class AppModule {}
```

`apps/backend/src/app.setup.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';

/** Shared by main.ts and e2e tests so both run the exact same pipeline. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableCors();
}
```

`apps/backend/src/main.ts`:

```ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { ENV, type Env } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(app.get<Env>(ENV).PORT);
}

await bootstrap();
```

`apps/backend/src/testing/test-env.ts`:

```ts
import { parseEnv, type Env } from '../config/env.js';

/** A valid Env for unit tests; override only what a test cares about. */
export function testEnv(overrides: Record<string, string> = {}): Env {
  return parseEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://lamma:lamma@localhost:5432/unused',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    OTP_SECRET: 'b'.repeat(32),
    ...overrides,
  });
}
```

- [ ] **Step 8: Run all backend tests, type-check and build**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn workspace @lamma/backend lint
yarn workspace @lamma/backend build
```

Expected: unit and e2e tests PASS; no type errors; `apps/backend/dist/main.js` exists.

- [ ] **Step 9: Commit**

```bash
git add apps/backend yarn.lock
git commit -m "feat(backend): scaffold NestJS app with env config and error contract

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Prisma schema, database module and test database harness

**Files:**
- Create: `apps/backend/prisma/schema.prisma`, `apps/backend/prisma.config.ts`, `apps/backend/src/infra/prisma/prisma.service.ts`, `apps/backend/src/infra/prisma/prisma.module.ts`, `apps/backend/test/global-setup.ts`, `apps/backend/test/support/reset-database.ts`, `apps/backend/test/support/factories.ts`
- Create (generated): `apps/backend/prisma/migrations/<timestamp>_init/migration.sql`
- Modify: `apps/backend/package.json`, `apps/backend/src/app.module.ts`, `apps/backend/vitest.config.e2e.ts`, `apps/backend/test/support/create-test-app.ts`
- Test: `apps/backend/test/prisma.e2e-spec.ts`

**Interfaces:**
- Consumes: `ENV`, `Env` (Task 7).
- Produces:
  - `PrismaService` (extends the generated `PrismaClient`, global via `PrismaModule`)
  - Generated client at `src/generated/prisma/client.js`, exporting model types `Business`, `OtpCode`, `RefreshToken`, etc.
  - `resetDatabase(prisma: PrismaService): Promise<void>` truncates every table
  - `createBusiness(prisma, overrides?: Partial<Prisma.BusinessCreateInput>): Promise<Business>`
  - `TestApp` gains `prisma: PrismaService`; `createTestApp()` resets the DB before returning

- [ ] **Step 1: Add dependencies and scripts**

```bash
yarn workspace @lamma/backend add @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg@^8.23.1
yarn workspace @lamma/backend add -D prisma@7.10.0 @types/pg@^8.23.1
```

In `apps/backend/package.json` `"scripts"` add:

```json
"postinstall": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:deploy": "prisma migrate deploy",
```

- [ ] **Step 2: Write the Prisma config and schema**

`apps/backend/prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

`apps/backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum BusinessType {
  academy
  building
  tutor
  nursery
  other
}

enum Plan {
  free
  basic
  pro
}

enum ContactChannel {
  phone
  email
}

enum Gender {
  male
  female
}

enum ChargeKind {
  monthly
  one_time
}

enum PaymentMethod {
  instapay
  cash
}

enum ReminderKind {
  before
  on_due
  after
  promise
  manual
}

enum ReminderChannel {
  whatsapp_link
  whatsapp_api
}

enum ClaimStatus {
  pending
  confirmed
  rejected
}

enum ClaimVerdict {
  all_match
  amount_differs
  duplicate
  unreadable
  needs_review
}

enum ImportKind {
  notebook
  excel
}

enum ImportStatus {
  processing
  ready
  failed
}

model Business {
  id                     String        @id @default(cuid())
  name                   String
  type                   BusinessType
  instapayAddress        String
  phone                  String?       @unique
  email                  String?       @unique
  plan                   Plan          @default(free)
  logoUrl                String?
  area                   String?
  weeklyBackup           Boolean       @default(false)
  planUpgradeRequestedAt DateTime?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt
  customers              Customer[]
  charges                Charge[]
  invoices               Invoice[]
  reminderRule           ReminderRule?
  refreshTokens          RefreshToken[]
  importJobs             ImportJob[]
}

model OtpCode {
  id         String         @id @default(cuid())
  channel    ContactChannel
  target     String
  codeHash   String
  expiresAt  DateTime
  attempts   Int            @default(0)
  consumedAt DateTime?
  createdAt  DateTime       @default(now())

  @@index([target, createdAt])
}

model RefreshToken {
  id         String    @id @default(cuid())
  businessId String
  business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  tokenHash  String    @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())

  @@index([businessId])
}

model Customer {
  id          String             @id @default(cuid())
  businessId  String
  business    Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  phone       String
  note        String?
  gender      Gender?
  archivedAt  DateTime?
  createdAt   DateTime           @default(now())
  assignments ChargeAssignment[]
  invoices    Invoice[]

  @@index([businessId])
}

model Charge {
  id          String             @id @default(cuid())
  businessId  String
  business    Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  kind        ChargeKind
  title       String
  amount      Int
  dayOfMonth  Int?
  dueDate     DateTime?          @db.Date
  active      Boolean            @default(true)
  createdAt   DateTime           @default(now())
  assignments ChargeAssignment[]
  invoices    Invoice[]

  @@index([businessId])
}

model ChargeAssignment {
  chargeId   String
  customerId String
  charge     Charge   @relation(fields: [chargeId], references: [id], onDelete: Cascade)
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@id([chargeId, customerId])
}

model Invoice {
  id           String         @id @default(cuid())
  businessId   String
  business     Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  chargeId     String
  charge       Charge         @relation(fields: [chargeId], references: [id], onDelete: Cascade)
  customerId   String
  customer     Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  period       String?
  title        String
  amount       Int
  dueDate      DateTime       @db.Date
  paidAt       DateTime?
  publicToken  String         @unique
  promisedDate DateTime?      @db.Date
  createdAt    DateTime       @default(now())
  payments     Payment[]
  claims       PaymentClaim[]
  reminderLogs ReminderLog[]

  @@unique([chargeId, customerId, period])
  @@index([businessId, dueDate])
}

model Payment {
  id         String        @id @default(cuid())
  invoiceId  String
  invoice    Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount     Int
  method     PaymentMethod
  claimId    String?       @unique
  claim      PaymentClaim? @relation(fields: [claimId], references: [id])
  recordedAt DateTime      @default(now())
}

model ReminderRule {
  businessId String   @id
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  beforeDays Int?     @default(3)
  onDueDate  Boolean  @default(true)
  afterDays  Int?     @default(3)
}

model ReminderLog {
  id        String          @id @default(cuid())
  invoiceId String
  invoice   Invoice         @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  kind      ReminderKind
  channel   ReminderChannel
  sentAt    DateTime        @default(now())

  @@index([invoiceId, sentAt])
}

model PaymentClaim {
  id                 String       @id @default(cuid())
  invoiceId          String
  invoice            Invoice      @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  screenshotKey      String
  status             ClaimStatus  @default(pending)
  extractedAmount    Int?
  extractedDate      DateTime?    @db.Date
  transactionId      String?
  recipient          String?
  rawText            String
  checkAmount        Boolean
  checkDate          Boolean
  checkRecipient     Boolean
  duplicateOfClaimId String?
  verdict            ClaimVerdict
  decidedAt          DateTime?
  createdAt          DateTime     @default(now())
  payment            Payment?

  @@index([transactionId])
  @@index([invoiceId, status])
}

model ImportJob {
  id         String       @id @default(cuid())
  businessId String
  business   Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  kind       ImportKind
  status     ImportStatus @default(processing)
  rows       Json         @default("[]")
  error      String?
  createdAt  DateTime     @default(now())
}
```

Note: the reminder kind is named `on_due` rather than the spec's `on`, to avoid a keyword clash in generated code.

- [ ] **Step 3: Generate the client and create the first migration**

```bash
cp apps/backend/.env.example apps/backend/.env
yarn workspace @lamma/backend prisma generate
yarn workspace @lamma/backend db:migrate --name init
ls apps/backend/prisma/migrations
```

Expected: the client is generated into `src/generated/prisma`; a folder `<timestamp>_init` containing `migration.sql` is created and applied to the `lamma` database.

- [ ] **Step 4: Write the failing e2e test**

`apps/backend/test/prisma.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/create-test-app.js';
import { createBusiness } from './support/factories.js';

describe('database (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('stores a business with its default reminder rule', async () => {
    const business = await createBusiness(t.prisma, { reminderRule: { create: {} } });
    const rule = await t.prisma.reminderRule.findUniqueOrThrow({
      where: { businessId: business.id },
    });
    expect(rule).toMatchObject({ beforeDays: 3, onDueDate: true, afterDays: 3 });
    expect(business.plan).toBe('free');
  });

  it('starts every test from an empty database', async () => {
    expect(await t.prisma.business.count()).toBe(0);
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e`
Expected: FAIL — cannot resolve `./support/factories.js`.

- [ ] **Step 5: Write the Prisma module and test support**

`apps/backend/src/infra/prisma/prisma.service.ts`:

```ts
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV, type Env } from '../../config/env.js';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

`apps/backend/src/infra/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

`apps/backend/src/app.module.ts` (replace the whole file):

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule],
})
export class AppModule {}
```

`apps/backend/test/global-setup.ts` (applies migrations to `lamma_test`; never resets or drops anything):

```ts
import { execSync } from 'node:child_process';
import { config } from 'dotenv';

export default function setup(): void {
  config({ path: '.env.test', override: true, quiet: true });
  execSync('yarn prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
```

In `apps/backend/vitest.config.e2e.ts`, add inside `test`:

```ts
    globalSetup: ['./test/global-setup.ts'],
```

`apps/backend/test/support/reset-database.ts`:

```ts
import type { PrismaService } from '../../src/infra/prisma/prisma.service.js';

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const tables = rows.map((row) => `"public"."${row.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables} CASCADE`);
}
```

`apps/backend/test/support/factories.ts`:

```ts
import type { Business, Prisma } from '../../src/generated/prisma/client.js';
import type { PrismaService } from '../../src/infra/prisma/prisma.service.js';

export function createBusiness(
  prisma: PrismaService,
  overrides: Partial<Prisma.BusinessCreateInput> = {},
): Promise<Business> {
  return prisma.business.create({
    data: {
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      ...overrides,
    },
  });
}
```

`apps/backend/test/support/create-test-app.ts` (replace the whole file):

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/infra/prisma/prisma.service.js';
import { resetDatabase } from './reset-database.js';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  api: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma, api: () => request(app.getHttpServer()) };
}
```

- [ ] **Step 6: Run all backend tests and type-check**

```bash
yarn workspace @lamma/backend test:e2e
yarn workspace @lamma/backend test
yarn workspace @lamma/backend lint
```

Expected: global setup applies the `init` migration to `lamma_test`; all tests PASS; no type errors.

- [ ] **Step 7: Commit**

```bash
git add apps/backend yarn.lock
git commit -m "feat(backend): add Prisma schema, database module and test DB harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Access tokens, auth guard and `GET /business`

**Files:**
- Create: `apps/backend/src/common/crypto/hash.ts`, `src/common/auth/auth-core.module.ts`, `src/common/auth/access-token.service.ts`, `src/common/auth/jwt-auth.guard.ts`, `src/common/auth/authenticated-request.ts`, `src/common/auth/current-business-id.decorator.ts`
- Create: `src/modules/business/business.types.ts`, `business.repository.ts`, `business.service.ts`, `business.mapper.ts`, `business.controller.ts`, `business.module.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `src/common/crypto/hash.spec.ts`, `src/common/auth/access-token.service.spec.ts`, `test/business/get-business.e2e-spec.ts`

**Interfaces:**
- Consumes: `ENV`/`Env`, `AppError` (Task 7); `PrismaService`, `createBusiness` (Task 8); `BusinessDto`, `ContactChannel`, `BusinessType` from `@lamma/shared`.
- Produces:
  - `sha256(value: string): string` (hex), `hmacSha256(secret: string, value: string): string` (hex), `safeEqualHex(a: string, b: string): boolean`
  - `AccessTokenService.sign(businessId: string): string`, `.verify(token: string): { sub: string }` (throws `AppError('TOKEN_INVALID')`), `.ttlSeconds: number`
  - `JwtAuthGuard` (throws `UNAUTHORIZED` when the header is missing, `TOKEN_INVALID` when the token is bad); `@CurrentBusinessId()` param decorator returns `string`
  - `AuthCoreModule` (global; exports `AccessTokenService`, `JwtAuthGuard`)
  - `interface NewBusinessInput { channel: ContactChannel; contact: string; businessName: string; businessType: BusinessType; instapayAddress: string }`
  - `BusinessService.findByContact(channel, contact): Promise<Business | null>`, `.create(input: NewBusinessInput): Promise<Business>` (also creates the default reminder rule), `.getById(id): Promise<Business>` (throws `NOT_FOUND`)
  - `toBusinessDto(business: Business): BusinessDto`
  - `BusinessModule` exports `BusinessService`
  - `GET /api/v1/business` (JWT) → `BusinessDto`

- [ ] **Step 1: Add the JWT dependency**

```bash
yarn workspace @lamma/backend add @nestjs/jwt@^12.0.2
```

- [ ] **Step 2: Write the failing unit tests**

`apps/backend/src/common/crypto/hash.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hmacSha256, safeEqualHex, sha256 } from './hash.js';

describe('hash helpers', () => {
  it('sha256 is deterministic hex', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hmacSha256 depends on the secret', () => {
    expect(hmacSha256('k1', 'v')).not.toBe(hmacSha256('k2', 'v'));
    expect(hmacSha256('k1', 'v')).toBe(hmacSha256('k1', 'v'));
  });

  it('safeEqualHex compares without throwing on length mismatch', () => {
    expect(safeEqualHex('abcd', 'abcd')).toBe(true);
    expect(safeEqualHex('abcd', 'abce')).toBe(false);
    expect(safeEqualHex('abcd', 'ab')).toBe(false);
  });
});
```

`apps/backend/src/common/auth/access-token.service.spec.ts`:

```ts
import { JwtService } from '@nestjs/jwt';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testEnv } from '../../testing/test-env.js';
import { AccessTokenService } from './access-token.service.js';

const service = new AccessTokenService(new JwtService(), testEnv());

describe('AccessTokenService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips the business id', () => {
    expect(service.verify(service.sign('biz_1')).sub).toBe('biz_1');
  });

  it('rejects tampered tokens with TOKEN_INVALID', () => {
    const token = service.sign('biz_1');
    expect(() => service.verify(`${token}x`)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });

  it('rejects tokens signed with another secret', () => {
    const other = new AccessTokenService(new JwtService(), testEnv({ JWT_ACCESS_SECRET: 'z'.repeat(32) }));
    expect(() => service.verify(other.sign('biz_1'))).toThrow(
      expect.objectContaining({ code: 'TOKEN_INVALID' }),
    );
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'));
    const token = service.sign('biz_1');
    vi.setSystemTime(new Date('2026-09-20T10:16:00Z'));
    expect(() => service.verify(token)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });
});
```

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — cannot resolve `./hash.js` and `./access-token.service.js`.

- [ ] **Step 3: Write the crypto helpers and access-token service**

`apps/backend/src/common/crypto/hash.ts`:

```ts
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmacSha256(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
```

`apps/backend/src/common/auth/access-token.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENV, type Env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

export interface AccessTokenPayload {
  sub: string;
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  get ttlSeconds(): number {
    return this.env.JWT_ACCESS_TTL_SECONDS;
  }

  sign(businessId: string): string {
    const payload: AccessTokenPayload = { sub: businessId };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.env.JWT_ACCESS_TTL_SECONDS,
    });
  }

  verify(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, { secret: this.env.JWT_ACCESS_SECRET });
    } catch {
      throw new AppError('TOKEN_INVALID', 'Access token is invalid or expired');
    }
  }
}
```

Run: `yarn workspace @lamma/backend test`
Expected: PASS.

- [ ] **Step 4: Write the guard, decorator and core module**

`apps/backend/src/common/auth/authenticated-request.ts`:

```ts
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { businessId: string };
```

`apps/backend/src/common/auth/jwt-auth.guard.ts`:

```ts
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';
import { AccessTokenService } from './access-token.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

function extractBearer(header: string | undefined): string | null {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearer(request.headers.authorization);
    if (!token) throw new AppError('UNAUTHORIZED', 'Missing bearer token');
    request.businessId = this.accessTokens.verify(token).sub;
    return true;
  }
}
```

`apps/backend/src/common/auth/current-business-id.decorator.ts`:

```ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-request.js';

/** The business id of the authenticated owner. Use only behind JwtAuthGuard. */
export const CurrentBusinessId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().businessId,
);
```

`apps/backend/src/common/auth/auth-core.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenService } from './access-token.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [AccessTokenService, JwtAuthGuard],
  exports: [AccessTokenService, JwtAuthGuard],
})
export class AuthCoreModule {}
```

- [ ] **Step 5: Write the failing e2e test**

`apps/backend/test/business/get-business.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../../src/common/auth/access-token.service.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness } from '../support/factories.js';

describe('GET /api/v1/business (e2e)', () => {
  let t: TestApp;
  let tokens: AccessTokenService;

  beforeEach(async () => {
    t = await createTestApp();
    tokens = t.app.get(AccessTokenService);
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('returns 401 UNAUTHORIZED without a token', async () => {
    const res = await t.api().get('/api/v1/business').expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 TOKEN_INVALID for a garbage token', async () => {
    const res = await t.api().get('/api/v1/business').set('Authorization', 'Bearer nope').expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it("returns the owner's business", async () => {
    const business = await createBusiness(t.prisma);
    const res = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${tokens.sign(business.id)}`)
      .expect(200);
    expect(res.body).toEqual({
      id: business.id,
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      email: null,
      plan: 'free',
      logoUrl: null,
      area: null,
      weeklyBackup: false,
    });
  });

  it('returns 404 NOT_FOUND when the business no longer exists', async () => {
    const res = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${tokens.sign('missing-id')}`)
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e`
Expected: FAIL — `AccessTokenService` is not registered (AuthCoreModule isn't imported yet), so `t.app.get` throws.

- [ ] **Step 6: Write the business module**

`apps/backend/src/modules/business/business.types.ts`:

```ts
import type { BusinessType, ContactChannel } from '@lamma/shared';

export interface NewBusinessInput {
  channel: ContactChannel;
  /** Already normalized (E.164 phone or lowercased email). */
  contact: string;
  businessName: string;
  businessType: BusinessType;
  instapayAddress: string;
}
```

`apps/backend/src/modules/business/business.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import type { Business } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Business | null> {
    return this.prisma.business.findUnique({ where: { id } });
  }

  findByContact(channel: ContactChannel, contact: string): Promise<Business | null> {
    const where = channel === 'phone' ? { phone: contact } : { email: contact };
    return this.prisma.business.findUnique({ where });
  }

  createWithDefaultRule(input: NewBusinessInput): Promise<Business> {
    return this.prisma.business.create({
      data: {
        name: input.businessName,
        type: input.businessType,
        instapayAddress: input.instapayAddress,
        phone: input.channel === 'phone' ? input.contact : null,
        email: input.channel === 'email' ? input.contact : null,
        reminderRule: { create: {} },
      },
    });
  }
}
```

`apps/backend/src/modules/business/business.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';
import type { Business } from '../../generated/prisma/client.js';
import { BusinessRepository } from './business.repository.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessService {
  constructor(private readonly businesses: BusinessRepository) {}

  findByContact(channel: ContactChannel, contact: string): Promise<Business | null> {
    return this.businesses.findByContact(channel, contact);
  }

  create(input: NewBusinessInput): Promise<Business> {
    return this.businesses.createWithDefaultRule(input);
  }

  async getById(id: string): Promise<Business> {
    const business = await this.businesses.findById(id);
    if (!business) throw new AppError('NOT_FOUND', 'Business not found');
    return business;
  }
}
```

`apps/backend/src/modules/business/business.mapper.ts`:

```ts
import type { BusinessDto } from '@lamma/shared';
import type { Business } from '../../generated/prisma/client.js';

export function toBusinessDto(business: Business): BusinessDto {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    instapayAddress: business.instapayAddress,
    phone: business.phone,
    email: business.email,
    plan: business.plan,
    logoUrl: business.logoUrl,
    area: business.area,
    weeklyBackup: business.weeklyBackup,
  };
}
```

`apps/backend/src/modules/business/business.controller.ts`:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { BusinessDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toBusinessDto } from './business.mapper.js';
import { BusinessService } from './business.service.js';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get()
  async get(@CurrentBusinessId() businessId: string): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.getById(businessId));
  }
}
```

`apps/backend/src/modules/business/business.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller.js';
import { BusinessRepository } from './business.repository.js';
import { BusinessService } from './business.service.js';

@Module({
  controllers: [BusinessController],
  providers: [BusinessRepository, BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
```

`apps/backend/src/app.module.ts` (replace the whole file):

```ts
import { Module } from '@nestjs/common';
import { AuthCoreModule } from './common/auth/auth-core.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, AuthCoreModule, HealthModule, BusinessModule],
})
export class AppModule {}
```

- [ ] **Step 7: Run all backend tests and type-check**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn workspace @lamma/backend lint
```

Expected: all PASS; no type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/backend yarn.lock
git commit -m "feat(backend): add access tokens, auth guard and GET /business

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: OTP codes — generation, storage and verification

**Files:**
- Create: `apps/backend/src/modules/auth/otp/otp-code.ts`, `otp-sender.ts`, `console-otp-sender.ts`, `otp.repository.ts`, `otp.service.ts`
- Create: `apps/backend/src/testing/fake-otp-sender.ts`, `apps/backend/src/testing/in-memory-otp.repository.ts`
- Test: `src/modules/auth/otp/otp-code.spec.ts`, `src/modules/auth/otp/otp.service.spec.ts`

**Interfaces:**
- Consumes: `hmacSha256`, `safeEqualHex` (Task 9); `ENV`/`Env`, `AppError`, `testEnv` (Task 7); `PrismaService`, `OtpCode` model (Task 8); `ContactChannel` from `@lamma/shared`.
- Produces:
  - `OTP_LENGTH = 6`, `generateOtpCode(): string`, `hashOtpCode(code: string, target: string, secret: string): string`
  - `abstract class OtpSender { abstract send(channel: ContactChannel, target: string, code: string): Promise<void> }`
  - `ConsoleOtpSender extends OtpSender`
  - `interface NewOtp { channel: ContactChannel; target: string; codeHash: string; expiresAt: Date; createdAt: Date }`
  - `OtpRepository`: `create(data: NewOtp)`, `findLatest(target)`, `invalidateOpen(target, now)`, `incrementAttempts(id)`, `consume(id, now): Promise<number>`
  - `OtpService.request(channel, target, now?): Promise<void>` — throws `OTP_COOLDOWN`
  - `OtpService.check(target, code, now?): Promise<string>` — returns the OTP id; throws `OTP_INVALID | OTP_EXPIRED | OTP_TOO_MANY_ATTEMPTS`; does **not** consume
  - `OtpService.consume(otpId, now?): Promise<void>` — throws `OTP_INVALID` if already consumed
  - `FakeOtpSender` with `lastCodeFor(target): string` (used by unit and e2e tests)

`target` is always an already-normalized contact.

- [ ] **Step 1: Write the failing tests**

`apps/backend/src/modules/auth/otp/otp-code.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateOtpCode, hashOtpCode, OTP_LENGTH } from './otp-code.js';

describe('otp code', () => {
  it('generates 6 digits, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
    }
  });

  it('hash is bound to the target and the secret', () => {
    const base = hashOtpCode('123456', '+201012345678', 's'.repeat(32));
    expect(hashOtpCode('123456', '+201012345678', 's'.repeat(32))).toBe(base);
    expect(hashOtpCode('123456', '+201112345678', 's'.repeat(32))).not.toBe(base);
    expect(hashOtpCode('123456', '+201012345678', 't'.repeat(32))).not.toBe(base);
    expect(base).not.toContain('123456');
  });
});
```

`apps/backend/src/modules/auth/otp/otp.service.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { FakeOtpSender } from '../../../testing/fake-otp-sender.js';
import { InMemoryOtpRepository } from '../../../testing/in-memory-otp.repository.js';
import { testEnv } from '../../../testing/test-env.js';
import type { OtpRepository } from './otp.repository.js';
import { OtpService } from './otp.service.js';

const target = '+201012345678';
const t0 = new Date('2026-09-20T10:00:00Z');
const after = (seconds: number) => new Date(t0.getTime() + seconds * 1000);
const code = (error: string) => expect.objectContaining({ code: error });

describe('OtpService', () => {
  let repo: InMemoryOtpRepository;
  let sender: FakeOtpSender;
  let service: OtpService;

  beforeEach(() => {
    repo = new InMemoryOtpRepository();
    sender = new FakeOtpSender();
    service = new OtpService(repo as unknown as OtpRepository, sender, testEnv());
  });

  it('sends a code and stores only its hash', async () => {
    await service.request('phone', target, t0);
    const sent = sender.lastCodeFor(target);
    expect(sent).toMatch(/^\d{6}$/);
    expect(repo.records[0].codeHash).not.toContain(sent);
  });

  it('accepts the right code and refuses it once consumed', async () => {
    await service.request('phone', target, t0);
    const id = await service.check(target, sender.lastCodeFor(target), after(10));
    await service.consume(id, after(10));
    await expect(service.check(target, sender.lastCodeFor(target), after(11))).rejects.toThrow(
      code('OTP_INVALID'),
    );
    await expect(service.consume(id, after(12))).rejects.toThrow(code('OTP_INVALID'));
  });

  it('rejects a wrong code without consuming the right one', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    await expect(service.check(target, wrong, after(5))).rejects.toThrow(code('OTP_INVALID'));
    await expect(service.check(target, right, after(6))).resolves.toEqual(expect.any(String));
  });

  it('expires codes after OTP_TTL_SECONDS', async () => {
    await service.request('phone', target, t0);
    await expect(service.check(target, sender.lastCodeFor(target), after(300))).rejects.toThrow(
      code('OTP_EXPIRED'),
    );
  });

  it('locks the code after 5 wrong attempts, even for the right code', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await expect(service.check(target, wrong, after(i + 1))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, right, after(10))).rejects.toThrow(
      code('OTP_TOO_MANY_ATTEMPTS'),
    );
  });

  it('enforces the resend cooldown and invalidates the previous code', async () => {
    await service.request('phone', target, t0);
    const first = sender.lastCodeFor(target);
    await expect(service.request('phone', target, after(30))).rejects.toThrow(code('OTP_COOLDOWN'));

    await service.request('phone', target, after(60));
    const second = sender.lastCodeFor(target);
    if (first !== second) {
      await expect(service.check(target, first, after(61))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, second, after(61))).resolves.toEqual(expect.any(String));
  });

  it('rejects checks when no code was ever requested', async () => {
    await expect(service.check(target, '123456', t0)).rejects.toThrow(code('OTP_INVALID'));
  });
});
```

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — cannot resolve `./otp-code.js`.

- [ ] **Step 2: Write the OTP code helpers and sender contract**

`apps/backend/src/modules/auth/otp/otp-code.ts`:

```ts
import { randomInt } from 'node:crypto';
import { hmacSha256 } from '../../../common/crypto/hash.js';

export const OTP_LENGTH = 6;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

/** Bound to the target so a leaked hash can't be replayed for another contact. */
export function hashOtpCode(code: string, target: string, secret: string): string {
  return hmacSha256(secret, `${target}:${code}`);
}
```

`apps/backend/src/modules/auth/otp/otp-sender.ts`:

```ts
import type { ContactChannel } from '@lamma/shared';

/** Delivers an OTP code over SMS, WhatsApp or email. */
export abstract class OtpSender {
  abstract send(channel: ContactChannel, target: string, code: string): Promise<void>;
}
```

`apps/backend/src/modules/auth/otp/console-otp-sender.ts`:

```ts
import { Logger } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { OtpSender } from './otp-sender.js';

/** Development only: prints the code to the server log. */
export class ConsoleOtpSender extends OtpSender {
  private readonly logger = new Logger('OTP');

  async send(channel: ContactChannel, target: string, code: string): Promise<void> {
    this.logger.log(`[${channel}] ${target} → ${code}`);
  }
}
```

`apps/backend/src/testing/fake-otp-sender.ts`:

```ts
import type { ContactChannel } from '@lamma/shared';
import { OtpSender } from '../modules/auth/otp/otp-sender.js';

export class FakeOtpSender extends OtpSender {
  private readonly codes = new Map<string, string>();

  async send(_channel: ContactChannel, target: string, code: string): Promise<void> {
    this.codes.set(target, code);
  }

  lastCodeFor(target: string): string {
    const code = this.codes.get(target);
    if (!code) throw new Error(`No OTP was sent to ${target}`);
    return code;
  }
}
```

- [ ] **Step 3: Write the repository and its in-memory fake**

`apps/backend/src/modules/auth/otp/otp.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import type { OtpCode } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';

export interface NewOtp {
  channel: ContactChannel;
  target: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewOtp): Promise<OtpCode> {
    return this.prisma.otpCode.create({ data });
  }

  findLatest(target: string): Promise<OtpCode | null> {
    return this.prisma.otpCode.findFirst({ where: { target }, orderBy: { createdAt: 'desc' } });
  }

  async invalidateOpen(target: string, now: Date): Promise<void> {
    await this.prisma.otpCode.updateMany({
      where: { target, consumedAt: null },
      data: { consumedAt: now },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  /** Returns 1 when this call consumed the code, 0 when it was already consumed. */
  async consume(id: string, now: Date): Promise<number> {
    const { count } = await this.prisma.otpCode.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: now },
    });
    return count;
  }
}
```

`apps/backend/src/testing/in-memory-otp.repository.ts`:

```ts
import type { OtpCode } from '../generated/prisma/client.js';
import type { NewOtp } from '../modules/auth/otp/otp.repository.js';

/** Same contract as OtpRepository, backed by an array. */
export class InMemoryOtpRepository {
  readonly records: OtpCode[] = [];

  async create(data: NewOtp): Promise<OtpCode> {
    const record: OtpCode = { id: `otp_${this.records.length + 1}`, attempts: 0, consumedAt: null, ...data };
    this.records.push(record);
    return record;
  }

  async findLatest(target: string): Promise<OtpCode | null> {
    const matches = this.records.filter((r) => r.target === target);
    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  }

  async invalidateOpen(target: string, now: Date): Promise<void> {
    for (const r of this.records) if (r.target === target && !r.consumedAt) r.consumedAt = now;
  }

  async incrementAttempts(id: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record) record.attempts += 1;
  }

  async consume(id: string, now: Date): Promise<number> {
    const record = this.records.find((r) => r.id === id && !r.consumedAt);
    if (!record) return 0;
    record.consumedAt = now;
    return 1;
  }
}
```

- [ ] **Step 4: Write the OTP service**

`apps/backend/src/modules/auth/otp/otp.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { safeEqualHex } from '../../../common/crypto/hash.js';
import { AppError } from '../../../common/errors/app-error.js';
import { ENV, type Env } from '../../../config/env.js';
import { generateOtpCode, hashOtpCode } from './otp-code.js';
import { OtpRepository } from './otp.repository.js';
import { OtpSender } from './otp-sender.js';

@Injectable()
export class OtpService {
  constructor(
    private readonly otps: OtpRepository,
    private readonly sender: OtpSender,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async request(channel: ContactChannel, target: string, now = new Date()): Promise<void> {
    const latest = await this.otps.findLatest(target);
    const cooldownMs = this.env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (latest && now.getTime() - latest.createdAt.getTime() < cooldownMs) {
      throw new AppError('OTP_COOLDOWN', 'Code requested too recently');
    }

    await this.otps.invalidateOpen(target, now);
    const code = generateOtpCode();
    await this.otps.create({
      channel,
      target,
      codeHash: hashOtpCode(code, target, this.env.OTP_SECRET),
      expiresAt: new Date(now.getTime() + this.env.OTP_TTL_SECONDS * 1000),
      createdAt: now,
    });
    await this.sender.send(channel, target, code);
  }

  /** Validates the code without consuming it; returns the OTP id to consume later. */
  async check(target: string, code: string, now = new Date()): Promise<string> {
    const latest = await this.otps.findLatest(target);
    if (!latest || latest.consumedAt) throw new AppError('OTP_INVALID', 'No active code');
    if (latest.expiresAt <= now) throw new AppError('OTP_EXPIRED', 'Code expired');
    if (latest.attempts >= this.env.OTP_MAX_ATTEMPTS) {
      throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many attempts');
    }

    const candidate = hashOtpCode(code, target, this.env.OTP_SECRET);
    if (!safeEqualHex(latest.codeHash, candidate)) {
      await this.otps.incrementAttempts(latest.id);
      throw new AppError('OTP_INVALID', 'Wrong code');
    }
    return latest.id;
  }

  async consume(otpId: string, now = new Date()): Promise<void> {
    const consumed = await this.otps.consume(otpId, now);
    if (consumed === 0) throw new AppError('OTP_INVALID', 'Code already used');
  }
}
```

- [ ] **Step 5: Run unit tests and type-check**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend lint
```

Expected: PASS; no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src
git commit -m "feat(backend): add OTP generation, storage and verification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Refresh tokens with rotation

**Files:**
- Create: `apps/backend/src/modules/auth/tokens/refresh-token.repository.ts`, `refresh-token.service.ts`, `apps/backend/src/testing/in-memory-refresh-token.repository.ts`
- Test: `apps/backend/src/modules/auth/tokens/refresh-token.service.spec.ts`

**Interfaces:**
- Consumes: `sha256` (Task 9); `ENV`/`Env`, `AppError`, `testEnv` (Task 7); `PrismaService`, `RefreshToken` model (Task 8).
- Produces:
  - `RefreshTokenRepository`: `create(businessId, tokenHash, expiresAt)`, `findActiveByHash(tokenHash, now)`, `revoke(id, now): Promise<number>`, `revokeByHash(tokenHash, now): Promise<void>`
  - `RefreshTokenService.issue(businessId, now?): Promise<string>` (opaque base64url token)
  - `RefreshTokenService.rotate(token, now?): Promise<{ businessId: string; refreshToken: string }>` — throws `TOKEN_INVALID` for unknown, revoked or expired tokens
  - `RefreshTokenService.revoke(token, now?): Promise<void>` — idempotent

- [ ] **Step 1: Write the failing test**

`apps/backend/src/modules/auth/tokens/refresh-token.service.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryRefreshTokenRepository } from '../../../testing/in-memory-refresh-token.repository.js';
import { testEnv } from '../../../testing/test-env.js';
import type { RefreshTokenRepository } from './refresh-token.repository.js';
import { RefreshTokenService } from './refresh-token.service.js';

const t0 = new Date('2026-09-20T10:00:00Z');
const days = (n: number) => new Date(t0.getTime() + n * 86_400_000);
const invalid = expect.objectContaining({ code: 'TOKEN_INVALID' });

describe('RefreshTokenService', () => {
  let repo: InMemoryRefreshTokenRepository;
  let service: RefreshTokenService;

  beforeEach(() => {
    repo = new InMemoryRefreshTokenRepository();
    service = new RefreshTokenService(repo as unknown as RefreshTokenRepository, testEnv());
  });

  it('stores only a hash of the issued token', async () => {
    const token = await service.issue('biz_1', t0);
    expect(token.length).toBeGreaterThanOrEqual(64);
    expect(repo.records[0].tokenHash).not.toBe(token);
  });

  it('rotates: returns a new token and the old one stops working', async () => {
    const first = await service.issue('biz_1', t0);
    const rotated = await service.rotate(first, days(1));
    expect(rotated.businessId).toBe('biz_1');
    expect(rotated.refreshToken).not.toBe(first);
    await expect(service.rotate(first, days(1))).rejects.toThrow(invalid);
    await expect(service.rotate(rotated.refreshToken, days(2))).resolves.toMatchObject({
      businessId: 'biz_1',
    });
  });

  it('rejects tokens past REFRESH_TTL_DAYS', async () => {
    const token = await service.issue('biz_1', t0);
    await expect(service.rotate(token, days(31))).rejects.toThrow(invalid);
  });

  it('rejects revoked tokens; revoking twice is harmless', async () => {
    const token = await service.issue('biz_1', t0);
    await service.revoke(token, days(1));
    await service.revoke(token, days(1));
    await expect(service.rotate(token, days(1))).rejects.toThrow(invalid);
  });

  it('rejects unknown tokens', async () => {
    await expect(service.rotate('not-a-real-token', t0)).rejects.toThrow(invalid);
  });
});
```

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — cannot resolve `../../../testing/in-memory-refresh-token.repository.js`.

- [ ] **Step 2: Write the repository and its fake**

`apps/backend/src/modules/auth/tokens/refresh-token.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { RefreshToken } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(businessId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { businessId, tokenHash, expiresAt } });
  }

  findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    });
  }

  /** Returns 1 when this call revoked the token, 0 when it was already revoked. */
  async revoke(id: string, now: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now },
    });
    return count;
  }

  async revokeByHash(tokenHash: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
```

`apps/backend/src/testing/in-memory-refresh-token.repository.ts`:

```ts
import type { RefreshToken } from '../generated/prisma/client.js';

/** Same contract as RefreshTokenRepository, backed by an array. */
export class InMemoryRefreshTokenRepository {
  readonly records: RefreshToken[] = [];

  async create(businessId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const record: RefreshToken = {
      id: `rt_${this.records.length + 1}`,
      businessId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  async findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    return (
      this.records.find((r) => r.tokenHash === tokenHash && !r.revokedAt && r.expiresAt > now) ??
      null
    );
  }

  async revoke(id: string, now: Date): Promise<number> {
    const record = this.records.find((r) => r.id === id && !r.revokedAt);
    if (!record) return 0;
    record.revokedAt = now;
    return 1;
  }

  async revokeByHash(tokenHash: string, now: Date): Promise<void> {
    for (const r of this.records) if (r.tokenHash === tokenHash && !r.revokedAt) r.revokedAt = now;
  }
}
```

- [ ] **Step 3: Write the service**

`apps/backend/src/modules/auth/tokens/refresh-token.service.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../common/crypto/hash.js';
import { AppError } from '../../../common/errors/app-error.js';
import { ENV, type Env } from '../../../config/env.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly tokens: RefreshTokenRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async issue(businessId: string, now = new Date()): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(now.getTime() + this.env.REFRESH_TTL_DAYS * MS_PER_DAY);
    await this.tokens.create(businessId, sha256(token), expiresAt);
    return token;
  }

  async rotate(token: string, now = new Date()): Promise<{ businessId: string; refreshToken: string }> {
    const record = await this.tokens.findActiveByHash(sha256(token), now);
    if (!record) throw new AppError('TOKEN_INVALID', 'Refresh token is invalid');

    // A concurrent rotation of the same token revokes it first; only one caller wins.
    const revoked = await this.tokens.revoke(record.id, now);
    if (revoked === 0) throw new AppError('TOKEN_INVALID', 'Refresh token already used');

    return { businessId: record.businessId, refreshToken: await this.issue(record.businessId, now) };
  }

  async revoke(token: string, now = new Date()): Promise<void> {
    await this.tokens.revokeByHash(sha256(token), now);
  }
}
```

- [ ] **Step 4: Run unit tests and type-check**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend lint
```

Expected: PASS; no type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src
git commit -m "feat(backend): add rotating refresh tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Auth API — OTP request/verify, signup, refresh, logout

**Files:**
- Create: `apps/backend/src/modules/auth/normalize-target.ts`, `dto/otp-request.dto.ts`, `dto/signup-details.dto.ts`, `dto/otp-verify.dto.ts`, `dto/refresh-token.dto.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.module.ts` (all under `apps/backend/src/modules/auth/`)
- Create: `apps/backend/test/support/auth-flow.ts`
- Modify: `apps/backend/src/app.module.ts`, `apps/backend/test/support/create-test-app.ts`
- Test: `src/modules/auth/normalize-target.spec.ts`, `test/auth/signup-login.e2e-spec.ts`, `test/auth/otp-failures.e2e-spec.ts`, `test/auth/refresh-logout.e2e-spec.ts`, `test/auth/throttle.e2e-spec.ts`

**Interfaces:**
- Consumes: `OtpService`, `OtpRepository`, `OtpSender`, `ConsoleOtpSender`, `FakeOtpSender` (Task 10); `RefreshTokenService`, `RefreshTokenRepository` (Task 11); `AccessTokenService`, `BusinessService`, `toBusinessDto`, `BusinessModule` (Task 9); `normalizeContact`, `toWesternDigits`, `CONTACT_CHANNELS`, `BUSINESS_TYPES`, `AuthResponse`, `AuthTokens`, `ContactChannel` from `@lamma/shared`.
- Produces:
  - `POST /api/v1/auth/otp/request` `{ channel, contact }` → `204`
  - `POST /api/v1/auth/otp/verify` `{ channel, contact, code, signup? }` → `200 AuthResponse`; an unknown contact without `signup` → `404 SIGNUP_REQUIRED` and the code stays valid
  - `POST /api/v1/auth/refresh` `{ refreshToken }` → `200 AuthTokens`
  - `POST /api/v1/auth/logout` `{ refreshToken }` → `204`
  - Auth routes are rate limited to 10 requests per minute per IP (`429 RATE_LIMITED`)
  - `normalizeTarget(channel, raw): string` (throws `CONTACT_INVALID`)
  - `TestApp` gains `otpSender: FakeOtpSender`
  - Test helpers `requestCode`, `verify`, `signUp`, `allowNewCode`, `OWNER_PHONE`, `OWNER_PHONE_E164`, `SIGNUP`

- [ ] **Step 1: Add the throttler dependency**

```bash
yarn workspace @lamma/backend add @nestjs/throttler@^6.7.1
```

- [ ] **Step 2: Write the failing unit test for target normalization**

`apps/backend/src/modules/auth/normalize-target.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeTarget } from './normalize-target.js';

describe('normalizeTarget', () => {
  it('returns the normalized contact', () => {
    expect(normalizeTarget('phone', '010 1234 5678')).toBe('+201012345678');
    expect(normalizeTarget('email', ' A@B.co ')).toBe('a@b.co');
  });

  it('throws CONTACT_INVALID for unusable input', () => {
    expect(() => normalizeTarget('phone', '12345')).toThrow(
      expect.objectContaining({ code: 'CONTACT_INVALID' }),
    );
  });
});
```

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — cannot resolve `./normalize-target.js`.

- [ ] **Step 3: Write normalize-target and the DTOs**

`apps/backend/src/modules/auth/normalize-target.ts`:

```ts
import { type ContactChannel, normalizeContact } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';

export function normalizeTarget(channel: ContactChannel, raw: string): string {
  const target = normalizeContact(channel, raw);
  if (!target) throw new AppError('CONTACT_INVALID', `Invalid ${channel}`);
  return target;
}
```

`apps/backend/src/modules/auth/dto/otp-request.dto.ts`:

```ts
import { CONTACT_CHANNELS, type ContactChannel, type OtpRequestBody } from '@lamma/shared';
import { IsIn, IsString, MaxLength } from 'class-validator';

export class OtpRequestDto implements OtpRequestBody {
  @IsIn([...CONTACT_CHANNELS])
  channel: ContactChannel;

  @IsString()
  @MaxLength(254)
  contact: string;
}
```

`apps/backend/src/modules/auth/dto/signup-details.dto.ts`:

```ts
import { BUSINESS_TYPES, type BusinessType, type SignupDetails } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SignupDetailsDto implements SignupDetails {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  businessName: string;

  @IsIn([...BUSINESS_TYPES])
  businessType: BusinessType;

  @Transform(trim)
  @IsString()
  @Length(3, 120)
  instapayAddress: string;
}
```

`apps/backend/src/modules/auth/dto/otp-verify.dto.ts`:

```ts
import { type OtpVerifyBody, toWesternDigits } from '@lamma/shared';
import { Transform, Type } from 'class-transformer';
import { IsOptional, Matches, ValidateNested } from 'class-validator';
import { OtpRequestDto } from './otp-request.dto.js';
import { SignupDetailsDto } from './signup-details.dto.js';

export class OtpVerifyDto extends OtpRequestDto implements OtpVerifyBody {
  /** Owners on an Arabic keyboard type ١٢٣٤٥٦; accept it as 123456. */
  @Transform(({ value }) => (typeof value === 'string' ? toWesternDigits(value.trim()) : value))
  @Matches(/^\d{6}$/)
  code: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SignupDetailsDto)
  signup?: SignupDetailsDto;
}
```

`apps/backend/src/modules/auth/dto/refresh-token.dto.ts`:

```ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
```

Run: `yarn workspace @lamma/backend test`
Expected: PASS.

- [ ] **Step 4: Write the e2e helpers and failing e2e tests**

`apps/backend/test/support/create-test-app.ts` (replace the whole file — adds the fake OTP sender):

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/infra/prisma/prisma.service.js';
import { OtpSender } from '../../src/modules/auth/otp/otp-sender.js';
import { FakeOtpSender } from '../../src/testing/fake-otp-sender.js';
import { resetDatabase } from './reset-database.js';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  otpSender: FakeOtpSender;
  api: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const otpSender = new FakeOtpSender();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(OtpSender)
    .useValue(otpSender)
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma, otpSender, api: () => request(app.getHttpServer()) };
}
```

`apps/backend/test/support/auth-flow.ts`:

```ts
import { type AuthResponse, type ContactChannel, normalizeContact } from '@lamma/shared';
import type { TestApp } from './create-test-app.js';

export const OWNER_PHONE = '01012345678';
export const OWNER_PHONE_E164 = '+201012345678';
export const SIGNUP = {
  businessName: 'أكاديمية النجوم للكرة',
  businessType: 'academy',
  instapayAddress: 'nogoum.academy@instapay',
} as const;

export async function requestCode(t: TestApp, contact = OWNER_PHONE, channel: ContactChannel = 'phone') {
  await t.api().post('/api/v1/auth/otp/request').send({ channel, contact }).expect(204);
  const target = normalizeContact(channel, contact);
  if (!target) throw new Error(`Test used an invalid contact: ${contact}`);
  return t.otpSender.lastCodeFor(target);
}

export function verify(t: TestApp, body: Record<string, unknown>) {
  return t.api().post('/api/v1/auth/otp/verify').send({ channel: 'phone', ...body });
}

export async function signUp(t: TestApp, contact = OWNER_PHONE): Promise<AuthResponse> {
  const code = await requestCode(t, contact);
  const res = await verify(t, { contact, code, signup: SIGNUP }).expect(200);
  return res.body as AuthResponse;
}

/** Moves existing codes into the past so a new code can be requested without waiting. */
export async function allowNewCode(t: TestApp): Promise<void> {
  await t.prisma.otpCode.updateMany({ data: { createdAt: new Date(Date.now() - 10 * 60_000) } });
}
```

`apps/backend/test/auth/signup-login.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import {
  allowNewCode,
  OWNER_PHONE,
  OWNER_PHONE_E164,
  requestCode,
  SIGNUP,
  signUp,
  verify,
} from '../support/auth-flow.js';

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

describe('signup and login (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('signs up a new owner with a normalized phone and a default reminder rule', async () => {
    const result = await signUp(t);
    expect(result.isNewBusiness).toBe(true);
    expect(result.business).toMatchObject({
      name: SIGNUP.businessName,
      type: 'academy',
      phone: OWNER_PHONE_E164,
      plan: 'free',
    });
    expect(result.tokens.accessTokenExpiresIn).toBe(900);
    const rule = await t.prisma.reminderRule.findUnique({ where: { businessId: result.business.id } });
    expect(rule).not.toBeNull();

    const me = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${result.tokens.accessToken}`)
      .expect(200);
    expect(me.body.id).toBe(result.business.id);
  });

  it('logs in with a differently formatted phone and returns the same business', async () => {
    const { business } = await signUp(t);
    for (const spelling of ['+20 10 1234 5678', '٠١٠١٢٣٤٥٦٧٨']) {
      await allowNewCode(t);
      const code = await requestCode(t, spelling);
      const res = await verify(t, { contact: spelling, code }).expect(200);
      expect(res.body).toMatchObject({ isNewBusiness: false, business: { id: business.id } });
    }
  });

  it('accepts the code typed in Arabic-Indic digits', async () => {
    const code = await requestCode(t);
    await verify(t, { contact: OWNER_PHONE, code: toArabicDigits(code), signup: SIGNUP }).expect(200);
  });

  it('asks an unknown contact to sign up, then signs up with the same code', async () => {
    const code = await requestCode(t);
    const login = await verify(t, { contact: OWNER_PHONE, code }).expect(404);
    expect(login.body.code).toBe('SIGNUP_REQUIRED');

    const signup = await verify(t, { contact: OWNER_PHONE, code, signup: SIGNUP }).expect(200);
    expect(signup.body.isNewBusiness).toBe(true);
  });

  it('logs an existing owner in even when signup details are sent, without changing the business', async () => {
    const { business } = await signUp(t);
    await allowNewCode(t);
    const code = await requestCode(t);
    const res = await verify(t, {
      contact: OWNER_PHONE,
      code,
      signup: { ...SIGNUP, businessName: 'اسم تاني' },
    }).expect(200);
    expect(res.body).toMatchObject({ isNewBusiness: false, business: { name: business.name } });
  });

  it('treats emails case-insensitively', async () => {
    const code = await requestCode(t, 'Owner@Example.COM', 'email');
    const signup = await t
      .api()
      .post('/api/v1/auth/otp/verify')
      .send({ channel: 'email', contact: 'Owner@Example.COM', code, signup: SIGNUP })
      .expect(200);
    expect(signup.body.business.email).toBe('owner@example.com');

    await allowNewCode(t);
    const again = await requestCode(t, 'owner@example.com', 'email');
    const login = await t
      .api()
      .post('/api/v1/auth/otp/verify')
      .send({ channel: 'email', contact: 'owner@example.com', code: again })
      .expect(200);
    expect(login.body.business.id).toBe(signup.body.business.id);
  });
});
```

`apps/backend/test/auth/otp-failures.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { OWNER_PHONE, requestCode, SIGNUP, verify } from '../support/auth-flow.js';

describe('OTP failures (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('rejects a phone that is not an Egyptian mobile', async () => {
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: '0123' })
      .expect(400);
    expect(res.body.code).toBe('CONTACT_INVALID');
  });

  it('reports which fields failed validation', async () => {
    const res = await t.api().post('/api/v1/auth/otp/request').send({ contact: OWNER_PHONE }).expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'channel' })]));
  });

  it('rejects an invalid business type inside signup', async () => {
    const code = await requestCode(t);
    const res = await verify(t, {
      contact: OWNER_PHONE,
      code,
      signup: { ...SIGNUP, businessType: 'bakery' },
    }).expect(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'signup.businessType' })]),
    );
  });

  it('rejects a wrong code', async () => {
    const code = await requestCode(t);
    const wrong = code === '000000' ? '111111' : '000000';
    const res = await verify(t, { contact: OWNER_PHONE, code: wrong, signup: SIGNUP }).expect(400);
    expect(res.body.code).toBe('OTP_INVALID');
  });

  it('enforces the resend cooldown', async () => {
    await requestCode(t);
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: OWNER_PHONE })
      .expect(429);
    expect(res.body.code).toBe('OTP_COOLDOWN');
  });

  it('refuses to reuse a code after a successful verify', async () => {
    const code = await requestCode(t);
    await verify(t, { contact: OWNER_PHONE, code, signup: SIGNUP }).expect(200);
    const res = await verify(t, { contact: OWNER_PHONE, code }).expect(400);
    expect(res.body.code).toBe('OTP_INVALID');
  });
});
```

`apps/backend/test/auth/refresh-logout.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { signUp } from '../support/auth-flow.js';

describe('refresh and logout (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  const refresh = (refreshToken: string) =>
    t.api().post('/api/v1/auth/refresh').send({ refreshToken });

  it('rotates tokens and rejects the old refresh token', async () => {
    const { tokens } = await signUp(t);
    const res = await refresh(tokens.refreshToken).expect(200);
    expect(res.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      accessTokenExpiresIn: 900,
    });
    expect(res.body.refreshToken).not.toBe(tokens.refreshToken);

    const reuse = await refresh(tokens.refreshToken).expect(401);
    expect(reuse.body.code).toBe('TOKEN_INVALID');
    await refresh(res.body.refreshToken).expect(200);
  });

  it('logout revokes the refresh token', async () => {
    const { tokens } = await signUp(t);
    await t.api().post('/api/v1/auth/logout').send({ refreshToken: tokens.refreshToken }).expect(204);
    const res = await refresh(tokens.refreshToken).expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an unknown refresh token', async () => {
    const res = await refresh('garbage').expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
});
```

`apps/backend/test/auth/throttle.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';

describe('auth rate limit (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('allows 10 requests a minute per IP, then returns RATE_LIMITED', async () => {
    for (let i = 0; i < 10; i++) {
      const contact = `010${String(10_000_000 + i)}`;
      await t.api().post('/api/v1/auth/otp/request').send({ channel: 'phone', contact }).expect(204);
    }
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: '01099999999' })
      .expect(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e`
Expected: FAIL — `OtpSender` has no provider to override yet, and the auth routes return 404.

- [ ] **Step 5: Write the auth service, controller and module**

`apps/backend/src/modules/auth/auth.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { AuthResponse, AuthTokens } from '@lamma/shared';
import { AccessTokenService } from '../../common/auth/access-token.service.js';
import { AppError } from '../../common/errors/app-error.js';
import { toBusinessDto } from '../business/business.mapper.js';
import { BusinessService } from '../business/business.service.js';
import type { OtpRequestDto } from './dto/otp-request.dto.js';
import type { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { normalizeTarget } from './normalize-target.js';
import { OtpService } from './otp/otp.service.js';
import { RefreshTokenService } from './tokens/refresh-token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly businesses: BusinessService,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async requestOtp(dto: OtpRequestDto): Promise<void> {
    await this.otp.request(dto.channel, normalizeTarget(dto.channel, dto.contact));
  }

  async verifyOtp(dto: OtpVerifyDto): Promise<AuthResponse> {
    const contact = normalizeTarget(dto.channel, dto.contact);
    const otpId = await this.otp.check(contact, dto.code);

    const existing = await this.businesses.findByContact(dto.channel, contact);
    // Checked before consuming so the login screen can hand the same code to signup.
    if (!existing && !dto.signup) throw new AppError('SIGNUP_REQUIRED', 'No account for contact');
    await this.otp.consume(otpId);

    const business =
      existing ?? (await this.businesses.create({ channel: dto.channel, contact, ...dto.signup! }));
    return {
      business: toBusinessDto(business),
      tokens: await this.issueTokens(business.id),
      isNewBusiness: !existing,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const rotated = await this.refreshTokens.rotate(refreshToken);
    return this.tokensFor(rotated.businessId, rotated.refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(refreshToken);
  }

  private async issueTokens(businessId: string): Promise<AuthTokens> {
    return this.tokensFor(businessId, await this.refreshTokens.issue(businessId));
  }

  private tokensFor(businessId: string, refreshToken: string): AuthTokens {
    return {
      accessToken: this.accessTokens.sign(businessId),
      refreshToken,
      accessTokenExpiresIn: this.accessTokens.ttlSeconds,
    };
  }
}
```

(`dto.signup!` is safe here: the line above throws when both `existing` and `dto.signup` are missing.)

`apps/backend/src/modules/auth/auth.controller.ts`:

```ts
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthResponse, AuthTokens } from '@lamma/shared';
import { AuthService } from './auth.service.js';
import { OtpRequestDto } from './dto/otp-request.dto.js';
import { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  @HttpCode(204)
  async requestOtp(@Body() dto: OtpRequestDto): Promise<void> {
    await this.auth.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() dto: OtpVerifyDto): Promise<AuthResponse> {
    return this.auth.verifyOtp(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}
```

`apps/backend/src/modules/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { BusinessModule } from '../business/business.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ConsoleOtpSender } from './otp/console-otp-sender.js';
import { OtpRepository } from './otp/otp.repository.js';
import { OtpSender } from './otp/otp-sender.js';
import { OtpService } from './otp/otp.service.js';
import { RefreshTokenRepository } from './tokens/refresh-token.repository.js';
import { RefreshTokenService } from './tokens/refresh-token.service.js';

function createOtpSender(env: Env): OtpSender {
  if (env.NODE_ENV === 'production') {
    throw new Error('No production OtpSender is configured; refusing to log OTP codes');
  }
  return new ConsoleOtpSender();
}

@Module({
  imports: [BusinessModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    OtpRepository,
    RefreshTokenService,
    RefreshTokenRepository,
    { provide: OtpSender, useFactory: createOtpSender, inject: [ENV] },
  ],
})
export class AuthModule {}
```

`apps/backend/src/app.module.ts` (replace the whole file):

```ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthCoreModule } from './common/auth/auth-core.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthCoreModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    HealthModule,
    BusinessModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run all backend tests and type-check**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn workspace @lamma/backend lint
```

Expected: all PASS; no type errors. If the throttle test fails because `ThrottlerException` reaches the filter without a 429 status, check `toErrorResponse`. `ThrottlerException` extends `HttpException` with status 429, so it should map to `RATE_LIMITED` with no extra branch.

- [ ] **Step 7: Commit**

```bash
git add apps/backend yarn.lock
git commit -m "feat(backend): add OTP signup/login, token refresh and logout endpoints

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Developer README and full verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: every root and backend script from Tasks 1–12.
- Produces: setup documentation; a verified green build.

- [ ] **Step 1: Write the README**

`README.md`:

````markdown
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

**No Docker?** Run `npx prisma dev` inside `apps/backend` and use the connection string it prints as `DATABASE_URL` in `.env` and `.env.test`.

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
````

- [ ] **Step 2: Run the full verification from a clean state**

```bash
yarn install
yarn lint
yarn test
yarn test:e2e
yarn workspace @lamma/backend build
```

Expected: every command succeeds. `yarn test` runs the shared and backend unit suites; `yarn test:e2e` runs all backend e2e files.

- [ ] **Step 3: Smoke test the running server**

```bash
yarn workspace @lamma/backend db:deploy
yarn workspace @lamma/backend start:dev
```

In a second terminal:

```bash
curl -s http://localhost:3000/api/v1/health
curl -s -X POST http://localhost:3000/api/v1/auth/otp/request -H 'content-type: application/json' -d '{"channel":"phone","contact":"01012345678"}' -w '%{http_code}\n'
```

Expected: `{"status":"ok"}`, then `204`. The server log shows a line like `[OTP] [phone] +201012345678 → ######`. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add developer setup README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
