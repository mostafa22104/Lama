# Phase 2 — Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the owner app every backend capability its main screens need: business settings, customers, charges with automatic monthly invoices, the home dashboard, today's WhatsApp reminders, cash payments, customer history and the monthly report.

**Architecture:** New NestJS feature modules (`customers`, `charges`, `invoices`, `reminders`, `dashboard`, `reports`) follow the Phase 1 pattern — controller → service → repository, one file per class/DTO, each feature exposing a public `index.ts` and importing other features only through it (enforced by an architecture test). Invoice status is always computed from facts with `computeInvoiceStatus`. Monthly invoices are generated **lazily and idempotently**: creating a charge bills the current month immediately, and every read path calls `InvoiceGenerator.ensureUpToDate()`, which back-fills any missed months. That keeps Phase 2 free of Redis/BullMQ (not installable on this machine); Phase 7's scheduled job will call the same method. A global `Clock` makes "today" injectable so e2e tests are deterministic.

**Tech Stack:** Same as Phase 1 (Yarn 4.18.1, TypeScript ~6.0.2, NestJS 12 ESM, Prisma 7.10.0 + `@prisma/adapter-pg`, Vitest 4, Supertest 7, class-validator) plus ESLint 10 + typescript-eslint 8.

**Spec:** `docs/superpowers/specs/2026-10-11-lamma-architecture-design.md` — sections 3, 4, 5 and phase 2 of section 8. Builds on branch `feat/phase-1-foundation` (create `feat/phase-2-backend-core` from it).

## Global Constraints

- Target ≤ 150 lines per file; a file nearing 200 lines must be split. One class / DTO per file.
- Controllers are thin; services hold logic; repositories are the only code that touches Prisma.
- Features never import from other features except through that feature's `index.ts`.
- No hardcoded user-facing strings in the apps; copy lives in `packages/shared/src/i18n` (WhatsApp message templates included).
- TypeScript `strict` everywhere. ESM everywhere: relative imports end in `.js`.
- Status rules, money formatting, contact normalization, error codes and message templates have exactly one implementation, in `packages/shared`.
- Every error response body is `{ code, message, details? }` where `code` is an `ErrorCode` from `packages/shared`. Field errors use `details: [{ field, constraints: string[] }]`.
- Business time zone is `Africa/Cairo`. Amounts are integer Egyptian pounds (1 – 1,000,000). Dates on the wire are `YYYY-MM-DD` (`IsoDate`); timestamps are ISO-8601 strings.
- Every owner query is scoped by the `businessId` from the access token. Another business's record answers `404 NOT_FOUND`, never `403`.
- Archived customers (`archivedAt` set) are invisible everywhere: lists, totals, reminders, "assign to all", plan counts, invoice generation.
- A monthly charge's first invoice is for the month the charge is created in, even if its due day has already passed (owner decision, 2026-10-11).
- Plan customer limits: Free 20 / Basic 150 / Pro 500 (`PLAN_LIMITS`).
- Pin `prisma` and `@prisma/client` to exactly `7.10.0`.
- Git commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Owner opens the app after skipping months.** Every missed monthly invoice must exist exactly once, however many times the screens are reloaded. Pinned by "back-fills missed months exactly once" (Task 6).
2. **Due day 31 in a short month.** A charge due on the 31st is due on the last day of February/April, never skipped or moved into the next month. Pinned by "clamps day 31 to the end of short months" (Task 6).
3. **Another owner's ids.** Customers, charges, invoices and reminders of business B answer 404 to business A. Pinned by the "another business" test in Tasks 5, 6, 7, 9 and 10.
4. **Archived customers.** They vanish from lists, totals, reminders, "assign to all" and the plan count. Pinned by the archived tests in Tasks 5, 6, 7, 10 and 11.
5. **Cairo midnight.** A reminder sent at 23:30 Cairo yesterday must not mark today's reminder as sent. Pinned by "a reminder sent before Cairo midnight does not count for today" (Task 10).

---

## File Map

```
eslint.config.mjs                                  (Task 1)
packages/shared/src/
├── domain/  periods.ts customerStatus.ts charges.ts reminderMessage.ts (+ *.test.ts)
├── types/   customers.ts charges.ts reminders.ts dashboard.ts business.ts(modify) errors.ts(modify)
└── i18n/    ar|en/common.ts(months) ar|en/reminders.ts ar|en/errors.ts index.ts
apps/backend/
├── prisma/schema.prisma (+ migration phase2_indexes)
├── src/
│   ├── architecture.spec.ts
│   ├── common/clock/       clock.ts clock.module.ts
│   ├── common/dates/       date-codec.ts (+spec)
│   ├── common/crypto/      public-token.ts (+spec)
│   ├── common/errors/      app-error.ts(modify) field-error.ts
│   ├── common/filters/     to-error-response.ts(modify)
│   ├── common/validation/  trim.ts
│   ├── config/env.ts(modify)
│   ├── testing/fixed-clock.ts
│   └── modules/
│       ├── business/   index.ts + update/usage/upgrade (modify)
│       ├── customers/  index.ts module controller service repository mapper
│       │               customer-input.ts customer-summary.ts customer-history.ts (+specs) dto/*
│       ├── charges/    index.ts module controller service repository mapper charge-terms.ts (+spec) dto/*
│       ├── invoices/   index.ts module controller service repository invoice-rows.ts invoice-record.ts
│       │               invoice-generator.ts invoice-query.service.ts (+specs)
│       ├── reminders/  index.ts module controller service queue.service rule.repository log.repository
│       │               reminder-schedule.ts reminder-item.ts (+specs) dto/*
│       ├── dashboard/  index.ts module controller service
│       └── reports/    index.ts module controller service dto/*
└── test/
    ├── support/ create-test-app.ts(modify) factories.ts(modify) owner.ts
    ├── business/ customers/ charges/ invoices/ reminders/ dashboard/ reports/   (*.e2e-spec.ts)
```

---

### Task 1: ESLint and enforced feature boundaries

**Files:**
- Create: `eslint.config.mjs`, `apps/backend/src/architecture.spec.ts`, `apps/backend/src/modules/business/index.ts`
- Modify: `package.json` (root), `apps/backend/src/modules/auth/auth.service.ts`, `apps/backend/src/modules/auth/auth.module.ts`, `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: Phase 1 code.
- Produces: `yarn lint` runs type-checks **and** ESLint; `modules/business/index.ts` exports `BusinessModule`, `BusinessService`, `toBusinessDto`. Every later feature gets an `index.ts` and imports others only through it.

- [ ] **Step 1: Write the failing architecture test**

`apps/backend/src/architecture.spec.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const modulesDir = resolve(dirname(fileURLToPath(import.meta.url)), 'modules');
const RELATIVE_IMPORT = /from\s+'(\.[^']+)'/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

function featureOf(path: string): string | null {
  const rel = relative(modulesDir, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

describe('feature boundaries', () => {
  it('features import other features only through their index.ts', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(modulesDir)) {
      const own = featureOf(file);
      for (const [, spec] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
        const target = resolve(dirname(file), spec);
        const other = featureOf(target);
        if (!other || other === own) continue;
        if (relative(join(modulesDir, other), target) !== 'index.js') {
          violations.push(`${relative(modulesDir, file)} → ${spec}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn workspace @lamma/backend test src/architecture.spec.ts`
Expected: FAIL — violations list `auth/auth.service.ts → ../business/business.mapper.js`, `../business/business.service.js` and `auth/auth.module.ts → ../business/business.module.js`.

- [ ] **Step 3: Add the business public API and use it**

`apps/backend/src/modules/business/index.ts`:

```ts
export { BusinessModule } from './business.module.js';
export { BusinessService } from './business.service.js';
export { toBusinessDto } from './business.mapper.js';
```

In `apps/backend/src/modules/auth/auth.service.ts` replace the two business imports with:

```ts
import { BusinessService, toBusinessDto } from '../business/index.js';
```

In `apps/backend/src/modules/auth/auth.module.ts` replace the business import with:

```ts
import { BusinessModule } from '../business/index.js';
```

In `apps/backend/src/app.module.ts` replace the business import with:

```ts
import { BusinessModule } from './modules/business/index.js';
```

Run: `yarn workspace @lamma/backend test src/architecture.spec.ts` → PASS.

- [ ] **Step 4: Add ESLint**

```bash
yarn add -D eslint@^10.12.0 @eslint/js@^10.0.1 typescript-eslint@^8.71.1 eslint-config-prettier@^10.1.8 globals@^17.13.0
```

`eslint.config.mjs` (repo root):

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '.yarn/**',
      '.superpowers/**',
      'lamma-design-handoff/**',
      'apps/backend/src/generated/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  prettier,
);
```

Root `package.json` scripts — change `lint` and add `lint:es`:

```json
"lint": "yarn build:shared && yarn workspaces foreach -A --exclude lamma run lint && yarn lint:es",
"lint:es": "eslint .",
```

- [ ] **Step 5: Run ESLint and fix what it reports**

Run: `yarn lint:es`
Fix every reported problem in the source (do not disable rules or add `eslint-disable` comments). Typical hits: unused imports/variables, `@typescript-eslint/no-explicit-any`. If more than 25 problems are reported, stop and report them instead of fixing.

- [ ] **Step 6: Verify everything**

```bash
yarn lint
yarn test
yarn test:e2e
```

Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add eslint.config.mjs package.json yarn.lock apps/backend/src
git commit -m "chore: add ESLint and enforce feature boundaries through index.ts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Shared Phase 2 domain — periods, statuses, charges, reminder messages

**Files:**
- Create: `packages/shared/src/domain/periods.ts`, `customerStatus.ts`, `charges.ts`, `reminderMessage.ts` (+ `periods.test.ts`, `customerStatus.test.ts`, `charges.test.ts`, `reminderMessage.test.ts`)
- Create: `packages/shared/src/types/customers.ts`, `charges.ts`, `reminders.ts`, `dashboard.ts`
- Create: `packages/shared/src/i18n/ar/reminders.ts`, `packages/shared/src/i18n/en/reminders.ts`
- Modify: `packages/shared/src/types/business.ts`, `packages/shared/src/i18n/ar/common.ts`, `en/common.ts`, `i18n/index.ts`, `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `IsoDate`, `daysBetween`, `dueDateInPeriod`, `periodOf` (dates); `InvoiceStatus`; `Locale`; `CURRENCY_LABEL`, `formatAmount`; `resources`.
- Produces:
  - `nextPeriod(p)`, `previousPeriod(p)`, `periodsBetween(from, to): string[]` (inclusive), `periodRange(p): { start: IsoDate; end: IsoDate }`, `monthName(p, locale)`
  - `statusPriority(s): number`, `summarizeCustomerStatus(openStatuses, hasInvoices): InvoiceStatus | null`
  - `DEFAULT_MONTHLY_TITLE = 'اشتراك'`, `invoiceDisplayTitle({ title, period }, locale)`, `nextMonthlyDue(charges: { amount; dayOfMonth }[], today): { dueDate; amount } | null`
  - `buildReminderMessage(input: ReminderMessageInput): string`, `whatsappUrl(phoneE164, text)`, `payLink(baseUrl, token)`
  - Types: `GENDERS`, `Gender`, `CustomerInput`, `CustomerUpdate`, `InvoiceSummaryDto`, `CustomerDto`, `CustomerListItemDto`, `CustomerDetailDto`, `CustomersBatchResult`, `HistoryEventDto`, `CHARGE_KINDS`, `ChargeKind`, `CHARGE_ASSIGNMENTS`, `ChargeAssignment`, `ChargeInput`, `ChargeUpdate`, `ChargeDto`, `REMINDER_KINDS`, `ReminderKind`, `ReminderRuleDto`, `ReminderItemDto`, `TodayRemindersDto`, `MarkSentInput`, `HomeDashboardDto`, `MonthlyReportDto`, `BusinessUpdate`, `BusinessUsageDto`

- [ ] **Step 1: Write the failing tests**

`packages/shared/src/domain/periods.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { monthName, nextPeriod, periodRange, periodsBetween, previousPeriod } from './periods.js';

describe('periods', () => {
  it('steps across year boundaries', () => {
    expect(nextPeriod('2026-09')).toBe('2026-10');
    expect(nextPeriod('2026-12')).toBe('2027-01');
    expect(previousPeriod('2027-01')).toBe('2026-12');
    expect(previousPeriod('2026-10')).toBe('2026-09');
  });

  it('lists periods inclusively, empty when reversed', () => {
    expect(periodsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(periodsBetween('2026-09', '2026-09')).toEqual(['2026-09']);
    expect(periodsBetween('2026-10', '2026-09')).toEqual([]);
  });

  it('gives the first and last calendar day of a month', () => {
    expect(periodRange('2027-02')).toEqual({ start: '2027-02-01', end: '2027-02-28' });
    expect(periodRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' });
  });

  it('names months in both languages', () => {
    expect(monthName('2026-09', 'ar')).toBe('سبتمبر');
    expect(monthName('2026-01', 'en')).toBe('January');
  });
});
```

`packages/shared/src/domain/customerStatus.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { summarizeCustomerStatus } from './customerStatus.js';

describe('summarizeCustomerStatus', () => {
  it('reports the most urgent open status', () => {
    expect(summarizeCustomerStatus(['due_soon', 'overdue', 'upcoming'], true)).toBe('overdue');
    expect(summarizeCustomerStatus(['due_soon', 'awaiting_confirmation'], true)).toBe('awaiting_confirmation');
    expect(summarizeCustomerStatus(['upcoming', 'due_soon'], true)).toBe('due_soon');
  });

  it('is paid when nothing is open but invoices exist, and null with no invoices', () => {
    expect(summarizeCustomerStatus([], true)).toBe('paid');
    expect(summarizeCustomerStatus([], false)).toBeNull();
  });
});
```

`packages/shared/src/domain/charges.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_MONTHLY_TITLE, invoiceDisplayTitle, nextMonthlyDue } from './charges.js';

describe('invoiceDisplayTitle', () => {
  it('appends the month name for monthly invoices', () => {
    expect(invoiceDisplayTitle({ title: DEFAULT_MONTHLY_TITLE, period: '2026-09' }, 'ar')).toBe('اشتراك سبتمبر');
    expect(invoiceDisplayTitle({ title: 'كامب الصيف', period: null }, 'ar')).toBe('كامب الصيف');
  });
});

describe('nextMonthlyDue', () => {
  it('uses next month once this month\'s due day has passed', () => {
    expect(nextMonthlyDue([{ amount: 450, dayOfMonth: 20 }], '2026-09-23')).toEqual({
      dueDate: '2026-10-20',
      amount: 450,
    });
  });

  it('uses this month while the due day is still ahead', () => {
    expect(nextMonthlyDue([{ amount: 450, dayOfMonth: 26 }], '2026-09-23')).toEqual({
      dueDate: '2026-09-26',
      amount: 450,
    });
  });

  it('picks the earliest date and sums charges due that day', () => {
    const charges = [
      { amount: 450, dayOfMonth: 5 },
      { amount: 100, dayOfMonth: 5 },
      { amount: 900, dayOfMonth: 25 },
    ];
    expect(nextMonthlyDue(charges, '2026-09-10')).toEqual({ dueDate: '2026-09-25', amount: 900 });
    expect(nextMonthlyDue(charges, '2026-09-28')).toEqual({ dueDate: '2026-10-05', amount: 550 });
  });

  it('is null without monthly charges', () => {
    expect(nextMonthlyDue([], '2026-09-23')).toBeNull();
  });
});
```

`packages/shared/src/domain/reminderMessage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildReminderMessage, payLink, whatsappUrl } from './reminderMessage.js';

const base = {
  locale: 'ar' as const,
  customerName: 'سارة',
  businessName: 'أكاديمية النجوم للكرة',
  title: 'اشتراك سبتمبر',
  amount: 450,
  link: 'https://lamma.app/p/abc',
};

describe('buildReminderMessage', () => {
  it('matches the design copy 3 days before, for a woman', () => {
    expect(buildReminderMessage({ ...base, gender: 'female', daysUntilDue: 3 })).toBe(
      'أهلاً أستاذة سارة،\nفاضل 3 أيام على ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        'تقدري تدفعي من هنا في دقيقة:\nhttps://lamma.app/p/abc',
    );
  });

  it('uses the due-day copy for a man', () => {
    expect(buildReminderMessage({ ...base, customerName: 'محمود', gender: 'male', daysUntilDue: 0 })).toBe(
      'أهلاً أستاذ محمود،\nالنهارده ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        'ادفع من هنا:\nhttps://lamma.app/p/abc',
    );
  });

  it('uses neutral late copy with correct Arabic day counts', () => {
    const late = (days: number) =>
      buildReminderMessage({ ...base, customerName: 'كريم', gender: null, daysUntilDue: -days });
    expect(late(3)).toBe(
      'أهلاً كريم،\nاشتراك سبتمبر (450 ج.م) عدّى ميعاده بـ 3 أيام.\n' +
        'لو الدفع تم خلاص، ابعت صورة التحويل من اللينك ده:\nhttps://lamma.app/p/abc',
    );
    expect(late(1)).toContain('عدّى ميعاده بـ يوم.');
    expect(late(2)).toContain('عدّى ميعاده بـ يومين.');
    expect(late(22)).toContain('عدّى ميعاده بـ 22 يوم.');
  });

  it('formats large amounts with Western digits', () => {
    const text = buildReminderMessage({ ...base, gender: 'female', amount: 1200, daysUntilDue: 3 });
    expect(text).toContain('1,200 ج.م');
  });

  it('has English copy', () => {
    const text = buildReminderMessage({ ...base, locale: 'en', customerName: 'Sara', gender: 'female', daysUntilDue: 1 });
    expect(text).toBe(
      'Hi Sara,\nاشتراك سبتمبر at أكاديمية النجوم للكرة (450 EGP) is due in 1 day.\nPay here in a minute:\nhttps://lamma.app/p/abc',
    );
  });
});

describe('links', () => {
  it('builds wa.me links without the plus and with encoded text', () => {
    expect(whatsappUrl('+201012345678', 'أهلاً\nيا سارة')).toBe(
      `https://wa.me/201012345678?text=${encodeURIComponent('أهلاً\nيا سارة')}`,
    );
  });

  it('builds pay links without a double slash', () => {
    expect(payLink('https://lamma.app/', 'tok')).toBe('https://lamma.app/p/tok');
    expect(payLink('http://localhost:3001', 'tok')).toBe('http://localhost:3001/p/tok');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn workspace @lamma/shared test`
Expected: FAIL — cannot resolve `./periods.js`, `./customerStatus.js`, `./charges.js`, `./reminderMessage.js`.

- [ ] **Step 3: Add month names and reminder copy**

In `packages/shared/src/i18n/ar/common.ts` add inside `arCommon` (after `businessType`):

```ts
  months: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ],
```

In `packages/shared/src/i18n/en/common.ts` add inside `enCommon`:

```ts
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
```

`packages/shared/src/i18n/ar/reminders.ts`:

```ts
/** WhatsApp reminder copy (from lamma-design-handoff ReminderSettings). {placeholders} are filled by buildReminderMessage. */
export const arReminders = {
  greeting: { female: 'أهلاً أستاذة {name}،', male: 'أهلاً أستاذ {name}،', neutral: 'أهلاً {name}،' },
  before: 'فاضل {days} على ميعاد {title} في {business}: {amount} {currency}',
  onDue: 'النهارده ميعاد {title} في {business}: {amount} {currency}',
  after: '{title} ({amount} {currency}) عدّى ميعاده بـ {days}.',
  payCta: {
    female: 'تقدري تدفعي من هنا في دقيقة:',
    male: 'تقدر تدفع من هنا في دقيقة:',
    neutral: 'الدفع من هنا في دقيقة:',
  },
  onDueCta: { female: 'ادفعي من هنا:', male: 'ادفع من هنا:', neutral: 'الدفع من هنا:' },
  proofCta: {
    female: 'لو دفعتي خلاص، ابعتي صورة التحويل من اللينك ده:',
    male: 'لو دفعت خلاص، ابعت صورة التحويل من اللينك ده:',
    neutral: 'لو الدفع تم خلاص، ابعت صورة التحويل من اللينك ده:',
  },
  days: { one: 'يوم', two: 'يومين', few: '{n} أيام', many: '{n} يوم' },
} as const;
```

`packages/shared/src/i18n/en/reminders.ts`:

```ts
import type { arReminders } from '../ar/reminders.js';
import type { TranslationShape } from '../translation.js';

export const enReminders: TranslationShape<typeof arReminders> = {
  greeting: { female: 'Hi {name},', male: 'Hi {name},', neutral: 'Hi {name},' },
  before: '{title} at {business} ({amount} {currency}) is due in {days}.',
  onDue: '{title} at {business} ({amount} {currency}) is due today.',
  after: '{title} ({amount} {currency}) is {days} overdue.',
  payCta: { female: 'Pay here in a minute:', male: 'Pay here in a minute:', neutral: 'Pay here in a minute:' },
  onDueCta: { female: 'Pay here:', male: 'Pay here:', neutral: 'Pay here:' },
  proofCta: {
    female: 'Already paid? Send the transfer screenshot here:',
    male: 'Already paid? Send the transfer screenshot here:',
    neutral: 'Already paid? Send the transfer screenshot here:',
  },
  days: { one: '1 day', two: '2 days', few: '{n} days', many: '{n} days' },
};
```

In `packages/shared/src/i18n/index.ts` import both and add `reminders` to each locale:

```ts
import { arReminders } from './ar/reminders.js';
import { enReminders } from './en/reminders.js';
// …
export const resources = {
  ar: { common: arCommon, errors: arErrors, reminders: arReminders },
  en: { common: enCommon, errors: enErrors, reminders: enReminders },
} as const;
```

- [ ] **Step 4: Write the domain modules**

`packages/shared/src/domain/periods.ts`:

```ts
import { resources } from '../i18n/index.js';
import type { Locale } from '../types/locale.js';
import { dueDateInPeriod, type IsoDate } from './dates.js';

function split(period: string): [number, number] {
  const [year, month] = period.split('-').map(Number);
  return [year, month];
}

function format(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function nextPeriod(period: string): string {
  const [year, month] = split(period);
  return month === 12 ? format(year + 1, 1) : format(year, month + 1);
}

export function previousPeriod(period: string): string {
  const [year, month] = split(period);
  return month === 1 ? format(year - 1, 12) : format(year, month - 1);
}

/** Periods from `from` to `to`, inclusive; empty when `from` is after `to`. */
export function periodsBetween(from: string, to: string): string[] {
  const periods: string[] = [];
  for (let period = from; period <= to; period = nextPeriod(period)) periods.push(period);
  return periods;
}

export function periodRange(period: string): { start: IsoDate; end: IsoDate } {
  return { start: `${period}-01`, end: dueDateInPeriod(period, 31) };
}

export function monthName(period: string, locale: Locale): string {
  return resources[locale].common.months[Number(period.slice(5, 7)) - 1];
}
```

`packages/shared/src/domain/customerStatus.ts`:

```ts
import type { InvoiceStatus } from './invoiceStatus.js';

const OPEN_PRIORITY: InvoiceStatus[] = ['overdue', 'awaiting_confirmation', 'due_soon', 'upcoming'];

/** Lower is more urgent. Paid sorts after every open status. */
export function statusPriority(status: InvoiceStatus): number {
  const index = OPEN_PRIORITY.indexOf(status);
  return index === -1 ? OPEN_PRIORITY.length : index;
}

/** The status shown on a customer row: the most urgent open invoice, else paid, else none. */
export function summarizeCustomerStatus(
  openStatuses: InvoiceStatus[],
  hasInvoices: boolean,
): InvoiceStatus | null {
  if (openStatuses.length === 0) return hasInvoices ? 'paid' : null;
  return [...openStatuses].sort((a, b) => statusPriority(a) - statusPriority(b))[0];
}
```

`packages/shared/src/domain/charges.ts`:

```ts
import type { Locale } from '../types/locale.js';
import { dueDateInPeriod, periodOf, type IsoDate } from './dates.js';
import { monthName, nextPeriod } from './periods.js';

/** Monthly charges have no title in the design; invoices show "اشتراك <month>". */
export const DEFAULT_MONTHLY_TITLE = 'اشتراك';

export function invoiceDisplayTitle(
  invoice: { title: string; period: string | null },
  locale: Locale,
): string {
  return invoice.period ? `${invoice.title} ${monthName(invoice.period, locale)}` : invoice.title;
}

export interface MonthlyTerms {
  amount: number;
  dayOfMonth: number;
}

/** The next due date strictly after today across monthly charges, with the total due that day. */
export function nextMonthlyDue(
  charges: MonthlyTerms[],
  today: IsoDate,
): { dueDate: IsoDate; amount: number } | null {
  if (charges.length === 0) return null;
  const current = periodOf(today);
  const dues = charges.map((charge) => {
    const thisMonth = dueDateInPeriod(current, charge.dayOfMonth);
    const dueDate = thisMonth > today ? thisMonth : dueDateInPeriod(nextPeriod(current), charge.dayOfMonth);
    return { dueDate, amount: charge.amount };
  });
  const earliest = dues.reduce((min, due) => (due.dueDate < min ? due.dueDate : min), dues[0].dueDate);
  const amount = dues.filter((due) => due.dueDate === earliest).reduce((sum, due) => sum + due.amount, 0);
  return { dueDate: earliest, amount };
}
```

`packages/shared/src/domain/reminderMessage.ts`:

```ts
import { resources } from '../i18n/index.js';
import type { Gender } from '../types/customers.js';
import type { Locale } from '../types/locale.js';
import { CURRENCY_LABEL, formatAmount } from './money.js';

export interface ReminderMessageInput {
  locale: Locale;
  customerName: string;
  gender: Gender | null;
  businessName: string;
  /** Display title, e.g. "اشتراك سبتمبر". */
  title: string;
  amount: number;
  /** Positive before the due date, 0 on it, negative after it. */
  daysUntilDue: number;
  link: string;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function dayCount(days: number, locale: Locale): string {
  const words = resources[locale].reminders.days;
  if (days === 1) return words.one;
  if (days === 2) return words.two;
  return fill(days <= 10 ? words.few : words.many, { n: String(days) });
}

export function buildReminderMessage(input: ReminderMessageInput): string {
  const copy = resources[input.locale].reminders;
  const gender = input.gender ?? 'neutral';
  const values = {
    name: input.customerName,
    business: input.businessName,
    title: input.title,
    amount: formatAmount(input.amount),
    currency: CURRENCY_LABEL[input.locale],
    days: dayCount(Math.abs(input.daysUntilDue), input.locale),
  };
  const [body, cta] =
    input.daysUntilDue > 0
      ? [copy.before, copy.payCta[gender]]
      : input.daysUntilDue === 0
        ? [copy.onDue, copy.onDueCta[gender]]
        : [copy.after, copy.proofCta[gender]];
  return [fill(copy.greeting[gender], values), fill(body, values), cta, input.link].join('\n');
}

export function whatsappUrl(phoneE164: string, text: string): string {
  return `https://wa.me/${phoneE164.replace('+', '')}?text=${encodeURIComponent(text)}`;
}

export function payLink(baseUrl: string, publicToken: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/p/${publicToken}`;
}
```

- [ ] **Step 5: Write the API types**

`packages/shared/src/types/customers.ts`:

```ts
import type { IsoDate } from '../domain/dates.js';
import type { InvoiceStatus } from '../domain/invoiceStatus.js';
import type { ReminderKind } from './reminders.js';

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export interface CustomerInput {
  name: string;
  phone: string;
  note?: string | null;
  gender?: Gender | null;
}

export type CustomerUpdate = Partial<CustomerInput>;

export interface InvoiceSummaryDto {
  id: string;
  chargeId: string;
  customerId: string;
  /** Raw title; show with invoiceDisplayTitle(). */
  title: string;
  period: string | null;
  amount: number;
  dueDate: IsoDate;
  status: InvoiceStatus;
  publicToken: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  /** E.164, e.g. +201012345678 */
  phone: string;
  note: string | null;
  gender: Gender | null;
  createdAt: string;
}

export interface CustomerListItemDto extends CustomerDto {
  /** Sum of unpaid invoices. */
  balance: number;
  status: InvoiceStatus | null;
  /** The invoice the row talks about: most urgent, then earliest due. */
  headline: InvoiceSummaryDto | null;
}

export interface CustomerDetailDto extends CustomerListItemDto {
  openInvoices: InvoiceSummaryDto[];
  nextDue: { dueDate: IsoDate; amount: number } | null;
}

export interface CustomersBatchResult {
  created: CustomerDto[];
}

export type HistoryEventDto =
  | { type: 'created'; at: string }
  | { type: 'invoice'; at: IsoDate; invoiceId: string; title: string; period: string | null; amount: number; status: InvoiceStatus }
  | { type: 'payment'; at: string; invoiceId: string; title: string; period: string | null; amount: number; method: 'instapay' | 'cash' }
  | { type: 'reminder'; at: string; invoiceId: string; kind: ReminderKind };
```

`packages/shared/src/types/charges.ts`:

```ts
import type { IsoDate } from '../domain/dates.js';

export const CHARGE_KINDS = ['monthly', 'one_time'] as const;
export type ChargeKind = (typeof CHARGE_KINDS)[number];

export const CHARGE_ASSIGNMENTS = ['all', 'selected'] as const;
export type ChargeAssignment = (typeof CHARGE_ASSIGNMENTS)[number];

export interface ChargeInput {
  kind: ChargeKind;
  /** Required for one_time; monthly defaults to DEFAULT_MONTHLY_TITLE. */
  title?: string;
  amount: number;
  /** Required for monthly (1–31). */
  dayOfMonth?: number;
  /** Required for one_time. */
  dueDate?: IsoDate;
  assignTo: ChargeAssignment;
  /** Required when assignTo is 'selected'. */
  customerIds?: string[];
}

export interface ChargeUpdate {
  title?: string;
  amount?: number;
  active?: boolean;
}

export interface ChargeDto {
  id: string;
  kind: ChargeKind;
  title: string;
  amount: number;
  dayOfMonth: number | null;
  dueDate: IsoDate | null;
  active: boolean;
  customerCount: number;
  createdAt: string;
}
```

`packages/shared/src/types/reminders.ts`:

```ts
import type { IsoDate } from '../domain/dates.js';
import type { InvoiceStatus } from '../domain/invoiceStatus.js';

export const REMINDER_KINDS = ['before', 'on_due', 'after', 'promise', 'manual'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface ReminderRuleDto {
  beforeDays: number | null;
  onDueDate: boolean;
  afterDays: number | null;
}

export interface ReminderItemDto {
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  period: string | null;
  amount: number;
  dueDate: IsoDate;
  status: InvoiceStatus;
  kind: ReminderKind;
  message: string;
  waUrl: string;
  sent: boolean;
}

export interface TodayRemindersDto {
  date: IsoDate;
  total: number;
  sentCount: number;
  items: ReminderItemDto[];
}

export interface MarkSentInput {
  kind: ReminderKind;
}
```

`packages/shared/src/types/dashboard.ts`:

```ts
import type { CustomerListItemDto } from './customers.js';

export interface HomeDashboardDto {
  businessName: string;
  period: string;
  expected: number;
  collected: number;
  remaining: number;
  collectedPercent: number;
  overdue: { amount: number; customerCount: number };
  awaitingConfirmationCount: number;
  todayReminders: { total: number; sentCount: number; preview: { customerName: string }[] };
  overdueCustomers: CustomerListItemDto[];
}

export interface MonthlyReportDto {
  period: string;
  expected: number;
  collected: number;
  previousCollected: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  stillLate: CustomerListItemDto[];
}
```

Append to `packages/shared/src/types/business.ts`:

```ts
export interface BusinessUpdate {
  name?: string;
  instapayAddress?: string;
  area?: string | null;
  weeklyBackup?: boolean;
}

export interface BusinessUsageDto {
  plan: Plan;
  customerCount: number;
  maxCustomers: number;
  upgradeRequestedAt: string | null;
}
```

Append to `packages/shared/src/index.ts`:

```ts
export * from './domain/periods.js';
export * from './domain/customerStatus.js';
export * from './domain/charges.js';
export * from './domain/reminderMessage.js';
export * from './types/customers.js';
export * from './types/charges.js';
export * from './types/reminders.js';
export * from './types/dashboard.js';
```

- [ ] **Step 6: Run tests, type-check, build**

```bash
yarn workspace @lamma/shared test
yarn workspace @lamma/shared lint
yarn build:shared
```

Expected: all PASS (the existing i18n test also still passes with the new namespace).

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add periods, customer status, charges and WhatsApp reminder messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Backend foundations for Phase 2 — clock, dates, tokens, errors, indexes, test helpers

**Files:**
- Create: `apps/backend/src/common/clock/clock.ts`, `clock.module.ts`; `apps/backend/src/testing/fixed-clock.ts`; `apps/backend/src/common/dates/date-codec.ts` (+ `date-codec.spec.ts`); `apps/backend/src/common/crypto/public-token.ts` (+ `public-token.spec.ts`); `apps/backend/src/common/errors/field-error.ts`; `apps/backend/src/common/validation/trim.ts`; `apps/backend/test/support/owner.ts`; `apps/backend/test/errors/payload-too-large.e2e-spec.ts`
- Modify: `packages/shared/src/types/errors.ts`, `packages/shared/src/i18n/ar/errors.ts`, `en/errors.ts`; `apps/backend/src/common/errors/app-error.ts`; `apps/backend/src/common/filters/to-error-response.ts` (+ spec); `apps/backend/src/config/env.ts` (+ spec), `apps/backend/.env.example`; `apps/backend/src/app.module.ts`; `apps/backend/prisma/schema.prisma`; `apps/backend/src/modules/auth/dto/signup-details.dto.ts`; `apps/backend/test/support/create-test-app.ts`, `factories.ts`

**Interfaces:**
- Consumes: Phase 1 backend; `toBusinessDate`, `IsoDate` from shared.
- Produces:
  - `abstract class Clock { now(): Date }`, global `ClockModule` (provides `SystemClock`)
  - `FixedClock extends Clock` with `set(iso: string)` (default `2026-09-23T09:00:00.000Z` = Wednesday 23 Sept, 12:00 Cairo)
  - `toIsoDate(d: Date): IsoDate`, `fromIsoDate(iso): Date`, `isValidIsoDate(value: string): boolean`, `businessToday(now: Date): IsoDate`
  - `generatePublicToken(): string` (22 url-safe chars)
  - `fieldError(field: string, constraint: string): AppError` → `VALIDATION_FAILED` with `details: [{ field, constraints: [constraint] }]`
  - `trim` class-transformer helper
  - Error codes `INVOICE_ALREADY_PAID` (409), `FORBIDDEN` (403), `PAYLOAD_TOO_LARGE` (413); body-parser errors map to proper codes
  - `Env.WEB_BASE_URL` (default `http://localhost:3001`)
  - Indexes on `Invoice.customerId`, `Invoice.chargeId`, `Payment.invoiceId`, `ImportJob.businessId`, `ChargeAssignment.customerId`
  - Test helpers: `TestApp.clock: FixedClock`; `createCustomer(prisma, businessId, overrides?)`, `createCharge(prisma, businessId, customerIds, overrides?)`, `createInvoice(prisma, input)`, `createPendingClaim(prisma, invoiceId)`; `createOwner(t, overrides?) → { business, api }` where `api.get/post/patch/put/delete(path, body?)` prefix `/api/v1` and send the owner's token

- [ ] **Step 1: Write the failing unit tests**

`apps/backend/src/common/dates/date-codec.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { businessToday, fromIsoDate, isValidIsoDate, toIsoDate } from './date-codec.js';

describe('date codec', () => {
  it('round-trips calendar dates through UTC midnight', () => {
    expect(fromIsoDate('2026-09-20').toISOString()).toBe('2026-09-20T00:00:00.000Z');
    expect(toIsoDate(new Date('2026-09-20T00:00:00.000Z'))).toBe('2026-09-20');
  });

  it('rejects impossible dates', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('20-09-2026')).toBe(false);
  });

  it('uses the Cairo day for today', () => {
    expect(businessToday(new Date('2026-09-22T22:30:00Z'))).toBe('2026-09-23');
  });
});
```

`apps/backend/src/common/crypto/public-token.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generatePublicToken } from './public-token.js';

describe('generatePublicToken', () => {
  it('is 22 url-safe characters and unique', () => {
    const tokens = new Set(Array.from({ length: 500 }, generatePublicToken));
    expect(tokens.size).toBe(500);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});
```

Add to `apps/backend/src/common/filters/to-error-response.spec.ts` (inside the existing `describe`):

```ts
  it('maps body-parser errors by their status', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), { status: 413, expose: true });
    expect(toErrorResponse(tooLarge)).toEqual({
      status: 413,
      body: { code: 'PAYLOAD_TOO_LARGE', message: 'request entity too large' },
    });
  });

  it('maps 403 and 409 HttpExceptions to stable codes', () => {
    expect(toErrorResponse(new HttpException('no', 403)).body.code).toBe('FORBIDDEN');
    expect(toErrorResponse(new HttpException('dup', 409)).body.code).toBe('INVOICE_ALREADY_PAID');
  });

  it('hides the message of 5xx HttpExceptions', () => {
    expect(toErrorResponse(new HttpException('db password is hunter2', 503)).body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
```

Add to `apps/backend/src/config/env.spec.ts` (inside the existing `describe`):

```ts
  it('defaults WEB_BASE_URL for local development and validates it', () => {
    expect(parseEnv(valid).WEB_BASE_URL).toBe('http://localhost:3001');
    expect(() => parseEnv({ ...valid, WEB_BASE_URL: 'not a url' })).toThrow(/WEB_BASE_URL/);
  });
```

Run: `yarn workspace @lamma/backend test`
Expected: FAIL — missing modules and new assertions.

- [ ] **Step 2: Add the error codes everywhere**

`packages/shared/src/types/errors.ts` — add before `'INTERNAL_ERROR'`:

```ts
  'INVOICE_ALREADY_PAID',
  'FORBIDDEN',
  'PAYLOAD_TOO_LARGE',
```

`packages/shared/src/i18n/ar/errors.ts` — add:

```ts
  INVOICE_ALREADY_PAID: 'المبلغ ده متسجّل إنه اتدفع خلاص',
  FORBIDDEN: 'مش مسموح لك بالحركة دي',
  PAYLOAD_TOO_LARGE: 'البيانات أو الملف كبير أوي',
```

`packages/shared/src/i18n/en/errors.ts` — add:

```ts
  INVOICE_ALREADY_PAID: 'This amount is already marked as paid',
  FORBIDDEN: "You're not allowed to do that",
  PAYLOAD_TOO_LARGE: 'The data or file is too large',
```

`apps/backend/src/common/errors/app-error.ts` — add to `STATUS_BY_CODE`:

```ts
  INVOICE_ALREADY_PAID: HttpStatus.CONFLICT,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  PAYLOAD_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
```

`apps/backend/src/common/filters/to-error-response.ts` — replace the whole file:

```ts
import { HttpException } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@lamma/shared';
import { AppError } from '../errors/app-error.js';

export interface ErrorResponse {
  status: number;
  body: ApiErrorBody;
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'INVOICE_ALREADY_PAID',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
};

const INTERNAL: ErrorResponse = {
  status: 500,
  body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
};

/** Errors from Express middleware (body-parser) carry `status` and `expose` but are not HttpExceptions. */
function isExposedHttpError(value: unknown): value is { status: number; message: string } {
  const candidate = value as { status?: unknown; expose?: unknown };
  return typeof value === 'object' && value !== null && typeof candidate.status === 'number' && candidate.expose === true;
}

function fromStatus(status: number, message: string): ErrorResponse {
  if (status >= 500) return INTERNAL;
  return { status, body: { code: CODE_BY_STATUS[status] ?? 'VALIDATION_FAILED', message } };
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    const { code, message, details } = exception;
    return { status: exception.status, body: { code, message, details } };
  }
  if (exception instanceof HttpException) return fromStatus(exception.getStatus(), exception.message);
  if (isExposedHttpError(exception)) return fromStatus(exception.status, exception.message);
  return INTERNAL;
}
```

Note: the existing spec case "maps Nest HTTP exceptions to stable codes" keeps passing (400 → VALIDATION_FAILED, 404 → NOT_FOUND, 429 → RATE_LIMITED).

- [ ] **Step 3: Add clock, date codec, public token, field error, trim**

`apps/backend/src/common/clock/clock.ts`:

```ts
/** "Now", injectable so tests can pin the date. */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
```

`apps/backend/src/common/clock/clock.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { Clock, SystemClock } from './clock.js';

@Global()
@Module({ providers: [{ provide: Clock, useClass: SystemClock }], exports: [Clock] })
export class ClockModule {}
```

`apps/backend/src/testing/fixed-clock.ts`:

```ts
import { Clock } from '../common/clock/clock.js';

/** Wednesday 23 Sept 2026, 12:00 Cairo — the date shown in the Reminders design. */
export const DEFAULT_TEST_NOW = '2026-09-23T09:00:00.000Z';

export class FixedClock extends Clock {
  private current = new Date(DEFAULT_TEST_NOW);

  now(): Date {
    return new Date(this.current);
  }

  set(iso: string): void {
    this.current = new Date(iso);
  }
}
```

`apps/backend/src/common/dates/date-codec.ts`:

```ts
import { type IsoDate, toBusinessDate } from '@lamma/shared';

/** Prisma maps @db.Date columns to Dates at UTC midnight. */
export function fromIsoDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromIsoDate(value);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value;
}

export function businessToday(now: Date): IsoDate {
  return toBusinessDate(now);
}
```

`apps/backend/src/common/crypto/public-token.ts`:

```ts
import { randomBytes } from 'node:crypto';

/** Unguessable token for the customer's public pay link (/p/:token). */
export function generatePublicToken(): string {
  return randomBytes(16).toString('base64url');
}
```

`apps/backend/src/common/errors/field-error.ts`:

```ts
import { AppError } from './app-error.js';

/** Same shape as the validation pipe's details, for rules a DTO decorator can't express. */
export function fieldError(field: string, constraint: string): AppError {
  return new AppError('VALIDATION_FAILED', `Invalid ${field}`, [{ field, constraints: [constraint] }]);
}
```

`apps/backend/src/common/validation/trim.ts`:

```ts
/** class-transformer helper: trims strings, leaves other values alone. */
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
```

In `apps/backend/src/modules/auth/dto/signup-details.dto.ts` delete the local `trim` constant and add:

```ts
import { trim } from '../../../common/validation/trim.js';
```

- [ ] **Step 4: Env, app module, schema indexes**

`apps/backend/src/config/env.ts` — add to the schema:

```ts
  WEB_BASE_URL: z.url().default('http://localhost:3001'),
```

`apps/backend/.env.example` — append:

```dotenv
# Public origin of the customer web app (pay links in WhatsApp messages)
WEB_BASE_URL=http://localhost:3001
```

`apps/backend/src/app.module.ts` — import and register `ClockModule` right after `ConfigModule`:

```ts
import { ClockModule } from './common/clock/clock.module.js';
// imports: [ConfigModule, ClockModule, PrismaModule, ...]
```

`apps/backend/prisma/schema.prisma` — add indexes:

```prisma
// model ChargeAssignment { ... }
  @@index([customerId])
// model Invoice { ... } (next to the existing indexes)
  @@index([customerId])
  @@index([chargeId])
// model Payment { ... }
  @@index([invoiceId])
// model ImportJob { ... }
  @@index([businessId])
```

```bash
yarn workspace @lamma/backend db:migrate --name phase2_indexes
```

Expected: a new `prisma/migrations/<timestamp>_phase2_indexes/migration.sql` containing only `CREATE INDEX` statements.

- [ ] **Step 5: Test helpers**

`apps/backend/test/support/create-test-app.ts` — add the clock (replace the whole file):

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { Clock } from '../../src/common/clock/clock.js';
import { PrismaService } from '../../src/infra/prisma/prisma.service.js';
import { OtpSender } from '../../src/modules/auth/otp/otp-sender.js';
import { FakeOtpSender } from '../../src/testing/fake-otp-sender.js';
import { FixedClock } from '../../src/testing/fixed-clock.js';
import { resetDatabase } from './reset-database.js';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  otpSender: FakeOtpSender;
  clock: FixedClock;
  api: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const otpSender = new FakeOtpSender();
  const clock = new FixedClock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(OtpSender)
    .useValue(otpSender)
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma, otpSender, clock, api: () => request(app.getHttpServer()) };
}
```

`apps/backend/test/support/factories.ts` — append (keep `createBusiness`):

```ts
import type { Charge, Customer, Invoice, PaymentClaim } from '../../src/generated/prisma/client.js';

export function createCustomer(
  prisma: PrismaService,
  businessId: string,
  overrides: Partial<Prisma.CustomerUncheckedCreateInput> = {},
): Promise<Customer> {
  return prisma.customer.create({
    data: { businessId, name: 'محمود حسن', phone: '+201023456781', ...overrides },
  });
}

/** One-time by default so the monthly generator never adds invoices behind a test's back. */
export function createCharge(
  prisma: PrismaService,
  businessId: string,
  customerIds: string[],
  overrides: Partial<Prisma.ChargeUncheckedCreateInput> = {},
): Promise<Charge> {
  return prisma.charge.create({
    data: {
      businessId,
      kind: 'one_time',
      title: 'اشتراك',
      amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      createdAt: new Date('2026-09-01T09:00:00.000Z'),
      ...overrides,
      assignments: { createMany: { data: customerIds.map((customerId) => ({ customerId })) } },
    },
  });
}

let tokenCounter = 0;

export function createInvoice(
  prisma: PrismaService,
  input: { businessId: string; chargeId: string; customerId: string } & Partial<Prisma.InvoiceUncheckedCreateInput>,
): Promise<Invoice> {
  tokenCounter += 1;
  return prisma.invoice.create({
    data: {
      title: 'اشتراك',
      period: null,
      amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      publicToken: `test-token-${tokenCounter}-${Date.now()}`,
      ...input,
    },
  });
}

export function createPendingClaim(prisma: PrismaService, invoiceId: string): Promise<PaymentClaim> {
  return prisma.paymentClaim.create({
    data: {
      invoiceId,
      screenshotKey: 'test/screenshot.png',
      rawText: '',
      checkAmount: true,
      checkDate: true,
      checkRecipient: true,
      verdict: 'all_match',
    },
  });
}
```

(Merge the new `import type` names into the file's existing generated-client import line.)

`apps/backend/test/support/owner.ts`:

```ts
import type { Business, Prisma } from '../../src/generated/prisma/client.js';
import { AccessTokenService } from '../../src/common/auth/access-token.service.js';
import type { TestApp } from './create-test-app.js';
import { createBusiness } from './factories.js';

/** Supertest calls under /api/v1 that carry the business owner's access token. */
export function ownerApi(t: TestApp, businessId: string) {
  const auth = `Bearer ${t.app.get(AccessTokenService).sign(businessId)}`;
  const url = (path: string) => `/api/v1${path}`;
  return {
    get: (path: string) => t.api().get(url(path)).set('Authorization', auth),
    post: (path: string, body: object = {}) => t.api().post(url(path)).set('Authorization', auth).send(body),
    patch: (path: string, body: object = {}) => t.api().patch(url(path)).set('Authorization', auth).send(body),
    put: (path: string, body: object = {}) => t.api().put(url(path)).set('Authorization', auth).send(body),
    delete: (path: string) => t.api().delete(url(path)).set('Authorization', auth),
  };
}

export type OwnerApi = ReturnType<typeof ownerApi>;

export async function createOwner(
  t: TestApp,
  overrides: Partial<Prisma.BusinessCreateInput> = {},
): Promise<{ business: Business; api: OwnerApi }> {
  const business = await createBusiness(t.prisma, overrides);
  return { business, api: ownerApi(t, business.id) };
}
```

- [ ] **Step 6: Write the body-size e2e test**

`apps/backend/test/errors/payload-too-large.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';

describe('oversized bodies (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('answers 413 PAYLOAD_TOO_LARGE instead of a 500', async () => {
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: 'x'.repeat(200_000) })
      .expect(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
```

- [ ] **Step 7: Run everything**

```bash
yarn workspace @lamma/shared test
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/src apps/backend
git commit -m "feat(backend): add clock, date codec, pay tokens, new error codes and test helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Business settings, usage and upgrade request

**Files:**
- Create: `apps/backend/src/modules/business/dto/update-business.dto.ts`
- Modify: `business.controller.ts`, `business.service.ts`, `business.repository.ts` (all in `apps/backend/src/modules/business/`)
- Test: `apps/backend/test/business/update-business.e2e-spec.ts`

**Interfaces:**
- Consumes: `Clock`, `BusinessUpdate`, `BusinessUsageDto`, `PLAN_LIMITS`, `createOwner`, `createCustomer`.
- Produces:
  - `PATCH /api/v1/business` (body `BusinessUpdate`) → `BusinessDto`
  - `GET /api/v1/business/usage` → `BusinessUsageDto`
  - `POST /api/v1/business/upgrade-request` → `204`
  - `BusinessService.update(id, patch)`, `.usage(id)`, `.requestUpgrade(id)`; `BusinessRepository.countActiveCustomers(businessId): Promise<number>`

- [ ] **Step 1: Write the failing e2e test**

`apps/backend/test/business/update-business.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('business settings (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('updates only the fields sent, trimming text', async () => {
    const { api } = await createOwner(t);
    const res = await api.patch('/business', { name: '  أكاديمية النجوم  ', weeklyBackup: true }).expect(200);
    expect(res.body).toMatchObject({
      name: 'أكاديمية النجوم',
      weeklyBackup: true,
      instapayAddress: 'nogoum.academy@instapay',
    });
  });

  it('clears the area with null', async () => {
    const { api } = await createOwner(t, { area: 'التجمع الخامس' });
    const res = await api.patch('/business', { area: null }).expect(200);
    expect(res.body.area).toBeNull();
  });

  it('rejects empty names and unknown fields', async () => {
    const { api } = await createOwner(t);
    const empty = await api.patch('/business', { name: ' ' }).expect(400);
    expect(empty.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
    await api.patch('/business', { plan: 'pro' }).expect(400);
  });

  it('reports plan usage without archived customers', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    await createCustomer(t.prisma, business.id, { name: 'سارة عادل' });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });
    const res = await api.get('/business/usage').expect(200);
    expect(res.body).toEqual({ plan: 'free', customerCount: 2, maxCustomers: 20, upgradeRequestedAt: null });
  });

  it('records an upgrade request at the current time', async () => {
    const { api } = await createOwner(t);
    await api.post('/business/upgrade-request').expect(204);
    const res = await api.get('/business/usage').expect(200);
    expect(res.body.upgradeRequestedAt).toBe(DEFAULT_TEST_NOW);
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e test/business/update-business.e2e-spec.ts`
Expected: FAIL — routes return 404.

- [ ] **Step 2: Write the DTO, repository and service changes**

`apps/backend/src/modules/business/dto/update-business.dto.ts`:

```ts
import type { BusinessUpdate } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class UpdateBusinessDto implements BusinessUpdate {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(3, 120)
  instapayAddress?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  area?: string | null;

  @IsOptional()
  @IsBoolean()
  weeklyBackup?: boolean;
}
```

Add to `BusinessRepository`:

```ts
  update(id: string, data: BusinessUpdate): Promise<Business> {
    return this.prisma.business.update({ where: { id }, data });
  }

  countActiveCustomers(businessId: string): Promise<number> {
    return this.prisma.customer.count({ where: { businessId, archivedAt: null } });
  }

  markUpgradeRequested(id: string, at: Date): Promise<Business> {
    return this.prisma.business.update({ where: { id }, data: { planUpgradeRequestedAt: at } });
  }
```

(import `BusinessUpdate` from `@lamma/shared`.)

Replace `BusinessService` with:

```ts
import { Injectable } from '@nestjs/common';
import { type BusinessUpdate, type BusinessUsageDto, type ContactChannel, PLAN_LIMITS } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Business } from '../../generated/prisma/client.js';
import { BusinessRepository } from './business.repository.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessService {
  constructor(
    private readonly businesses: BusinessRepository,
    private readonly clock: Clock,
  ) {}

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

  async update(id: string, patch: BusinessUpdate): Promise<Business> {
    await this.getById(id);
    return this.businesses.update(id, patch);
  }

  async usage(id: string): Promise<BusinessUsageDto> {
    const business = await this.getById(id);
    return {
      plan: business.plan,
      customerCount: await this.businesses.countActiveCustomers(id),
      maxCustomers: PLAN_LIMITS[business.plan].maxCustomers,
      upgradeRequestedAt: business.planUpgradeRequestedAt?.toISOString() ?? null,
    };
  }

  async requestUpgrade(id: string): Promise<void> {
    await this.getById(id);
    await this.businesses.markUpgradeRequested(id, this.clock.now());
  }
}
```

Replace `BusinessController` with:

```ts
import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import type { BusinessDto, BusinessUsageDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toBusinessDto } from './business.mapper.js';
import { BusinessService } from './business.service.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get()
  async get(@CurrentBusinessId() businessId: string): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.getById(businessId));
  }

  @Patch()
  async update(@CurrentBusinessId() businessId: string, @Body() dto: UpdateBusinessDto): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.update(businessId, dto));
  }

  @Get('usage')
  usage(@CurrentBusinessId() businessId: string): Promise<BusinessUsageDto> {
    return this.businesses.usage(businessId);
  }

  @Post('upgrade-request')
  @HttpCode(204)
  async requestUpgrade(@CurrentBusinessId() businessId: string): Promise<void> {
    await this.businesses.requestUpgrade(businessId);
  }
}
```

- [ ] **Step 3: Run the tests**

```bash
yarn workspace @lamma/backend test:e2e
yarn workspace @lamma/backend lint
```

Expected: PASS (including the existing `get-business` and auth suites).

- [ ] **Step 4: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add business settings, plan usage and upgrade request

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Customers — create, batch create, update, archive

**Files:**
- Create (all under `apps/backend/src/modules/customers/`): `index.ts`, `customers.module.ts`, `customers.controller.ts`, `customers.service.ts`, `customers.repository.ts`, `customer.mapper.ts`, `customer-input.ts` (+ `customer-input.spec.ts`), `dto/create-customer.dto.ts`, `dto/create-customers-batch.dto.ts`, `dto/update-customer.dto.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/customers/create-customers.e2e-spec.ts`, `apps/backend/test/customers/update-archive-customer.e2e-spec.ts`

**Interfaces:**
- Consumes: `BusinessService` (business/index), `Clock`, `normalizeEgyptianPhone`, `canAddCustomers`, `PLAN_LIMITS`, `GENDERS`, `trim`, `AppError`.
- Produces:
  - `POST /api/v1/customers` → `201 CustomerDto`; `POST /api/v1/customers/batch` `{ customers: CustomerInput[] }` (1–500, all-or-nothing) → `201 CustomersBatchResult`; `PATCH /api/v1/customers/:id` → `CustomerDto`; `DELETE /api/v1/customers/:id` → `204` (archives)
  - `CustomersService.getOwned(businessId, id): Promise<Customer>` (404 if missing, archived or another business's)
  - `toCustomerDto(customer): CustomerDto`; `customers/index.ts` exports `CustomersModule`, `CustomersService`
  - Errors: bad phone → `400 CONTACT_INVALID` with `details: { field: 'phone' }` (batch: `customers.<index>.phone`); over the plan → `403 PLAN_LIMIT_REACHED` with `details: { max, current }`

- [ ] **Step 1: Write the failing unit test for input normalization**

`apps/backend/src/modules/customers/customer-input.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toCustomerRow } from './customer-input.js';

describe('toCustomerRow', () => {
  it('normalizes the phone and fills optional fields', () => {
    expect(toCustomerRow({ name: 'سارة عادل', phone: '٠١٠ ٢٣٤٥ ٦٧٨١' })).toEqual({
      name: 'سارة عادل',
      phone: '+201023456781',
      note: null,
      gender: null,
    });
  });

  it('reports the failing field, with the batch index when given', () => {
    expect(() => toCustomerRow({ name: 'x', phone: '123' })).toThrow(
      expect.objectContaining({ code: 'CONTACT_INVALID', details: { field: 'phone' } }),
    );
    expect(() => toCustomerRow({ name: 'x', phone: '123' }, 4)).toThrow(
      expect.objectContaining({ details: { field: 'customers.4.phone' } }),
    );
  });
});
```

Run: `yarn workspace @lamma/backend test` → FAIL (cannot resolve `./customer-input.js`).

- [ ] **Step 2: Write `customer-input.ts`**

```ts
import { type CustomerInput, type Gender, normalizeEgyptianPhone } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';

export interface CustomerRow {
  name: string;
  phone: string;
  note: string | null;
  gender: Gender | null;
}

export function normalizeCustomerPhone(raw: string, field = 'phone'): string {
  const phone = normalizeEgyptianPhone(raw);
  if (!phone) throw new AppError('CONTACT_INVALID', 'Invalid customer phone', { field });
  return phone;
}

export function toCustomerRow(input: CustomerInput, batchIndex?: number): CustomerRow {
  const field = batchIndex === undefined ? 'phone' : `customers.${batchIndex}.phone`;
  return {
    name: input.name,
    phone: normalizeCustomerPhone(input.phone, field),
    note: input.note ?? null,
    gender: input.gender ?? null,
  };
}
```

Run: `yarn workspace @lamma/backend test` → PASS.

- [ ] **Step 3: Write the failing e2e tests**

`apps/backend/test/customers/create-customers.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('creating customers (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('creates a customer with a normalized phone', async () => {
    const { api } = await createOwner(t);
    const res = await api
      .post('/customers', { name: ' محمود حسن ', phone: '010 2345 6781', note: 'ولي أمر يوسف', gender: 'male' })
      .expect(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'محمود حسن',
      phone: '+201023456781',
      note: 'ولي أمر يوسف',
      gender: 'male',
      createdAt: DEFAULT_TEST_NOW,
    });
  });

  it('allows the same phone twice (siblings share a parent)', async () => {
    const { api } = await createOwner(t);
    await api.post('/customers', { name: 'يوسف', phone: '01023456781' }).expect(201);
    await api.post('/customers', { name: 'مريم', phone: '01023456781' }).expect(201);
  });

  it('rejects a bad phone with CONTACT_INVALID', async () => {
    const { api } = await createOwner(t);
    const res = await api.post('/customers', { name: 'x', phone: '0123' }).expect(400);
    expect(res.body).toMatchObject({ code: 'CONTACT_INVALID', details: { field: 'phone' } });
  });

  it('batch-creates all rows or none', async () => {
    const { business, api } = await createOwner(t);
    const bad = await api
      .post('/customers/batch', {
        customers: [
          { name: 'سارة', phone: '01112345678' },
          { name: 'كريم', phone: 'nope' },
        ],
      })
      .expect(400);
    expect(bad.body.details).toEqual({ field: 'customers.1.phone' });
    expect(await t.prisma.customer.count({ where: { businessId: business.id } })).toBe(0);

    const ok = await api
      .post('/customers/batch', {
        customers: [
          { name: 'سارة', phone: '01112345678' },
          { name: 'كريم', phone: '01212345678' },
        ],
      })
      .expect(201);
    expect(ok.body.created.map((c: { name: string }) => c.name)).toEqual(['سارة', 'كريم']);
  });

  it('enforces the plan limit, ignoring archived customers', async () => {
    const { business, api } = await createOwner(t);
    for (let i = 0; i < 19; i++) await createCustomer(t.prisma, business.id, { name: `عميل ${i}` });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });

    const over = await api
      .post('/customers/batch', {
        customers: [
          { name: 'أ', phone: '01012345601' },
          { name: 'ب', phone: '01012345602' },
        ],
      })
      .expect(403);
    expect(over.body).toMatchObject({ code: 'PLAN_LIMIT_REACHED', details: { max: 20, current: 19 } });

    await api.post('/customers', { name: 'العشرين', phone: '01012345603' }).expect(201);
  });

  it('requires a token', async () => {
    await t.api().post('/api/v1/customers').send({ name: 'x', phone: '01012345678' }).expect(401);
  });
});
```

`apps/backend/test/customers/update-archive-customer.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('updating and archiving customers (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('updates fields and re-normalizes a new phone', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    const res = await api.patch(`/customers/${customer.id}`, { phone: '+20 11 1234 5678', note: null }).expect(200);
    expect(res.body).toMatchObject({ name: 'محمود حسن', phone: '+201112345678', note: null });
  });

  it('archives instead of deleting, then hides the customer', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.delete(`/customers/${customer.id}`).expect(204);

    const row = await t.prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(row.archivedAt).not.toBeNull();
    await api.patch(`/customers/${customer.id}`, { name: 'x' }).expect(404);
    await api.delete(`/customers/${customer.id}`).expect(404);
  });

  it("answers 404 for another business's customer", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);
    await api.patch(`/customers/${foreign.id}`, { name: 'x' }).expect(404);
    await api.delete(`/customers/${foreign.id}`).expect(404);
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e test/customers` → FAIL (404 routes).

- [ ] **Step 4: Write the module**

`dto/create-customer.dto.ts`:

```ts
import { type CustomerInput, type Gender, GENDERS } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class CreateCustomerDto implements CustomerInput {
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @IsString()
  @MaxLength(40)
  phone: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  note?: string | null;

  @IsOptional()
  @IsIn([...GENDERS])
  gender?: Gender | null;
}
```

`dto/create-customers-batch.dto.ts`:

```ts
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto.js';

export class CreateCustomersBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerDto)
  customers: CreateCustomerDto[];
}
```

`dto/update-customer.dto.ts`:

```ts
import { type CustomerUpdate, type Gender, GENDERS } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class UpdateCustomerDto implements CustomerUpdate {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  note?: string | null;

  @IsOptional()
  @IsIn([...GENDERS])
  gender?: Gender | null;
}
```

`customer.mapper.ts`:

```ts
import type { CustomerDto } from '@lamma/shared';
import type { Customer } from '../../generated/prisma/client.js';

export function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    note: customer.note,
    gender: customer.gender,
    createdAt: customer.createdAt.toISOString(),
  };
}
```

`customers.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { Customer, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { CustomerRow } from './customer-input.js';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(businessId: string): Promise<number> {
    return this.prisma.customer.count({ where: { businessId, archivedAt: null } });
  }

  createMany(businessId: string, rows: CustomerRow[], createdAt: Date): Promise<Customer[]> {
    return this.prisma.customer.createManyAndReturn({
      data: rows.map((row) => ({ ...row, businessId, createdAt })),
    });
  }

  findOwned(businessId: string, id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, businessId, archivedAt: null } });
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async archive(id: string, at: Date): Promise<void> {
    await this.prisma.customer.update({ where: { id }, data: { archivedAt: at } });
  }
}
```

`customers.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { canAddCustomers, type CustomerInput, type CustomerUpdate, PLAN_LIMITS } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Customer } from '../../generated/prisma/client.js';
import { BusinessService } from '../business/index.js';
import { normalizeCustomerPhone, toCustomerRow } from './customer-input.js';
import { CustomersRepository } from './customers.repository.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly businesses: BusinessService,
    private readonly clock: Clock,
  ) {}

  async create(businessId: string, input: CustomerInput): Promise<Customer> {
    const [created] = await this.createRows(businessId, [toCustomerRow(input)]);
    return created;
  }

  createMany(businessId: string, inputs: CustomerInput[]): Promise<Customer[]> {
    return this.createRows(businessId, inputs.map((input, index) => toCustomerRow(input, index)));
  }

  async update(businessId: string, id: string, patch: CustomerUpdate): Promise<Customer> {
    await this.getOwned(businessId, id);
    const { phone, ...rest } = patch;
    return this.customers.update(id, phone === undefined ? rest : { ...rest, phone: normalizeCustomerPhone(phone) });
  }

  async archive(businessId: string, id: string): Promise<void> {
    await this.getOwned(businessId, id);
    await this.customers.archive(id, this.clock.now());
  }

  async getOwned(businessId: string, id: string): Promise<Customer> {
    const customer = await this.customers.findOwned(businessId, id);
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found');
    return customer;
  }

  private async createRows(businessId: string, rows: ReturnType<typeof toCustomerRow>[]): Promise<Customer[]> {
    const business = await this.businesses.getById(businessId);
    const current = await this.customers.countActive(businessId);
    if (!canAddCustomers(business.plan, current, rows.length)) {
      const max = PLAN_LIMITS[business.plan].maxCustomers;
      throw new AppError('PLAN_LIMIT_REACHED', 'Plan customer limit reached', { max, current });
    }
    return this.customers.createMany(businessId, rows, this.clock.now());
  }
}
```

`customers.controller.ts`:

```ts
import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { CustomerDto, CustomersBatchResult } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toCustomerDto } from './customer.mapper.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { CreateCustomersBatchDto } from './dto/create-customers-batch.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateCustomerDto): Promise<CustomerDto> {
    return toCustomerDto(await this.customers.create(businessId, dto));
  }

  @Post('batch')
  async createBatch(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateCustomersBatchDto,
  ): Promise<CustomersBatchResult> {
    const created = await this.customers.createMany(businessId, dto.customers);
    return { created: created.map(toCustomerDto) };
  }

  @Patch(':id')
  async update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerDto> {
    return toCustomerDto(await this.customers.update(businessId, id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<void> {
    await this.customers.archive(businessId, id);
  }
}
```

`customers.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/index.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepository } from './customers.repository.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [BusinessModule],
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
```

`index.ts`:

```ts
export { CustomersModule } from './customers.module.js';
export { CustomersService } from './customers.service.js';
```

Register in `apps/backend/src/app.module.ts`: `import { CustomersModule } from './modules/customers/index.js';` and add `CustomersModule` to `imports`.

- [ ] **Step 5: Run the tests**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add customer create, batch create, update and archive

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Charges and invoice generation

**Files:**
- Create (`apps/backend/src/modules/invoices/`): `index.ts`, `invoices.module.ts`, `invoice.repository.ts`, `invoice-rows.ts` (+ `invoice-rows.spec.ts`), `invoice-generator.ts`
- Create (`apps/backend/src/modules/charges/`): `index.ts`, `charges.module.ts`, `charges.controller.ts`, `charges.service.ts`, `charges.repository.ts`, `charge.mapper.ts`, `charge-terms.ts` (+ `charge-terms.spec.ts`), `dto/create-charge.dto.ts`, `dto/update-charge.dto.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/charges/create-charge.e2e-spec.ts`, `apps/backend/test/charges/invoice-generation.e2e-spec.ts`

**Interfaces:**
- Consumes: `Clock`, `businessToday`, `fromIsoDate`, `toIsoDate`, `isValidIsoDate`, `generatePublicToken`, `fieldError`, `trim`; shared `ChargeInput`, `ChargeUpdate`, `ChargeDto`, `DEFAULT_MONTHLY_TITLE`, `dueDateInPeriod`, `periodOf`, `periodsBetween`, `toBusinessDate`.
- Produces:
  - `interface ChargeTerms { kind: ChargeKind; title: string; amount: number; dayOfMonth: number | null; dueDate: IsoDate | null }`
  - `toChargeTerms(input: ChargeInput): ChargeTerms` (throws field errors)
  - `interface InvoiceRow { customerId; period: string | null; title; amount; dueDate: Date; publicToken }`, `buildInvoiceRows(terms, customerIds, periods): InvoiceRow[]`
  - `InvoiceGenerator.ensureUpToDate(businessId: string, today: IsoDate): Promise<void>` — idempotent; back-fills every period from the charge's creation month to `today`'s month (max 24) for active monthly charges and active assigned customers
  - `invoices/index.ts` exports `InvoicesModule`, `InvoiceGenerator`, `buildInvoiceRows`, types `ChargeTerms`, `InvoiceRow`
  - `POST /api/v1/charges` → `201 ChargeDto` (creates the first invoices in the same write); `GET /api/v1/charges` → `ChargeDto[]`; `PATCH /api/v1/charges/:id` → `ChargeDto` (affects future invoices only)
  - Field errors: `dayOfMonth`/`required`, `title`/`required`, `dueDate`/`required`|`invalidDate`, `customerIds`/`required`|`unknownCustomer`, `assignTo`/`noCustomers`

- [ ] **Step 1: Write the failing unit tests**

`apps/backend/src/modules/charges/charge-terms.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toChargeTerms } from './charge-terms.js';

const fieldErr = (field: string, constraint: string) =>
  expect.objectContaining({ code: 'VALIDATION_FAILED', details: [{ field, constraints: [constraint] }] });

describe('toChargeTerms', () => {
  it('defaults the monthly title', () => {
    expect(toChargeTerms({ kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' })).toEqual({
      kind: 'monthly',
      title: 'اشتراك',
      amount: 450,
      dayOfMonth: 20,
      dueDate: null,
    });
  });

  it('requires a day for monthly charges', () => {
    expect(() => toChargeTerms({ kind: 'monthly', amount: 450, assignTo: 'all' })).toThrow(fieldErr('dayOfMonth', 'required'));
  });

  it('requires a title and a real due date for one-time charges', () => {
    const base = { kind: 'one_time' as const, amount: 1200, assignTo: 'all' as const };
    expect(() => toChargeTerms({ ...base, dueDate: '2026-10-01' })).toThrow(fieldErr('title', 'required'));
    expect(() => toChargeTerms({ ...base, title: 'كامب' })).toThrow(fieldErr('dueDate', 'required'));
    expect(() => toChargeTerms({ ...base, title: 'كامب', dueDate: '2026-02-30' })).toThrow(fieldErr('dueDate', 'invalidDate'));
    expect(toChargeTerms({ ...base, title: 'كامب الصيف', dueDate: '2026-10-01' })).toEqual({
      kind: 'one_time',
      title: 'كامب الصيف',
      amount: 1200,
      dayOfMonth: null,
      dueDate: '2026-10-01',
    });
  });
});
```

`apps/backend/src/modules/invoices/invoice-rows.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildInvoiceRows } from './invoice-rows.js';

const monthly = { kind: 'monthly' as const, title: 'اشتراك', amount: 450, dayOfMonth: 31, dueDate: null };

describe('buildInvoiceRows', () => {
  it('creates one row per customer per period, clamping the due day', () => {
    const rows = buildInvoiceRows(monthly, ['c1', 'c2'], ['2027-01', '2027-02']);
    expect(rows.map((r) => [r.customerId, r.period, r.dueDate.toISOString().slice(0, 10)])).toEqual([
      ['c1', '2027-01', '2027-01-31'],
      ['c2', '2027-01', '2027-01-31'],
      ['c1', '2027-02', '2027-02-28'],
      ['c2', '2027-02', '2027-02-28'],
    ]);
    expect(new Set(rows.map((r) => r.publicToken)).size).toBe(4);
  });

  it('creates one period-less row per customer for one-time charges', () => {
    const oneTime = { kind: 'one_time' as const, title: 'تيشيرت', amount: 150, dayOfMonth: null, dueDate: '2026-09-23' };
    const rows = buildInvoiceRows(oneTime, ['c1'], ['2026-09', '2026-10']);
    expect(rows).toEqual([
      expect.objectContaining({ customerId: 'c1', period: null, title: 'تيشيرت', amount: 150 }),
    ]);
    expect(rows[0].dueDate.toISOString()).toBe('2026-09-23T00:00:00.000Z');
  });
});
```

Run: `yarn workspace @lamma/backend test` → FAIL (missing modules).

- [ ] **Step 2: Write `charge-terms.ts` and `invoice-rows.ts`**

`apps/backend/src/modules/charges/charge-terms.ts`:

```ts
import { type ChargeInput, DEFAULT_MONTHLY_TITLE } from '@lamma/shared';
import { isValidIsoDate } from '../../common/dates/date-codec.js';
import { fieldError } from '../../common/errors/field-error.js';
import type { ChargeTerms } from '../invoices/index.js';

/** Checks the kind-specific rules a DTO can't express and fills defaults. */
export function toChargeTerms(input: ChargeInput): ChargeTerms {
  if (input.kind === 'monthly') {
    if (input.dayOfMonth === undefined) throw fieldError('dayOfMonth', 'required');
    return {
      kind: 'monthly',
      title: input.title ?? DEFAULT_MONTHLY_TITLE,
      amount: input.amount,
      dayOfMonth: input.dayOfMonth,
      dueDate: null,
    };
  }
  if (!input.title) throw fieldError('title', 'required');
  if (!input.dueDate) throw fieldError('dueDate', 'required');
  if (!isValidIsoDate(input.dueDate)) throw fieldError('dueDate', 'invalidDate');
  return { kind: 'one_time', title: input.title, amount: input.amount, dayOfMonth: null, dueDate: input.dueDate };
}
```

`apps/backend/src/modules/invoices/invoice-rows.ts`:

```ts
import { type ChargeKind, dueDateInPeriod, type IsoDate } from '@lamma/shared';
import { generatePublicToken } from '../../common/crypto/public-token.js';
import { fromIsoDate } from '../../common/dates/date-codec.js';

export interface ChargeTerms {
  kind: ChargeKind;
  title: string;
  amount: number;
  dayOfMonth: number | null;
  dueDate: IsoDate | null;
}

export interface InvoiceRow {
  customerId: string;
  period: string | null;
  title: string;
  amount: number;
  dueDate: Date;
  publicToken: string;
}

function row(terms: ChargeTerms, customerId: string, period: string | null, dueDate: IsoDate): InvoiceRow {
  return {
    customerId,
    period,
    title: terms.title,
    amount: terms.amount,
    dueDate: fromIsoDate(dueDate),
    publicToken: generatePublicToken(),
  };
}

/** Monthly: one row per period per customer. One-time: one row per customer; periods are ignored. */
export function buildInvoiceRows(terms: ChargeTerms, customerIds: string[], periods: string[]): InvoiceRow[] {
  const { dayOfMonth, dueDate } = terms;
  if (terms.kind === 'one_time') {
    if (!dueDate) throw new Error('One-time charge has no due date');
    return customerIds.map((customerId) => row(terms, customerId, null, dueDate));
  }
  if (dayOfMonth === null) throw new Error('Monthly charge has no day of month');
  return periods.flatMap((period) =>
    customerIds.map((customerId) => row(terms, customerId, period, dueDateInPeriod(period, dayOfMonth))),
  );
}
```

Run: `yarn workspace @lamma/backend test` → PASS.

- [ ] **Step 3: Write the failing e2e tests**

`apps/backend/test/charges/create-charge.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('creating charges (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('bills every active customer for the current month, even past the due day', async () => {
    const { business, api } = await createOwner(t);
    const a = await createCustomer(t.prisma, business.id);
    const b = await createCustomer(t.prisma, business.id, { name: 'سارة عادل' });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });

    const res = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    expect(res.body).toMatchObject({ kind: 'monthly', title: 'اشتراك', amount: 450, dayOfMonth: 20, customerCount: 2 });

    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: res.body.id }, orderBy: { customerId: 'asc' } });
    expect(invoices.map((i) => i.customerId).sort()).toEqual([a.id, b.id].sort());
    for (const invoice of invoices) {
      expect(invoice).toMatchObject({ period: '2026-09', amount: 450, title: 'اشتراك', paidAt: null });
      expect(invoice.dueDate.toISOString()).toBe('2026-09-20T00:00:00.000Z');
    }
  });

  it('bills only selected customers for a one-time charge', async () => {
    const { business, api } = await createOwner(t);
    const omar = await createCustomer(t.prisma, business.id, { name: 'عمر خالد' });
    await createCustomer(t.prisma, business.id);
    const res = await api
      .post('/charges', { kind: 'one_time', title: 'كامب الصيف', amount: 1200, dueDate: '2026-10-01', assignTo: 'selected', customerIds: [omar.id] })
      .expect(201);
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: res.body.id } });
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({ customerId: omar.id, period: null, amount: 1200, title: 'كامب الصيف' });
  });

  it('validates amounts, days and dates', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 0, dayOfMonth: 20, assignTo: 'all' }).expect(400);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 32, assignTo: 'all' }).expect(400);
    const noDay = await api.post('/charges', { kind: 'monthly', amount: 450, assignTo: 'all' }).expect(400);
    expect(noDay.body.details).toEqual([{ field: 'dayOfMonth', constraints: ['required'] }]);
    const badDate = await api
      .post('/charges', { kind: 'one_time', title: 'x', amount: 10, dueDate: '2026-02-30', assignTo: 'all' })
      .expect(400);
    expect(badDate.body.details).toEqual([{ field: 'dueDate', constraints: ['invalidDate'] }]);
  });

  it('rejects customers of another business and empty audiences', async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);

    const none = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(400);
    expect(none.body.details).toEqual([{ field: 'assignTo', constraints: ['noCustomers'] }]);

    const foreignRes = await api
      .post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'selected', customerIds: [foreign.id] })
      .expect(400);
    expect(foreignRes.body.details).toEqual([{ field: 'customerIds', constraints: ['unknownCustomer'] }]);
  });

  it('lists and updates charges, but never another business\'s', async () => {
    const { business, api } = await createOwner(t);
    const c = await createCustomer(t.prisma, business.id);
    const created = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    const list = await api.get('/charges').expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await api.patch(`/charges/${created.body.id}`, { amount: 500, active: false }).expect(200);
    expect(updated.body).toMatchObject({ amount: 500, active: false });

    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreignCharge = await createCharge(t.prisma, other.id, []);
    await api.patch(`/charges/${foreignCharge.id}`, { amount: 1 }).expect(404);
    expect(c.id).toBeTruthy();
  });
});
```

`apps/backend/test/charges/invoice-generation.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InvoiceGenerator } from '../../src/modules/invoices/index.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('monthly invoice generation (e2e)', () => {
  let t: TestApp;
  let generator: InvoiceGenerator;

  beforeEach(async () => {
    t = await createTestApp();
    generator = t.app.get(InvoiceGenerator);
  });

  afterEach(async () => {
    await t.app.close();
  });

  const periodsOf = async (chargeId: string) =>
    (await t.prisma.invoice.findMany({ where: { chargeId }, orderBy: { period: 'asc' } })).map((i) => i.period);

  it('back-fills missed months exactly once', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    t.clock.set('2026-12-05T09:00:00.000Z');
    await generator.ensureUpToDate(business.id, '2026-12-05');
    await generator.ensureUpToDate(business.id, '2026-12-05');
    expect(await periodsOf(charge.body.id)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12']);
  });

  it('clamps day 31 to the end of short months', async () => {
    t.clock.set('2027-01-15T09:00:00.000Z');
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 31, assignTo: 'all' }).expect(201);

    await generator.ensureUpToDate(business.id, '2027-02-03');
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: charge.body.id }, orderBy: { period: 'asc' } });
    expect(invoices.map((i) => i.dueDate.toISOString().slice(0, 10))).toEqual(['2027-01-31', '2027-02-28']);
  });

  it('uses the new amount for later months only', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    await api.patch(`/charges/${charge.body.id}`, { amount: 500 }).expect(200);

    await generator.ensureUpToDate(business.id, '2026-10-02');
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: charge.body.id }, orderBy: { period: 'asc' } });
    expect(invoices.map((i) => [i.period, i.amount])).toEqual([
      ['2026-09', 450],
      ['2026-10', 500],
    ]);
  });

  it('skips inactive charges and archived customers', async () => {
    const { business, api } = await createOwner(t);
    const keep = await createCustomer(t.prisma, business.id);
    const gone = await createCustomer(t.prisma, business.id, { name: 'سيمشي' });
    const active = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    const paused = await api.post('/charges', { kind: 'monthly', amount: 100, dayOfMonth: 5, assignTo: 'all' }).expect(201);
    await api.patch(`/charges/${paused.body.id}`, { active: false }).expect(200);
    await api.delete(`/customers/${gone.id}`).expect(204);

    await generator.ensureUpToDate(business.id, '2026-10-02');
    const october = await t.prisma.invoice.findMany({ where: { period: '2026-10' } });
    expect(october.map((i) => [i.chargeId, i.customerId])).toEqual([[active.body.id, keep.id]]);
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e test/charges` → FAIL.

- [ ] **Step 4: Write the invoices module (generation part)**

`invoice.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { toIsoDate } from '../../common/dates/date-codec.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { ChargeTerms, InvoiceRow } from './invoice-rows.js';

export interface GenerationCharge extends ChargeTerms {
  id: string;
  createdAt: Date;
  customerIds: string[];
}

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMonthlyCharges(businessId: string): Promise<GenerationCharge[]> {
    const charges = await this.prisma.charge.findMany({
      where: { businessId, kind: 'monthly', active: true },
      select: {
        id: true, kind: true, title: true, amount: true, dayOfMonth: true, dueDate: true, createdAt: true,
        assignments: { where: { customer: { archivedAt: null } }, select: { customerId: true } },
      },
    });
    return charges.map(({ assignments, dueDate, ...charge }) => ({
      ...charge,
      dueDate: dueDate ? toIsoDate(dueDate) : null,
      customerIds: assignments.map((a) => a.customerId),
    }));
  }

  async existingKeys(chargeIds: string[], periods: string[]): Promise<Set<string>> {
    const rows = await this.prisma.invoice.findMany({
      where: { chargeId: { in: chargeIds }, period: { in: periods } },
      select: { chargeId: true, customerId: true, period: true },
    });
    return new Set(rows.map((r) => `${r.chargeId}|${r.customerId}|${r.period}`));
  }

  async createMissing(businessId: string, rows: (InvoiceRow & { chargeId: string })[]): Promise<void> {
    await this.prisma.invoice.createMany({
      data: rows.map((row) => ({ ...row, businessId })),
      skipDuplicates: true,
    });
  }
}
```

`invoice-generator.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { type IsoDate, periodOf, periodsBetween, toBusinessDate } from '@lamma/shared';
import { buildInvoiceRows } from './invoice-rows.js';
import { InvoiceRepository } from './invoice.repository.js';

const MAX_CATCH_UP_PERIODS = 24;

const keyOf = (row: { chargeId: string; customerId: string; period: string | null }) =>
  `${row.chargeId}|${row.customerId}|${row.period}`;

/** Lazily creates every missing monthly invoice up to today's month. Safe to call on every read. */
@Injectable()
export class InvoiceGenerator {
  constructor(private readonly invoices: InvoiceRepository) {}

  async ensureUpToDate(businessId: string, today: IsoDate): Promise<void> {
    const charges = await this.invoices.findActiveMonthlyCharges(businessId);
    const currentPeriod = periodOf(today);
    const candidates = charges.flatMap((charge) => {
      const first = periodOf(toBusinessDate(charge.createdAt));
      const periods = periodsBetween(first, currentPeriod).slice(-MAX_CATCH_UP_PERIODS);
      return buildInvoiceRows(charge, charge.customerIds, periods).map((row) => ({ ...row, chargeId: charge.id }));
    });
    if (candidates.length === 0) return;

    const periods = [...new Set(candidates.map((row) => row.period ?? ''))];
    const existing = await this.invoices.existingKeys(charges.map((c) => c.id), periods);
    const missing = candidates.filter((row) => !existing.has(keyOf(row)));
    if (missing.length > 0) await this.invoices.createMissing(businessId, missing);
  }
}
```

`invoices.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { InvoiceGenerator } from './invoice-generator.js';
import { InvoiceRepository } from './invoice.repository.js';

@Module({
  providers: [InvoiceRepository, InvoiceGenerator],
  exports: [InvoiceGenerator],
})
export class InvoicesModule {}
```

`index.ts`:

```ts
export { InvoicesModule } from './invoices.module.js';
export { InvoiceGenerator } from './invoice-generator.js';
export { buildInvoiceRows, type ChargeTerms, type InvoiceRow } from './invoice-rows.js';
```

- [ ] **Step 5: Write the charges module**

`dto/create-charge.dto.ts`:

```ts
import { CHARGE_ASSIGNMENTS, CHARGE_KINDS, type ChargeAssignment, type ChargeInput, type ChargeKind } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class CreateChargeDto implements ChargeInput {
  @IsIn([...CHARGE_KINDS])
  kind: ChargeKind;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  title?: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;

  @IsIn([...CHARGE_ASSIGNMENTS])
  assignTo: ChargeAssignment;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  customerIds?: string[];
}
```

`dto/update-charge.dto.ts`:

```ts
import type { ChargeUpdate } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class UpdateChargeDto implements ChargeUpdate {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
```

`charges.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ChargeUpdate } from '@lamma/shared';
import { fromIsoDate } from '../../common/dates/date-codec.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { ChargeTerms, InvoiceRow } from '../invoices/index.js';

const WITH_COUNT = { _count: { select: { assignments: true } } } as const;
export type ChargeWithCount = Prisma.ChargeGetPayload<{ include: typeof WITH_COUNT }>;

@Injectable()
export class ChargesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async activeCustomerIds(businessId: string, onlyIds?: string[]): Promise<string[]> {
    const rows = await this.prisma.customer.findMany({
      where: { businessId, archivedAt: null, ...(onlyIds ? { id: { in: onlyIds } } : {}) },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  /** Charge, assignments and first invoices in one atomic write. */
  createWithInvoices(
    businessId: string,
    terms: ChargeTerms,
    customerIds: string[],
    invoices: InvoiceRow[],
    createdAt: Date,
  ): Promise<ChargeWithCount> {
    return this.prisma.charge.create({
      data: {
        businessId,
        kind: terms.kind,
        title: terms.title,
        amount: terms.amount,
        dayOfMonth: terms.dayOfMonth,
        dueDate: terms.dueDate ? fromIsoDate(terms.dueDate) : null,
        createdAt,
        assignments: { createMany: { data: customerIds.map((customerId) => ({ customerId })) } },
        invoices: { createMany: { data: invoices.map((row) => ({ ...row, businessId })) } },
      },
      include: WITH_COUNT,
    });
  }

  list(businessId: string): Promise<ChargeWithCount[]> {
    return this.prisma.charge.findMany({
      where: { businessId },
      include: WITH_COUNT,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOwned(businessId: string, id: string): Promise<ChargeWithCount | null> {
    return this.prisma.charge.findFirst({ where: { id, businessId }, include: WITH_COUNT });
  }

  update(id: string, data: ChargeUpdate): Promise<ChargeWithCount> {
    return this.prisma.charge.update({ where: { id }, data, include: WITH_COUNT });
  }
}
```

`charge.mapper.ts`:

```ts
import type { ChargeDto } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';
import type { ChargeWithCount } from './charges.repository.js';

export function toChargeDto(charge: ChargeWithCount): ChargeDto {
  return {
    id: charge.id,
    kind: charge.kind,
    title: charge.title,
    amount: charge.amount,
    dayOfMonth: charge.dayOfMonth,
    dueDate: charge.dueDate ? toIsoDate(charge.dueDate) : null,
    active: charge.active,
    customerCount: charge._count.assignments,
    createdAt: charge.createdAt.toISOString(),
  };
}
```

`charges.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { type ChargeInput, type ChargeUpdate, periodOf } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { fieldError } from '../../common/errors/field-error.js';
import { buildInvoiceRows } from '../invoices/index.js';
import { toChargeTerms } from './charge-terms.js';
import { ChargesRepository, type ChargeWithCount } from './charges.repository.js';

@Injectable()
export class ChargesService {
  constructor(
    private readonly charges: ChargesRepository,
    private readonly clock: Clock,
  ) {}

  async create(businessId: string, input: ChargeInput): Promise<ChargeWithCount> {
    const terms = toChargeTerms(input);
    const customerIds = await this.resolveCustomers(businessId, input);
    const now = this.clock.now();
    const invoices = buildInvoiceRows(terms, customerIds, [periodOf(businessToday(now))]);
    return this.charges.createWithInvoices(businessId, terms, customerIds, invoices, now);
  }

  list(businessId: string): Promise<ChargeWithCount[]> {
    return this.charges.list(businessId);
  }

  async update(businessId: string, id: string, patch: ChargeUpdate): Promise<ChargeWithCount> {
    const charge = await this.charges.findOwned(businessId, id);
    if (!charge) throw new AppError('NOT_FOUND', 'Charge not found');
    return this.charges.update(id, patch);
  }

  private async resolveCustomers(businessId: string, input: ChargeInput): Promise<string[]> {
    if (input.assignTo === 'all') {
      const ids = await this.charges.activeCustomerIds(businessId);
      if (ids.length === 0) throw fieldError('assignTo', 'noCustomers');
      return ids;
    }
    const wanted = [...new Set(input.customerIds ?? [])];
    if (wanted.length === 0) throw fieldError('customerIds', 'required');
    const found = await this.charges.activeCustomerIds(businessId, wanted);
    if (found.length !== wanted.length) throw fieldError('customerIds', 'unknownCustomer');
    return wanted;
  }
}
```

`charges.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { ChargeDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toChargeDto } from './charge.mapper.js';
import { ChargesService } from './charges.service.js';
import { CreateChargeDto } from './dto/create-charge.dto.js';
import { UpdateChargeDto } from './dto/update-charge.dto.js';

@Controller('charges')
@UseGuards(JwtAuthGuard)
export class ChargesController {
  constructor(private readonly charges: ChargesService) {}

  @Post()
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateChargeDto): Promise<ChargeDto> {
    return toChargeDto(await this.charges.create(businessId, dto));
  }

  @Get()
  async list(@CurrentBusinessId() businessId: string): Promise<ChargeDto[]> {
    return (await this.charges.list(businessId)).map(toChargeDto);
  }

  @Patch(':id')
  async update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChargeDto,
  ): Promise<ChargeDto> {
    return toChargeDto(await this.charges.update(businessId, id, dto));
  }
}
```

`charges.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller.js';
import { ChargesRepository } from './charges.repository.js';
import { ChargesService } from './charges.service.js';

@Module({
  controllers: [ChargesController],
  providers: [ChargesRepository, ChargesService],
})
export class ChargesModule {}
```

`index.ts`:

```ts
export { ChargesModule } from './charges.module.js';
```

Register `InvoicesModule` and `ChargesModule` (both from their `index.js`) in `app.module.ts`.

- [ ] **Step 6: Run the tests**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add charges with immediate and lazily back-filled monthly invoices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Invoice queries, customer list and customer detail

**Files:**
- Create: `apps/backend/src/modules/invoices/invoice-record.ts`, `invoice-query.service.ts`; `apps/backend/src/modules/customers/customer-summary.ts` (+ `customer-summary.spec.ts`), `dto/list-customers-query.dto.ts`
- Modify: `invoice.repository.ts`, `invoices.module.ts`, `invoices/index.ts`, `customers.service.ts`, `customers.repository.ts`, `customers.controller.ts`, `customers.module.ts`
- Test: `apps/backend/test/customers/list-customers.e2e-spec.ts`, `apps/backend/test/customers/customer-detail.e2e-spec.ts`

**Interfaces:**
- Consumes: `InvoiceGenerator`; shared `computeInvoiceStatus`, `summarizeCustomerStatus`, `statusPriority`, `nextMonthlyDue`, `toWesternDigits`, `INVOICE_STATUSES`; `toCustomerDto`; factories `createCharge`, `createInvoice`, `createPendingClaim`.
- Produces:
  - `interface OpenInvoice { summary: InvoiceSummaryDto; customer: { id; name; phone; gender: Gender | null }; promisedDate: IsoDate | null }`
  - `InvoiceQueryService.refresh(businessId, today): Promise<void>`, `.openInvoices(businessId, today): Promise<OpenInvoice[]>` (generates first), `.invoicedCustomerIds(businessId): Promise<Set<string>>`, `.customerInvoices(businessId, customerId, today): Promise<InvoiceSummaryDto[]>` (all, newest due first), `.findOne(businessId, invoiceId, today): Promise<OpenInvoice | null>`
  - `buildCustomerListItem(customer: CustomerDto, open: InvoiceSummaryDto[], hasInvoices: boolean): CustomerListItemDto`
  - `CustomersService.list(businessId, query: { search?: string; status?: InvoiceStatus }): Promise<CustomerListItemDto[]>` — sorted most urgent first, then by name; `.detail(businessId, id): Promise<CustomerDetailDto>`
  - `GET /api/v1/customers?search=&status=` → `CustomerListItemDto[]`; `GET /api/v1/customers/:id` → `CustomerDetailDto`
  - `invoices/index.ts` also exports `InvoiceQueryService`, type `OpenInvoice`

- [ ] **Step 1: Write the failing unit test**

`apps/backend/src/modules/customers/customer-summary.spec.ts`:

```ts
import type { CustomerDto, InvoiceSummaryDto } from '@lamma/shared';
import { describe, expect, it } from 'vitest';
import { buildCustomerListItem } from './customer-summary.js';

const customer: CustomerDto = { id: 'c1', name: 'محمود', phone: '+201023456781', note: null, gender: 'male', createdAt: '2026-09-01T00:00:00.000Z' };
const invoice = (over: Partial<InvoiceSummaryDto>): InvoiceSummaryDto => ({
  id: 'i', chargeId: 'ch', customerId: 'c1', title: 'اشتراك', period: '2026-09', amount: 450,
  dueDate: '2026-09-20', status: 'overdue', publicToken: 't', ...over,
});

describe('buildCustomerListItem', () => {
  it('sums the balance and headlines the most urgent invoice', () => {
    const item = buildCustomerListItem(
      customer,
      [
        invoice({ id: 'soon', status: 'due_soon', dueDate: '2026-09-26', amount: 300 }),
        invoice({ id: 'late', status: 'overdue', dueDate: '2026-09-20', amount: 450 }),
      ],
      true,
    );
    expect(item).toMatchObject({ balance: 750, status: 'overdue', headline: { id: 'late' } });
  });

  it('is paid with zero balance when nothing is open', () => {
    expect(buildCustomerListItem(customer, [], true)).toMatchObject({ balance: 0, status: 'paid', headline: null });
    expect(buildCustomerListItem(customer, [], false).status).toBeNull();
  });
});
```

Run: `yarn workspace @lamma/backend test` → FAIL.

- [ ] **Step 2: Write `customer-summary.ts`**

```ts
import {
  type CustomerDto,
  type CustomerListItemDto,
  type InvoiceSummaryDto,
  statusPriority,
  summarizeCustomerStatus,
} from '@lamma/shared';

export function byUrgency(a: InvoiceSummaryDto, b: InvoiceSummaryDto): number {
  return statusPriority(a.status) - statusPriority(b.status) || a.dueDate.localeCompare(b.dueDate);
}

export function buildCustomerListItem(
  customer: CustomerDto,
  open: InvoiceSummaryDto[],
  hasInvoices: boolean,
): CustomerListItemDto {
  return {
    ...customer,
    balance: open.reduce((sum, invoice) => sum + invoice.amount, 0),
    status: summarizeCustomerStatus(open.map((invoice) => invoice.status), hasInvoices),
    headline: [...open].sort(byUrgency)[0] ?? null,
  };
}
```

Run unit tests → PASS.

- [ ] **Step 3: Write the failing e2e tests**

`apps/backend/test/customers/list-customers.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner, type OwnerApi } from '../support/owner.js';

describe('listing customers (e2e)', () => {
  let t: TestApp;
  let api: OwnerApi;
  let businessId: string;

  beforeEach(async () => {
    t = await createTestApp();
    const owner = await createOwner(t);
    api = owner.api;
    businessId = owner.business.id;

    const make = (name: string, phone: string) => createCustomer(t.prisma, businessId, { name, phone });
    const mahmoud = await make('محمود حسن', '+201023456781');
    const sara = await make('سارة عادل', '+201112345678');
    const ahmed = await make('أحمد السيد', '+201212345678');
    const mona = await make('منى إبراهيم', '+201512345678');
    await make('هبة مصطفى', '+201098765432');
    const gone = await createCustomer(t.prisma, businessId, { name: 'قديم', archivedAt: new Date() });

    const ids = [mahmoud.id, sara.id, ahmed.id, mona.id, gone.id];
    const charge = await createCharge(t.prisma, businessId, ids);
    const invoice = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    await invoice(mahmoud.id, '2026-09-20');
    await invoice(sara.id, '2026-09-26');
    const claimed = await invoice(ahmed.id, '2026-09-20', { amount: 600 });
    await createPendingClaim(t.prisma, claimed.id);
    await invoice(mona.id, '2026-09-20', { paidAt: new Date('2026-09-19T10:00:00.000Z') });
    await invoice(gone.id, '2026-09-20');
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('computes status and balance, most urgent first, without archived customers', async () => {
    const res = await api.get('/customers').expect(200);
    expect(res.body.map((c: { name: string; status: string | null; balance: number }) => [c.name, c.status, c.balance])).toEqual([
      ['محمود حسن', 'overdue', 450],
      ['أحمد السيد', 'awaiting_confirmation', 600],
      ['سارة عادل', 'due_soon', 450],
      ['منى إبراهيم', 'paid', 0],
      ['هبة مصطفى', null, 0],
    ]);
    expect(res.body[0].headline).toMatchObject({ dueDate: '2026-09-20', status: 'overdue', amount: 450 });
  });

  it('filters by status and rejects unknown statuses', async () => {
    const res = await api.get('/customers?status=overdue').expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['محمود حسن']);
    await api.get('/customers?status=late').expect(400);
  });

  it('searches by name and by phone digits typed in Arabic', async () => {
    const byName = await api.get(`/customers?search=${encodeURIComponent('سارة')}`).expect(200);
    expect(byName.body.map((c: { name: string }) => c.name)).toEqual(['سارة عادل']);
    const byPhone = await api.get(`/customers?search=${encodeURIComponent('٠١٠٢٣٤')}`).expect(200);
    expect(byPhone.body.map((c: { name: string }) => c.name)).toEqual(['محمود حسن']);
  });

  it("never shows another business's customers", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112340000' });
    await createCustomer(t.prisma, other.id, { name: 'غريب' });
    const res = await api.get('/customers').expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).not.toContain('غريب');
  });
});
```

`apps/backend/test/customers/customer-detail.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('customer detail (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('shows the balance, open invoices and the next monthly due date', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    const res = await api.get(`/customers/${customer.id}`).expect(200);
    expect(res.body).toMatchObject({
      id: customer.id,
      balance: 450,
      status: 'overdue',
      nextDue: { dueDate: '2026-10-20', amount: 450 },
    });
    expect(res.body.openInvoices).toEqual([
      expect.objectContaining({ period: '2026-09', dueDate: '2026-09-20', status: 'overdue', amount: 450 }),
    ]);
  });

  it('back-fills the current month before answering', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    t.clock.set('2026-10-25T09:00:00.000Z');

    const res = await api.get(`/customers/${customer.id}`).expect(200);
    expect(res.body.balance).toBe(900);
    expect(res.body.openInvoices.map((i: { period: string }) => i.period)).toEqual(['2026-09', '2026-10']);
  });

  it("answers 404 for archived and other businesses' customers", async () => {
    const { business, api } = await createOwner(t);
    const archived = await createCustomer(t.prisma, business.id, { archivedAt: new Date() });
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    await api.get(`/customers/${archived.id}`).expect(404);
    await api.get(`/customers/${foreign.id}`).expect(404);
  });
});
```

Run: `yarn workspace @lamma/backend test:e2e test/customers` → FAIL.

- [ ] **Step 4: Write the invoice read model**

`apps/backend/src/modules/invoices/invoice-record.ts`:

```ts
import { computeInvoiceStatus, type InvoiceSummaryDto, type IsoDate } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';
import type { Prisma } from '../../generated/prisma/client.js';

export const INVOICE_SELECT = {
  id: true,
  chargeId: true,
  customerId: true,
  title: true,
  period: true,
  amount: true,
  dueDate: true,
  paidAt: true,
  publicToken: true,
  promisedDate: true,
  customer: { select: { id: true, name: true, phone: true, gender: true } },
  _count: { select: { claims: { where: { status: 'pending' } } } },
} satisfies Prisma.InvoiceSelect;

export type InvoiceRecord = Prisma.InvoiceGetPayload<{ select: typeof INVOICE_SELECT }>;

export interface OpenInvoice {
  summary: InvoiceSummaryDto;
  customer: InvoiceRecord['customer'];
  promisedDate: IsoDate | null;
}

export function toInvoiceSummary(record: InvoiceRecord, today: IsoDate): InvoiceSummaryDto {
  const dueDate = toIsoDate(record.dueDate);
  return {
    id: record.id,
    chargeId: record.chargeId,
    customerId: record.customerId,
    title: record.title,
    period: record.period,
    amount: record.amount,
    dueDate,
    status: computeInvoiceStatus(
      { dueDate, paidAt: record.paidAt, hasPendingClaim: record._count.claims > 0 },
      today,
    ),
    publicToken: record.publicToken,
  };
}

export function toOpenInvoice(record: InvoiceRecord, today: IsoDate): OpenInvoice {
  return {
    summary: toInvoiceSummary(record, today),
    customer: record.customer,
    promisedDate: record.promisedDate ? toIsoDate(record.promisedDate) : null,
  };
}
```

Add to `InvoiceRepository` (import `INVOICE_SELECT`, `InvoiceRecord`):

```ts
  findOpen(businessId: string): Promise<InvoiceRecord[]> {
    return this.prisma.invoice.findMany({
      where: { businessId, paidAt: null, customer: { archivedAt: null } },
      select: INVOICE_SELECT,
      orderBy: { dueDate: 'asc' },
    });
  }

  async invoicedCustomerIds(businessId: string): Promise<Set<string>> {
    const rows = await this.prisma.invoice.findMany({
      where: { businessId },
      distinct: ['customerId'],
      select: { customerId: true },
    });
    return new Set(rows.map((row) => row.customerId));
  }

  findForCustomer(businessId: string, customerId: string): Promise<InvoiceRecord[]> {
    return this.prisma.invoice.findMany({
      where: { businessId, customerId },
      select: INVOICE_SELECT,
      orderBy: { dueDate: 'desc' },
    });
  }

  findOwned(businessId: string, id: string): Promise<InvoiceRecord | null> {
    return this.prisma.invoice.findFirst({ where: { id, businessId }, select: INVOICE_SELECT });
  }
```

`apps/backend/src/modules/invoices/invoice-query.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { InvoiceSummaryDto, IsoDate } from '@lamma/shared';
import { InvoiceGenerator } from './invoice-generator.js';
import { type OpenInvoice, toInvoiceSummary, toOpenInvoice } from './invoice-record.js';
import { InvoiceRepository } from './invoice.repository.js';

@Injectable()
export class InvoiceQueryService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly generator: InvoiceGenerator,
  ) {}

  /** Creates any missing monthly invoices; call before reading invoices another way. */
  refresh(businessId: string, today: IsoDate): Promise<void> {
    return this.generator.ensureUpToDate(businessId, today);
  }

  /** Unpaid invoices of active customers, oldest due first. Generates missing months first. */
  async openInvoices(businessId: string, today: IsoDate): Promise<OpenInvoice[]> {
    await this.generator.ensureUpToDate(businessId, today);
    return (await this.invoices.findOpen(businessId)).map((record) => toOpenInvoice(record, today));
  }

  invoicedCustomerIds(businessId: string): Promise<Set<string>> {
    return this.invoices.invoicedCustomerIds(businessId);
  }

  /** Every invoice of one customer, newest due first. */
  async customerInvoices(businessId: string, customerId: string, today: IsoDate): Promise<InvoiceSummaryDto[]> {
    await this.generator.ensureUpToDate(businessId, today);
    return (await this.invoices.findForCustomer(businessId, customerId)).map((r) => toInvoiceSummary(r, today));
  }

  async findOne(businessId: string, invoiceId: string, today: IsoDate): Promise<OpenInvoice | null> {
    const record = await this.invoices.findOwned(businessId, invoiceId);
    return record ? toOpenInvoice(record, today) : null;
  }
}
```

`invoices.module.ts` — add `InvoiceQueryService` to `providers` and `exports`.
`invoices/index.ts` — add:

```ts
export { InvoiceQueryService } from './invoice-query.service.js';
export type { OpenInvoice } from './invoice-record.js';
```

- [ ] **Step 5: Write the customer list/detail**

`dto/list-customers-query.dto.ts`:

```ts
import { INVOICE_STATUSES, type InvoiceStatus } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class ListCustomersQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsIn([...INVOICE_STATUSES])
  status?: InvoiceStatus;
}
```

Add to `CustomersRepository` (add `toWesternDigits` import from `@lamma/shared`, `MonthlyTerms` type):

```ts
  findActive(businessId: string, search?: string): Promise<Customer[]> {
    const where: Prisma.CustomerWhereInput = { businessId, archivedAt: null };
    if (search) {
      const digits = toWesternDigits(search).replace(/\D/g, '').replace(/^0+/, '');
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      ];
    }
    return this.prisma.customer.findMany({ where });
  }

  async activeMonthlyTerms(customerId: string): Promise<MonthlyTerms[]> {
    const rows = await this.prisma.chargeAssignment.findMany({
      where: { customerId, charge: { kind: 'monthly', active: true } },
      select: { charge: { select: { amount: true, dayOfMonth: true } } },
    });
    return rows.flatMap(({ charge }) =>
      charge.dayOfMonth === null ? [] : [{ amount: charge.amount, dayOfMonth: charge.dayOfMonth }],
    );
  }
```

Add to `CustomersService` (constructor also receives `InvoiceQueryService` from `../invoices/index.js`; import `buildCustomerListItem`, `byUrgency`, `toCustomerDto`, `businessToday`, shared `nextMonthlyDue`, `statusPriority`, types):

```ts
  async list(businessId: string, query: { search?: string; status?: InvoiceStatus }): Promise<CustomerListItemDto[]> {
    const today = businessToday(this.clock.now());
    const open = await this.invoices.openInvoices(businessId, today);
    const invoiced = await this.invoices.invoicedCustomerIds(businessId);
    const customers = await this.customers.findActive(businessId, query.search);

    const openByCustomer = new Map<string, InvoiceSummaryDto[]>();
    for (const { summary } of open) {
      openByCustomer.set(summary.customerId, [...(openByCustomer.get(summary.customerId) ?? []), summary]);
    }
    const items = customers.map((customer) =>
      buildCustomerListItem(toCustomerDto(customer), openByCustomer.get(customer.id) ?? [], invoiced.has(customer.id)),
    );
    const rank = (status: InvoiceStatus | null) => (status ? statusPriority(status) : Number.MAX_SAFE_INTEGER);
    return items
      .filter((item) => !query.status || item.status === query.status)
      .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name, 'ar'));
  }

  async detail(businessId: string, id: string): Promise<CustomerDetailDto> {
    const customer = await this.getOwned(businessId, id);
    const today = businessToday(this.clock.now());
    const invoices = await this.invoices.customerInvoices(businessId, id, today);
    const open = invoices.filter((invoice) => invoice.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return {
      ...buildCustomerListItem(toCustomerDto(customer), open, invoices.length > 0),
      openInvoices: open,
      nextDue: nextMonthlyDue(await this.customers.activeMonthlyTerms(id), today),
    };
  }
```

(Rename the injected `InvoiceQueryService` parameter to `invoices`. `byUrgency` is used inside `buildCustomerListItem`; it does not need importing here.)

Add to `CustomersController` (import `Get`, `Query`, `ListCustomersQueryDto`, types):

```ts
  @Get()
  list(@CurrentBusinessId() businessId: string, @Query() query: ListCustomersQueryDto): Promise<CustomerListItemDto[]> {
    return this.customers.list(businessId, query);
  }

  @Get(':id')
  detail(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<CustomerDetailDto> {
    return this.customers.detail(businessId, id);
  }
```

`customers.module.ts` — add `InvoicesModule` (from `../invoices/index.js`) to `imports`.

- [ ] **Step 6: Run the tests**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add customer list with status, search and filters, and customer detail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Customer history timeline

**Files:**
- Create: `apps/backend/src/modules/customers/customer-history.ts` (+ `customer-history.spec.ts`)
- Modify: `customers.repository.ts`, `customers.service.ts`, `customers.controller.ts`
- Test: `apps/backend/test/customers/customer-history.e2e-spec.ts`

**Interfaces:**
- Consumes: `CustomersService.getOwned`, `InvoiceQueryService.refresh`, `computeInvoiceStatus`, `toIsoDate`, `HistoryEventDto`.
- Produces: `HistorySource` type, `buildHistory(source: HistorySource, today: IsoDate): HistoryEventDto[]` (newest first); `GET /api/v1/customers/:id/history` → `HistoryEventDto[]`

- [ ] **Step 1: Write the failing unit test**

`apps/backend/src/modules/customers/customer-history.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildHistory, type HistorySource } from './customer-history.js';

const source: HistorySource = {
  createdAt: new Date('2026-07-01T08:00:00.000Z'),
  invoices: [
    {
      id: 'sep', title: 'اشتراك', period: '2026-09', amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'), paidAt: null, _count: { claims: 0 },
      payments: [],
      reminderLogs: [{ kind: 'before', sentAt: new Date('2026-09-17T07:00:00.000Z') }],
    },
    {
      id: 'aug', title: 'اشتراك', period: '2026-08', amount: 450,
      dueDate: new Date('2026-08-20T00:00:00.000Z'), paidAt: new Date('2026-08-21T10:00:00.000Z'), _count: { claims: 0 },
      payments: [{ amount: 450, method: 'instapay', recordedAt: new Date('2026-08-21T10:00:00.000Z') }],
      reminderLogs: [],
    },
  ],
};

describe('buildHistory', () => {
  it('merges creation, invoices, payments and reminders newest first', () => {
    expect(buildHistory(source, '2026-09-23').map((e) => [e.type, e.at])).toEqual([
      ['invoice', '2026-09-20'],
      ['reminder', '2026-09-17T07:00:00.000Z'],
      ['payment', '2026-08-21T10:00:00.000Z'],
      ['invoice', '2026-08-20'],
      ['created', '2026-07-01T08:00:00.000Z'],
    ]);
  });

  it('carries computed status and payment method', () => {
    const events = buildHistory(source, '2026-09-23');
    expect(events[0]).toMatchObject({ type: 'invoice', invoiceId: 'sep', status: 'overdue', period: '2026-09' });
    expect(events[2]).toMatchObject({ type: 'payment', method: 'instapay', amount: 450 });
  });
});
```

Run → FAIL.

- [ ] **Step 2: Write `customer-history.ts`**

```ts
import { computeInvoiceStatus, type HistoryEventDto, type IsoDate, type ReminderKind } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';

export interface HistorySource {
  createdAt: Date;
  invoices: {
    id: string;
    title: string;
    period: string | null;
    amount: number;
    dueDate: Date;
    paidAt: Date | null;
    _count: { claims: number };
    payments: { amount: number; method: 'instapay' | 'cash'; recordedAt: Date }[];
    reminderLogs: { kind: ReminderKind; sentAt: Date }[];
  }[];
}

export function buildHistory(source: HistorySource, today: IsoDate): HistoryEventDto[] {
  const events: HistoryEventDto[] = [{ type: 'created', at: source.createdAt.toISOString() }];
  for (const invoice of source.invoices) {
    const dueDate = toIsoDate(invoice.dueDate);
    const base = { invoiceId: invoice.id, title: invoice.title, period: invoice.period };
    const status = computeInvoiceStatus(
      { dueDate, paidAt: invoice.paidAt, hasPendingClaim: invoice._count.claims > 0 },
      today,
    );
    events.push({ type: 'invoice', at: dueDate, ...base, amount: invoice.amount, status });
    for (const payment of invoice.payments) {
      events.push({ type: 'payment', at: payment.recordedAt.toISOString(), ...base, amount: payment.amount, method: payment.method });
    }
    for (const log of invoice.reminderLogs) {
      events.push({ type: 'reminder', at: log.sentAt.toISOString(), invoiceId: invoice.id, kind: log.kind });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}
```

Run unit tests → PASS.

- [ ] **Step 3: Write the failing e2e test**

`apps/backend/test/customers/customer-history.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('customer history (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('returns the timeline newest first', async () => {
    t.clock.set('2026-08-01T09:00:00.000Z');
    const { business, api } = await createOwner(t);
    const created = await api.post('/customers', { name: 'محمود حسن', phone: '01023456781' }).expect(201);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    t.clock.set('2026-09-23T09:00:00.000Z');
    const august = await t.prisma.invoice.findFirstOrThrow({ where: { period: '2026-08' } });
    await t.prisma.invoice.update({ where: { id: august.id }, data: { paidAt: new Date('2026-08-21T10:00:00.000Z') } });
    await t.prisma.payment.create({
      data: { invoiceId: august.id, amount: 450, method: 'cash', recordedAt: new Date('2026-08-21T10:00:00.000Z') },
    });

    const res = await api.get(`/customers/${created.body.id}/history`).expect(200);
    expect(res.body.map((e: { type: string; at: string }) => [e.type, e.at])).toEqual([
      ['invoice', '2026-09-20'],
      ['payment', '2026-08-21T10:00:00.000Z'],
      ['invoice', '2026-08-20'],
      ['created', '2026-08-01T09:00:00.000Z'],
    ]);
    expect(business.id).toBeTruthy();
  });

  it("answers 404 for another business's customer", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);
    await api.get(`/customers/${foreign.id}/history`).expect(404);
  });
});
```

Run → FAIL.

- [ ] **Step 4: Wire the endpoint**

Add to `CustomersRepository`:

```ts
  findHistorySource(customerId: string): Promise<HistorySource> {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: {
        createdAt: true,
        invoices: {
          select: {
            id: true, title: true, period: true, amount: true, dueDate: true, paidAt: true,
            _count: { select: { claims: { where: { status: 'pending' } } } },
            payments: { select: { amount: true, method: true, recordedAt: true } },
            reminderLogs: { select: { kind: true, sentAt: true } },
          },
        },
      },
    });
  }
```

Add to `CustomersService`:

```ts
  async history(businessId: string, id: string): Promise<HistoryEventDto[]> {
    await this.getOwned(businessId, id);
    const today = businessToday(this.clock.now());
    await this.invoices.refresh(businessId, today);
    return buildHistory(await this.customers.findHistorySource(id), today);
  }
```

Add to `CustomersController`:

```ts
  @Get(':id/history')
  history(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<HistoryEventDto[]> {
    return this.customers.history(businessId, id);
  }
```

- [ ] **Step 5: Run the tests and commit**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "feat(backend): add customer history timeline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit.

---

### Task 9: Recording a cash payment

**Files:**
- Create: `apps/backend/src/modules/invoices/invoices.service.ts`, `invoices.controller.ts`
- Modify: `invoice.repository.ts`, `invoices.module.ts`
- Test: `apps/backend/test/invoices/cash-payment.e2e-spec.ts`

**Interfaces:**
- Consumes: `Clock`, `businessToday`, `INVOICE_SELECT`, `toInvoiceSummary`, `AppError`.
- Produces: `POST /api/v1/invoices/:id/cash-payment` → `InvoiceSummaryDto` (status `paid`); a `Payment` row `{ method: 'cash', amount: invoice.amount }`; `409 INVOICE_ALREADY_PAID` on repeat; `404` for unknown/foreign invoices.

- [ ] **Step 1: Write the failing e2e test**

`apps/backend/test/invoices/cash-payment.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('cash payments (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  async function invoiceFor(businessId: string) {
    const customer = await createCustomer(t.prisma, businessId);
    const charge = await createCharge(t.prisma, businessId, [customer.id]);
    return createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId: customer.id });
  }

  it('marks the invoice paid and records a cash payment', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);

    const res = await api.post(`/invoices/${invoice.id}/cash-payment`).expect(201);
    expect(res.body).toMatchObject({ id: invoice.id, status: 'paid', amount: 450 });

    const payments = await t.prisma.payment.findMany({ where: { invoiceId: invoice.id } });
    expect(payments).toEqual([expect.objectContaining({ method: 'cash', amount: 450 })]);
    expect(payments[0].recordedAt.toISOString()).toBe(DEFAULT_TEST_NOW);

    const customer = await api.get(`/customers/${invoice.customerId}`).expect(200);
    expect(customer.body).toMatchObject({ balance: 0, status: 'paid' });
  });

  it('refuses to record the same invoice twice', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);
    await api.post(`/invoices/${invoice.id}/cash-payment`).expect(201);
    const again = await api.post(`/invoices/${invoice.id}/cash-payment`).expect(409);
    expect(again.body.code).toBe('INVOICE_ALREADY_PAID');
    expect(await t.prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });

  it("answers 404 for unknown and other businesses' invoices", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await invoiceFor(other.id);
    const { api } = await createOwner(t);
    await api.post(`/invoices/${foreign.id}/cash-payment`).expect(404);
    await api.post('/invoices/nope/cash-payment').expect(404);
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

Add to `InvoiceRepository`:

```ts
  /** Pays the invoice in one transaction; only the first caller wins. */
  markPaidInCash(businessId: string, id: string, now: Date): Promise<InvoiceRecord | 'not_found' | 'already_paid'> {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id, businessId }, select: { amount: true } });
      if (!invoice) return 'not_found';
      const { count } = await tx.invoice.updateMany({ where: { id, paidAt: null }, data: { paidAt: now } });
      if (count === 0) return 'already_paid';
      await tx.payment.create({ data: { invoiceId: id, amount: invoice.amount, method: 'cash', recordedAt: now } });
      return tx.invoice.findUniqueOrThrow({ where: { id }, select: INVOICE_SELECT });
    });
  }
```

`apps/backend/src/modules/invoices/invoices.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { toInvoiceSummary } from './invoice-record.js';
import { InvoiceRepository } from './invoice.repository.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly clock: Clock,
  ) {}

  async recordCash(businessId: string, id: string): Promise<InvoiceSummaryDto> {
    const now = this.clock.now();
    const result = await this.invoices.markPaidInCash(businessId, id, now);
    if (result === 'not_found') throw new AppError('NOT_FOUND', 'Invoice not found');
    if (result === 'already_paid') throw new AppError('INVOICE_ALREADY_PAID', 'Invoice already paid');
    return toInvoiceSummary(result, businessToday(now));
  }
}
```

`apps/backend/src/modules/invoices/invoices.controller.ts`:

```ts
import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post(':id/cash-payment')
  recordCash(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<InvoiceSummaryDto> {
    return this.invoices.recordCash(businessId, id);
  }
}
```

`invoices.module.ts` — add `controllers: [InvoicesController]` and `InvoicesService` to `providers`.

- [ ] **Step 3: Run the tests and commit**

```bash
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "feat(backend): record cash payments on invoices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit.

---

### Task 10: Reminders — rule, today's queue, single-invoice reminder, mark sent

**Files:**
- Create (`apps/backend/src/modules/reminders/`): `index.ts`, `reminders.module.ts`, `reminders.controller.ts`, `reminders.service.ts`, `reminder-queue.service.ts`, `reminder-rule.repository.ts`, `reminder-log.repository.ts`, `reminder-schedule.ts` (+ `reminder-schedule.spec.ts`), `reminder-item.ts`, `dto/update-reminder-rule.dto.ts`, `dto/mark-sent.dto.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/reminders/reminder-rule.e2e-spec.ts`, `apps/backend/test/reminders/today-reminders.e2e-spec.ts`

**Interfaces:**
- Consumes: `InvoiceQueryService.openInvoices/findOne`, `OpenInvoice`, `BusinessService.getById`, `ENV` (`WEB_BASE_URL`), `Clock`; shared `buildReminderMessage`, `whatsappUrl`, `payLink`, `invoiceDisplayTitle`, `daysBetween`, `toBusinessDate`, `REMINDER_KINDS`.
- Produces:
  - `reminderKindForToday(invoice: { dueDate; promisedDate; status }, rule: ReminderRuleDto, today): ReminderKind | null`
  - `ReminderQueueService.today(businessId): Promise<TodayRemindersDto>` (exported via `reminders/index.ts` with `RemindersModule`)
  - `GET /api/v1/reminders/rule` → `ReminderRuleDto`; `PUT /api/v1/reminders/rule` → `ReminderRuleDto`
  - `GET /api/v1/reminders/today` → `TodayRemindersDto` (order: before, on_due, promise, after)
  - `GET /api/v1/reminders/invoices/:invoiceId` → `ReminderItemDto` (today's scheduled kind, else `manual`; `409 INVOICE_ALREADY_PAID` if paid)
  - `POST /api/v1/reminders/:invoiceId/sent` `{ kind }` → `204` (logs `whatsapp_link`)
  - Messages are Arabic (customers are Egyptian; English customer copy comes with the web app)

- [ ] **Step 1: Write the failing unit test**

`apps/backend/src/modules/reminders/reminder-schedule.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { reminderKindForToday } from './reminder-schedule.js';

const rule = { beforeDays: 3, onDueDate: true, afterDays: 3 };
const today = '2026-09-23';
const kind = (dueDate: string, extra: Partial<{ promisedDate: string | null; status: 'overdue' | 'due_soon' | 'upcoming' | 'paid' | 'awaiting_confirmation' }> = {}) =>
  reminderKindForToday({ dueDate, promisedDate: null, status: 'due_soon', ...extra }, rule, today);

describe('reminderKindForToday', () => {
  it('fires exactly on the rule offsets', () => {
    expect(kind('2026-09-26')).toBe('before');
    expect(kind('2026-09-23')).toBe('on_due');
    expect(kind('2026-09-20', { status: 'overdue' })).toBe('after');
    expect(kind('2026-09-25')).toBeNull();
    expect(kind('2026-09-01', { status: 'overdue' })).toBeNull();
  });

  it('fires on a promised date, before the other rules', () => {
    expect(kind('2026-09-10', { status: 'overdue', promisedDate: today })).toBe('promise');
  });

  it('never fires for paid or awaiting invoices', () => {
    expect(kind('2026-09-26', { status: 'paid' })).toBeNull();
    expect(kind('2026-09-20', { status: 'awaiting_confirmation' })).toBeNull();
  });

  it('respects disabled rules', () => {
    const off = { beforeDays: null, onDueDate: false, afterDays: null };
    expect(reminderKindForToday({ dueDate: '2026-09-26', promisedDate: null, status: 'due_soon' }, off, today)).toBeNull();
    expect(reminderKindForToday({ dueDate: '2026-09-23', promisedDate: null, status: 'due_soon' }, off, today)).toBeNull();
  });
});
```

Run → FAIL.

- [ ] **Step 2: Write `reminder-schedule.ts`**

```ts
import { daysBetween, type InvoiceStatus, type IsoDate, type ReminderKind, type ReminderRuleDto } from '@lamma/shared';

export interface SchedulableInvoice {
  dueDate: IsoDate;
  promisedDate: IsoDate | null;
  status: InvoiceStatus;
}

/** Which reminder (if any) this invoice gets today under the business's rule. */
export function reminderKindForToday(
  invoice: SchedulableInvoice,
  rule: ReminderRuleDto,
  today: IsoDate,
): ReminderKind | null {
  if (invoice.status === 'paid' || invoice.status === 'awaiting_confirmation') return null;
  if (invoice.promisedDate === today) return 'promise';
  const daysUntilDue = daysBetween(today, invoice.dueDate);
  if (rule.beforeDays !== null && daysUntilDue === rule.beforeDays) return 'before';
  if (rule.onDueDate && daysUntilDue === 0) return 'on_due';
  if (rule.afterDays !== null && daysUntilDue === -rule.afterDays) return 'after';
  return null;
}
```

Run unit tests → PASS.

- [ ] **Step 3: Write the failing e2e tests**

`apps/backend/test/reminders/reminder-rule.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createOwner } from '../support/owner.js';

describe('reminder rule (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('defaults to all three reminders, even for businesses without a stored rule', async () => {
    const { api } = await createOwner(t);
    const res = await api.get('/reminders/rule').expect(200);
    expect(res.body).toEqual({ beforeDays: 3, onDueDate: true, afterDays: 3 });
  });

  it('saves a new rule and allows turning offsets off with null', async () => {
    const { api } = await createOwner(t);
    await api.put('/reminders/rule', { beforeDays: null, onDueDate: true, afterDays: 5 }).expect(200);
    const res = await api.get('/reminders/rule').expect(200);
    expect(res.body).toEqual({ beforeDays: null, onDueDate: true, afterDays: 5 });
  });

  it('validates every field', async () => {
    const { api } = await createOwner(t);
    await api.put('/reminders/rule', { beforeDays: 0, onDueDate: true, afterDays: 3 }).expect(400);
    await api.put('/reminders/rule', { beforeDays: 3, afterDays: 3 }).expect(400);
    await api.put('/reminders/rule', { onDueDate: true, afterDays: 3 }).expect(400);
  });
});
```

`apps/backend/test/reminders/today-reminders.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner, type OwnerApi } from '../support/owner.js';

describe("today's reminders (e2e)", () => {
  let t: TestApp;
  let api: OwnerApi;
  let ids: Record<string, string>;

  beforeEach(async () => {
    t = await createTestApp();
    const owner = await createOwner(t);
    api = owner.api;
    const businessId = owner.business.id;
    const customer = (name: string, phone: string, gender: 'male' | 'female' | null = null) =>
      createCustomer(t.prisma, businessId, { name, phone, gender });
    const sara = await customer('سارة', '+201112345678', 'female');
    const dina = await customer('دينا', '+201012345671');
    const mahmoud = await customer('محمود', '+201023456781', 'male');
    const youssef = await customer('يوسف', '+201012345672');
    const mona = await customer('منى', '+201012345673');
    const ahmed = await customer('أحمد', '+201012345674');
    const karim = await customer('كريم', '+201012345675');
    const charge = await createCharge(t.prisma, businessId, [sara, dina, mahmoud, youssef, mona, ahmed, karim].map((c) => c.id));
    const invoice = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, period: '2026-09', dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    ids = {
      before: (await invoice(sara.id, '2026-09-26')).id,
      onDue: (await invoice(dina.id, '2026-09-23', { title: 'تيشيرت', period: null, amount: 150 })).id,
      after: (await invoice(mahmoud.id, '2026-09-20')).id,
      longLate: (await invoice(youssef.id, '2026-09-01')).id,
      paid: (await invoice(mona.id, '2026-09-20', { paidAt: new Date() })).id,
      promise: (await invoice(karim.id, '2026-09-10', { promisedDate: new Date('2026-09-23T00:00:00.000Z') })).id,
    };
    const claimed = await invoice(ahmed.id, '2026-09-20');
    await createPendingClaim(t.prisma, claimed.id);
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('lists the reminders due today in order, with ready-to-send messages', async () => {
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body).toMatchObject({ date: '2026-09-23', total: 4, sentCount: 0 });
    expect(res.body.items.map((i: { invoiceId: string; kind: string }) => [i.invoiceId, i.kind])).toEqual([
      [ids.before, 'before'],
      [ids.onDue, 'on_due'],
      [ids.promise, 'promise'],
      [ids.after, 'after'],
    ]);

    const sara = res.body.items[0];
    const token = (await t.prisma.invoice.findUniqueOrThrow({ where: { id: ids.before } })).publicToken;
    expect(sara.message).toBe(
      'أهلاً أستاذة سارة،\nفاضل 3 أيام على ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        `تقدري تدفعي من هنا في دقيقة:\nhttp://localhost:3001/p/${token}`,
    );
    expect(sara.waUrl).toBe(`https://wa.me/201112345678?text=${encodeURIComponent(sara.message)}`);
    expect(res.body.items[1].message).toContain('النهارده ميعاد تيشيرت');
  });

  it('marks a reminder as sent', async () => {
    await api.post(`/reminders/${ids.after}/sent`, { kind: 'after' }).expect(204);
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.sentCount).toBe(1);
    expect(res.body.items.find((i: { invoiceId: string }) => i.invoiceId === ids.after).sent).toBe(true);
    const logs = await t.prisma.reminderLog.findMany({ where: { invoiceId: ids.after } });
    expect(logs).toEqual([expect.objectContaining({ kind: 'after', channel: 'whatsapp_link' })]);
  });

  it('a reminder sent before Cairo midnight does not count for today', async () => {
    t.clock.set('2026-09-22T22:30:00.000Z'); // 01:30 on the 23rd in Cairo
    await t.prisma.reminderLog.create({
      data: { invoiceId: ids.after, kind: 'after', channel: 'whatsapp_link', sentAt: new Date('2026-09-22T20:30:00.000Z') },
    });
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.date).toBe('2026-09-23');
    expect(res.body.sentCount).toBe(0);
  });

  it('follows the rule', async () => {
    await api.put('/reminders/rule', { beforeDays: 3, onDueDate: true, afterDays: null }).expect(200);
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.items.map((i: { kind: string }) => i.kind)).toEqual(['before', 'on_due', 'promise']);
  });

  it('builds a manual reminder for any open invoice', async () => {
    const res = await api.get(`/reminders/invoices/${ids.longLate}`).expect(200);
    expect(res.body).toMatchObject({ kind: 'manual', status: 'overdue' });
    expect(res.body.message).toContain('عدّى ميعاده بـ 22 يوم.');
    const paid = await api.get(`/reminders/invoices/${ids.paid}`).expect(409);
    expect(paid.body.code).toBe('INVOICE_ALREADY_PAID');
  });

  it("refuses other businesses' invoices and bad kinds", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201199999999' });
    const outsider = await createOwner(t, { phone: '+201199999998' });
    expect(other.id).toBeTruthy();
    await outsider.api.post(`/reminders/${ids.after}/sent`, { kind: 'after' }).expect(404);
    await outsider.api.get(`/reminders/invoices/${ids.after}`).expect(404);
    await api.post(`/reminders/${ids.after}/sent`, { kind: 'shout' }).expect(400);
  });
});
```

Run → FAIL.

- [ ] **Step 4: Write the repositories, item builder and services**

`reminder-rule.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ReminderRuleDto } from '@lamma/shared';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

const SELECT = { beforeDays: true, onDueDate: true, afterDays: true } as const;

@Injectable()
export class ReminderRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the default rule on first read for businesses that predate it. */
  get(businessId: string): Promise<ReminderRuleDto> {
    return this.prisma.reminderRule.upsert({
      where: { businessId },
      create: { businessId },
      update: {},
      select: SELECT,
    });
  }

  save(businessId: string, rule: ReminderRuleDto): Promise<ReminderRuleDto> {
    return this.prisma.reminderRule.upsert({
      where: { businessId },
      create: { businessId, ...rule },
      update: rule,
      select: SELECT,
    });
  }
}
```

`reminder-log.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ReminderKind } from '@lamma/shared';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class ReminderLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(invoiceId: string, kind: ReminderKind, sentAt: Date): Promise<void> {
    await this.prisma.reminderLog.create({ data: { invoiceId, kind, channel: 'whatsapp_link', sentAt } });
  }

  findSince(businessId: string, since: Date): Promise<{ invoiceId: string; sentAt: Date }[]> {
    return this.prisma.reminderLog.findMany({
      where: { sentAt: { gte: since }, invoice: { businessId } },
      select: { invoiceId: true, sentAt: true },
    });
  }
}
```

`reminder-item.ts`:

```ts
import {
  buildReminderMessage,
  daysBetween,
  invoiceDisplayTitle,
  type IsoDate,
  payLink,
  type ReminderItemDto,
  type ReminderKind,
  whatsappUrl,
} from '@lamma/shared';
import type { OpenInvoice } from '../invoices/index.js';

export interface ReminderContext {
  businessName: string;
  webBaseUrl: string;
  today: IsoDate;
  sentInvoiceIds: Set<string>;
}

export function toReminderItem(open: OpenInvoice, kind: ReminderKind, context: ReminderContext): ReminderItemDto {
  const { summary, customer } = open;
  const message = buildReminderMessage({
    locale: 'ar',
    customerName: customer.name,
    gender: customer.gender,
    businessName: context.businessName,
    title: invoiceDisplayTitle(summary, 'ar'),
    amount: summary.amount,
    daysUntilDue: daysBetween(context.today, summary.dueDate),
    link: payLink(context.webBaseUrl, summary.publicToken),
  });
  return {
    invoiceId: summary.id,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    title: summary.title,
    period: summary.period,
    amount: summary.amount,
    dueDate: summary.dueDate,
    status: summary.status,
    kind,
    message,
    waUrl: whatsappUrl(customer.phone, message),
    sent: context.sentInvoiceIds.has(summary.id),
  };
}
```

`reminder-queue.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { type ReminderKind, type TodayRemindersDto, toBusinessDate } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { ENV, type Env } from '../../config/env.js';
import { BusinessService } from '../business/index.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { type ReminderContext, toReminderItem } from './reminder-item.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { reminderKindForToday } from './reminder-schedule.js';

const KIND_ORDER: ReminderKind[] = ['before', 'on_due', 'promise', 'after', 'manual'];
const LOOKBACK_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class ReminderQueueService {
  constructor(
    private readonly invoices: InvoiceQueryService,
    private readonly businesses: BusinessService,
    private readonly rules: ReminderRuleRepository,
    private readonly logs: ReminderLogRepository,
    private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async context(businessId: string): Promise<ReminderContext> {
    const now = this.clock.now();
    const today = businessToday(now);
    const business = await this.businesses.getById(businessId);
    const recent = await this.logs.findSince(businessId, new Date(now.getTime() - LOOKBACK_MS));
    const sentToday = recent.filter((log) => toBusinessDate(log.sentAt) === today).map((log) => log.invoiceId);
    return { businessName: business.name, webBaseUrl: this.env.WEB_BASE_URL, today, sentInvoiceIds: new Set(sentToday) };
  }

  async today(businessId: string): Promise<TodayRemindersDto> {
    const context = await this.context(businessId);
    const rule = await this.rules.get(businessId);
    const open = await this.invoices.openInvoices(businessId, context.today);
    const items = open
      .flatMap((invoice) => {
        const kind = reminderKindForToday({ ...invoice.summary, promisedDate: invoice.promisedDate }, rule, context.today);
        return kind ? [toReminderItem(invoice, kind, context)] : [];
      })
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    return { date: context.today, total: items.length, sentCount: items.filter((i) => i.sent).length, items };
  }
}
```

`reminders.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { ReminderItemDto, ReminderKind, ReminderRuleDto } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { toReminderItem } from './reminder-item.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { reminderKindForToday } from './reminder-schedule.js';

@Injectable()
export class RemindersService {
  constructor(
    private readonly rules: ReminderRuleRepository,
    private readonly logs: ReminderLogRepository,
    private readonly queue: ReminderQueueService,
    private readonly invoices: InvoiceQueryService,
    private readonly clock: Clock,
  ) {}

  getRule(businessId: string): Promise<ReminderRuleDto> {
    return this.rules.get(businessId);
  }

  saveRule(businessId: string, rule: ReminderRuleDto): Promise<ReminderRuleDto> {
    return this.rules.save(businessId, rule);
  }

  async forInvoice(businessId: string, invoiceId: string): Promise<ReminderItemDto> {
    const context = await this.queue.context(businessId);
    const invoice = await this.invoices.findOne(businessId, invoiceId, context.today);
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found');
    if (invoice.summary.status === 'paid') throw new AppError('INVOICE_ALREADY_PAID', 'Invoice already paid');
    const rule = await this.rules.get(businessId);
    const scheduled = reminderKindForToday({ ...invoice.summary, promisedDate: invoice.promisedDate }, rule, context.today);
    return toReminderItem(invoice, scheduled ?? 'manual', context);
  }

  async markSent(businessId: string, invoiceId: string, kind: ReminderKind): Promise<void> {
    const now = this.clock.now();
    const invoice = await this.invoices.findOne(businessId, invoiceId, businessToday(now));
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found');
    await this.logs.create(invoiceId, kind, now);
  }
}
```

`dto/update-reminder-rule.dto.ts`:

```ts
import type { ReminderRuleDto } from '@lamma/shared';
import { IsBoolean, IsInt, Max, Min, ValidateIf } from 'class-validator';

/** Every field is required; offsets may be null to switch them off. */
export class UpdateReminderRuleDto implements ReminderRuleDto {
  @ValidateIf((o: UpdateReminderRuleDto) => o.beforeDays !== null)
  @IsInt()
  @Min(1)
  @Max(7)
  beforeDays: number | null;

  @IsBoolean()
  onDueDate: boolean;

  @ValidateIf((o: UpdateReminderRuleDto) => o.afterDays !== null)
  @IsInt()
  @Min(1)
  @Max(30)
  afterDays: number | null;
}
```

`dto/mark-sent.dto.ts`:

```ts
import { type MarkSentInput, REMINDER_KINDS, type ReminderKind } from '@lamma/shared';
import { IsIn } from 'class-validator';

export class MarkSentDto implements MarkSentInput {
  @IsIn([...REMINDER_KINDS])
  kind: ReminderKind;
}
```

`reminders.controller.ts`:

```ts
import { Body, Controller, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { ReminderItemDto, ReminderRuleDto, TodayRemindersDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { MarkSentDto } from './dto/mark-sent.dto.js';
import { UpdateReminderRuleDto } from './dto/update-reminder-rule.dto.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly queue: ReminderQueueService,
  ) {}

  @Get('rule')
  getRule(@CurrentBusinessId() businessId: string): Promise<ReminderRuleDto> {
    return this.reminders.getRule(businessId);
  }

  @Put('rule')
  saveRule(@CurrentBusinessId() businessId: string, @Body() dto: UpdateReminderRuleDto): Promise<ReminderRuleDto> {
    return this.reminders.saveRule(businessId, {
      beforeDays: dto.beforeDays,
      onDueDate: dto.onDueDate,
      afterDays: dto.afterDays,
    });
  }

  @Get('today')
  today(@CurrentBusinessId() businessId: string): Promise<TodayRemindersDto> {
    return this.queue.today(businessId);
  }

  @Get('invoices/:invoiceId')
  forInvoice(@CurrentBusinessId() businessId: string, @Param('invoiceId') invoiceId: string): Promise<ReminderItemDto> {
    return this.reminders.forInvoice(businessId, invoiceId);
  }

  @Post(':invoiceId/sent')
  @HttpCode(204)
  async markSent(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: MarkSentDto,
  ): Promise<void> {
    await this.reminders.markSent(businessId, invoiceId, dto.kind);
  }
}
```

`reminders.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [BusinessModule, InvoicesModule],
  controllers: [RemindersController],
  providers: [ReminderRuleRepository, ReminderLogRepository, ReminderQueueService, RemindersService],
  exports: [ReminderQueueService],
})
export class RemindersModule {}
```

`index.ts`:

```ts
export { RemindersModule } from './reminders.module.js';
export { ReminderQueueService } from './reminder-queue.service.js';
```

Register `RemindersModule` (from its `index.js`) in `app.module.ts`.

- [ ] **Step 5: Run the tests and commit**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "feat(backend): add reminder rule, today's WhatsApp reminders and sent tracking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit.

---

### Task 11: Home dashboard

**Files:**
- Create (`apps/backend/src/modules/dashboard/`): `index.ts`, `dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`
- Modify: `apps/backend/src/modules/invoices/invoice.repository.ts`, `invoice-query.service.ts`; `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/dashboard/home-dashboard.e2e-spec.ts`

**Interfaces:**
- Consumes: `BusinessService`, `CustomersService.list`, `InvoiceQueryService.openInvoices`, `ReminderQueueService.today`, `Clock`; shared `periodOf`, `periodRange`.
- Produces:
  - `InvoiceQueryService.periodSummary(businessId, period): Promise<{ expected: number; collected: number; invoiceCount: number; paidCount: number }>` — invoices of active customers whose `period` is that month, plus one-time invoices due in that month
  - `GET /api/v1/dashboard/home` → `HomeDashboardDto` (`collectedPercent` rounded down; `overdueCustomers` max 5; reminder `preview` max 4)

- [ ] **Step 1: Write the failing e2e test**

`apps/backend/test/dashboard/home-dashboard.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('home dashboard (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('summarizes the month, overdue money, confirmations and reminders', async () => {
    const { business, api } = await createOwner(t);
    const businessId = business.id;
    const c = (name: string, phone: string, extra = {}) => createCustomer(t.prisma, businessId, { name, phone, ...extra });
    const mona = await c('منى', '+201012345601');
    const mahmoud = await c('محمود', '+201012345602');
    const ahmed = await c('أحمد', '+201012345603');
    const sara = await c('سارة', '+201012345604');
    const youssef = await c('يوسف', '+201012345605');
    const gone = await c('قديم', '+201012345606', { archivedAt: new Date() });
    const charge = await createCharge(t.prisma, businessId, [mona, mahmoud, ahmed, sara, youssef, gone].map((x) => x.id));
    const inv = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, period: '2026-09', dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    await inv(mona.id, '2026-09-20', { paidAt: new Date('2026-09-19T10:00:00.000Z') });
    await inv(mahmoud.id, '2026-09-20');
    const claimed = await inv(ahmed.id, '2026-09-20', { amount: 600 });
    await createPendingClaim(t.prisma, claimed.id);
    await inv(sara.id, '2026-09-26', { amount: 900 });
    await inv(youssef.id, '2026-08-20', { period: '2026-08', amount: 300 });
    await inv(gone.id, '2026-09-20', { amount: 5000 });

    const res = await api.get('/dashboard/home').expect(200);
    expect(res.body).toMatchObject({
      businessName: 'أكاديمية النجوم للكرة',
      period: '2026-09',
      expected: 2400,
      collected: 450,
      remaining: 1950,
      collectedPercent: 18,
      overdue: { amount: 750, customerCount: 2 },
      awaitingConfirmationCount: 1,
      todayReminders: { total: 2, sentCount: 0, preview: [{ customerName: 'سارة' }, { customerName: 'محمود' }] },
    });
    expect(res.body.overdueCustomers.map((x: { name: string }) => x.name).sort()).toEqual(['محمود', 'يوسف'].sort());
  });

  it('is all zeros for a brand-new business', async () => {
    const { api } = await createOwner(t);
    const res = await api.get('/dashboard/home').expect(200);
    expect(res.body).toMatchObject({ expected: 0, collected: 0, remaining: 0, collectedPercent: 0, overdueCustomers: [] });
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

Add to `InvoiceRepository` (import `fromIsoDate`; shared `periodRange`):

```ts
  findForPeriod(businessId: string, period: string): Promise<{ amount: number; paidAt: Date | null }[]> {
    const { start, end } = periodRange(period);
    return this.prisma.invoice.findMany({
      where: {
        businessId,
        customer: { archivedAt: null },
        OR: [{ period }, { period: null, dueDate: { gte: fromIsoDate(start), lte: fromIsoDate(end) } }],
      },
      select: { amount: true, paidAt: true },
    });
  }
```

Add to `InvoiceQueryService`:

```ts
  async periodSummary(
    businessId: string,
    period: string,
  ): Promise<{ expected: number; collected: number; invoiceCount: number; paidCount: number }> {
    const rows = await this.invoices.findForPeriod(businessId, period);
    const paid = rows.filter((row) => row.paidAt !== null);
    return {
      expected: rows.reduce((sum, row) => sum + row.amount, 0),
      collected: paid.reduce((sum, row) => sum + row.amount, 0),
      invoiceCount: rows.length,
      paidCount: paid.length,
    };
  }
```

`dashboard.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { type HomeDashboardDto, periodOf } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { BusinessService } from '../business/index.js';
import { CustomersService } from '../customers/index.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { ReminderQueueService } from '../reminders/index.js';

const OVERDUE_PREVIEW = 5;
const REMINDER_PREVIEW = 4;

@Injectable()
export class DashboardService {
  constructor(
    private readonly businesses: BusinessService,
    private readonly customers: CustomersService,
    private readonly invoices: InvoiceQueryService,
    private readonly reminders: ReminderQueueService,
    private readonly clock: Clock,
  ) {}

  async home(businessId: string): Promise<HomeDashboardDto> {
    const today = businessToday(this.clock.now());
    const period = periodOf(today);
    const business = await this.businesses.getById(businessId);
    const open = await this.invoices.openInvoices(businessId, today);
    const totals = await this.invoices.periodSummary(businessId, period);
    const reminders = await this.reminders.today(businessId);
    const overdueCustomers = await this.customers.list(businessId, { status: 'overdue' });

    const overdue = open.filter((invoice) => invoice.summary.status === 'overdue');
    return {
      businessName: business.name,
      period,
      expected: totals.expected,
      collected: totals.collected,
      remaining: totals.expected - totals.collected,
      collectedPercent: totals.expected === 0 ? 0 : Math.floor((totals.collected * 100) / totals.expected),
      overdue: {
        amount: overdue.reduce((sum, invoice) => sum + invoice.summary.amount, 0),
        customerCount: new Set(overdue.map((invoice) => invoice.customer.id)).size,
      },
      awaitingConfirmationCount: open.filter((invoice) => invoice.summary.status === 'awaiting_confirmation').length,
      todayReminders: {
        total: reminders.total,
        sentCount: reminders.sentCount,
        preview: reminders.items.slice(0, REMINDER_PREVIEW).map((item) => ({ customerName: item.customerName })),
      },
      overdueCustomers: overdueCustomers.slice(0, OVERDUE_PREVIEW),
    };
  }
}
```

`dashboard.controller.ts`:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { HomeDashboardDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('home')
  home(@CurrentBusinessId() businessId: string): Promise<HomeDashboardDto> {
    return this.dashboard.home(businessId);
  }
}
```

`dashboard.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/index.js';
import { CustomersModule } from '../customers/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { RemindersModule } from '../reminders/index.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [BusinessModule, CustomersModule, InvoicesModule, RemindersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
```

`index.ts`:

```ts
export { DashboardModule } from './dashboard.module.js';
```

Register `DashboardModule` in `app.module.ts`.

- [ ] **Step 3: Run the tests and commit**

```bash
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "feat(backend): add home dashboard summary

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit.

---

### Task 12: Monthly report

**Files:**
- Create (`apps/backend/src/modules/reports/`): `index.ts`, `reports.module.ts`, `reports.controller.ts`, `reports.service.ts`, `dto/monthly-report-query.dto.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/reports/monthly-report.e2e-spec.ts`

**Interfaces:**
- Consumes: `InvoiceQueryService.periodSummary`, `CustomersService.list`, `Clock`; shared `periodOf`, `previousPeriod`.
- Produces: `GET /api/v1/reports/monthly?period=YYYY-MM` (defaults to the current month) → `MonthlyReportDto`; `stillLate` = all overdue customers.

- [ ] **Step 1: Write the failing e2e test**

`apps/backend/test/reports/monthly-report.e2e-spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCharge, createCustomer, createInvoice } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('monthly report (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('compares the month with the previous one and lists who is still late', async () => {
    const { business, api } = await createOwner(t);
    const a = await createCustomer(t.prisma, business.id, { name: 'منى', phone: '+201012345601' });
    const b = await createCustomer(t.prisma, business.id, { name: 'محمود', phone: '+201012345602' });
    const charge = await createCharge(t.prisma, business.id, [a.id, b.id]);
    const inv = (customerId: string, period: string, due: string, paid: boolean) =>
      createInvoice(t.prisma, {
        businessId: business.id, chargeId: charge.id, customerId, period,
        dueDate: new Date(`${due}T00:00:00.000Z`), paidAt: paid ? new Date(`${due}T10:00:00.000Z`) : null,
      });
    await inv(a.id, '2026-08', '2026-08-20', true);
    await inv(b.id, '2026-08', '2026-08-20', true);
    await inv(a.id, '2026-09', '2026-09-20', true);
    await inv(b.id, '2026-09', '2026-09-20', false);

    const res = await api.get('/reports/monthly').expect(200);
    expect(res.body).toMatchObject({
      period: '2026-09',
      expected: 900,
      collected: 450,
      previousCollected: 900,
      invoiceCount: 2,
      paidInvoiceCount: 1,
    });
    expect(res.body.stillLate.map((c: { name: string }) => c.name)).toEqual(['محمود']);

    const august = await api.get('/reports/monthly?period=2026-08').expect(200);
    expect(august.body).toMatchObject({ period: '2026-08', collected: 900, invoiceCount: 2 });
  });

  it('rejects malformed periods', async () => {
    const { api } = await createOwner(t);
    await api.get('/reports/monthly?period=2026-13').expect(400);
    await api.get('/reports/monthly?period=sept').expect(400);
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

`dto/monthly-report-query.dto.ts`:

```ts
import { IsOptional, Matches } from 'class-validator';

export class MonthlyReportQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  period?: string;
}
```

`reports.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { type MonthlyReportDto, periodOf, previousPeriod } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { CustomersService } from '../customers/index.js';
import { InvoiceQueryService } from '../invoices/index.js';

@Injectable()
export class ReportsService {
  constructor(
    private readonly invoices: InvoiceQueryService,
    private readonly customers: CustomersService,
    private readonly clock: Clock,
  ) {}

  async monthly(businessId: string, requested?: string): Promise<MonthlyReportDto> {
    const period = requested ?? periodOf(businessToday(this.clock.now()));
    const stillLate = await this.customers.list(businessId, { status: 'overdue' });
    const current = await this.invoices.periodSummary(businessId, period);
    const previous = await this.invoices.periodSummary(businessId, previousPeriod(period));
    return {
      period,
      expected: current.expected,
      collected: current.collected,
      previousCollected: previous.collected,
      invoiceCount: current.invoiceCount,
      paidInvoiceCount: current.paidCount,
      stillLate,
    };
  }
}
```

`reports.controller.ts`:

```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { MonthlyReportDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('monthly')
  monthly(@CurrentBusinessId() businessId: string, @Query() query: MonthlyReportQueryDto): Promise<MonthlyReportDto> {
    return this.reports.monthly(businessId, query.period);
  }
}
```

`reports.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [CustomersModule, InvoicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

`index.ts`:

```ts
export { ReportsModule } from './reports.module.js';
```

Register `ReportsModule` in `app.module.ts`.

- [ ] **Step 3: Run the tests and commit**

```bash
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "feat(backend): add monthly report

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit.

---

### Task 13: OTP — a correct code does not use up an attempt

**Files:**
- Modify: `apps/backend/src/modules/auth/otp/otp.repository.ts`, `otp.service.ts`, `otp.service.spec.ts`, `apps/backend/src/testing/in-memory-otp.repository.ts`
- Test: `apps/backend/test/auth/signup-login.e2e-spec.ts` (one new test)

**Interfaces:**
- Consumes: Phase 1 `OtpService.check`, `OtpRepository.reserveAttempt`.
- Produces: `OtpRepository.refundAttempt(id: string): Promise<void>`; `check()` refunds the reserved attempt when the code matches. Concurrency guarantee unchanged (wrong guesses still reserve atomically).

- [ ] **Step 1: Write the failing tests**

Add to `otp.service.spec.ts` (inside the existing `describe`):

```ts
  it('does not count correct checks against the attempt limit', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      await expect(service.check(target, wrong, after(i + 1))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, right, after(10))).resolves.toEqual(expect.any(String));
    await expect(service.check(target, right, after(11))).resolves.toEqual(expect.any(String));
  });
```

Add to `apps/backend/test/auth/signup-login.e2e-spec.ts`:

```ts
  it('lets a new owner sign up after typos and a login probe with the same code', async () => {
    const code = await requestCode(t);
    const wrong = code === '000000' ? '111111' : '000000';
    // 4 typos + the probe + signup = 6 checks; without the refund the 6th would hit the 5-attempt limit.
    for (let i = 0; i < 4; i++) await verify(t, { contact: OWNER_PHONE, code: wrong }).expect(400);
    await verify(t, { contact: OWNER_PHONE, code }).expect(404);
    await verify(t, { contact: OWNER_PHONE, code, signup: SIGNUP }).expect(200);
  });
```

Run: `yarn workspace @lamma/backend test` → the new unit test FAILS with `OTP_TOO_MANY_ATTEMPTS`.

- [ ] **Step 2: Implement the refund**

Add to `OtpRepository`:

```ts
  /** Gives back an attempt reserved by a check whose code turned out to be right. */
  async refundAttempt(id: string): Promise<void> {
    await this.prisma.otpCode.updateMany({ where: { id, attempts: { gt: 0 } }, data: { attempts: { decrement: 1 } } });
  }
```

Add to `InMemoryOtpRepository`:

```ts
  async refundAttempt(id: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record && record.attempts > 0) record.attempts -= 1;
  }
```

In `OtpService.check`, after the hash comparison succeeds and before `return latest.id;`:

```ts
    await this.otps.refundAttempt(latest.id);
```

- [ ] **Step 3: Run the tests and commit**

```bash
yarn workspace @lamma/backend test
yarn workspace @lamma/backend test:e2e
yarn lint
git add apps/backend
git commit -m "fix(backend): don't count correct OTP checks against the attempt limit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS before the commit, including the existing "counts concurrent wrong guesses atomically" test.

---

### Task 14: API reference in the README and full verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: every endpoint from Tasks 4–12.
- Produces: an "API (v1)" section; a verified green build.

- [ ] **Step 1: Add the API section to `README.md`** (after "Everyday commands")

````markdown
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
````

- [ ] **Step 2: Full verification from a clean install**

```bash
yarn install
yarn lint
yarn test
yarn test:e2e
yarn workspace @lamma/backend build
```

Expected: every command exits 0.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add API reference for Phase 2 endpoints

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
