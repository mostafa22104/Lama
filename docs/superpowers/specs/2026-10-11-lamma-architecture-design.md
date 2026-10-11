# Lamma (لَمّة) — Architecture Design

- **Date:** 2026-10-11
- **Status:** Draft — awaiting review
- **Design source:** `lamma-design-handoff/` (HANDOFF.md, screenshots, screens, source-dc, tokens)

## 1. Goal

Turn the Claude Design handoff for Lamma into a working product:

- **Owner mobile app** (React Native CLI, iOS + Android) — business owners track who owes what, send WhatsApp reminders, and confirm payments.
- **Customer web app** (Next.js) — public pay link `/p/:token` opened from WhatsApp with no account, plus the marketing landing page.
- **Backend** (Node.js / NestJS) — API, business rules, AI screenshot/notebook reading, background jobs.

Non-functional requirements from the user:

- Feature-based architecture in every app.
- Light **and** dark theme.
- Localization (Arabic default, RTL; English second, LTR).
- Shared, reusable components.
- Small, readable files — no large single-file screens or services.

Success = every screen in the handoff (except `Start`, `DashboardDesktop`, `WaReminder`, `WaConfirmed` which are references) is implemented and wired to the real backend, matching the screenshots, in both themes and both languages.

## 2. Decisions

| Topic | Decision |
|---|---|
| Repo | Monorepo, **Yarn workspaces** (`nodeLinker: node-modules`, friendlier to Metro than pnpm symlinks) |
| Backend | **NestJS + PostgreSQL + Prisma**, REST `/api/v1` |
| Jobs | **BullMQ + Redis** |
| Mobile | **React Native CLI** (bare), TypeScript, **React Navigation** |
| Mobile state | **TanStack Query** (server state) + **Zustand** (auth, theme, language) persisted with **MMKV** |
| Web | **Next.js (App Router) + Tailwind**, TypeScript |
| Auth | **OTP code** to phone or email → JWT access + refresh tokens. No passwords. |
| Screenshot OCR | **Tesseract.js** (free, runs in backend, data stays private) + regex parser |
| Notebook photo → table | **Google Gemini API free tier** (vision → JSON rows with confidence) |
| AI wiring | Behind `ScreenshotReader` and `NotebookReader` interfaces; fake implementations for dev/tests |
| WhatsApp | v1: `wa.me` deep links, logged as sent. Pro auto-send = `WhatsAppSender` interface with a no-op stub |
| Storage | `StorageService` interface; local disk in dev, S3/R2-compatible later |
| Email | `MailService` interface; SMTP (Mailpit in docker for dev) |
| Plan billing | Limits enforced (Free 20 / Basic 150 / Pro 500 customers). Upgrade = request recorded, admin switches manually |

**Out of scope for v1:** desktop owner dashboard (`DashboardDesktop`), WhatsApp Business API auto-send, online subscription payments, team members (shown Pro-locked in Settings).

## 3. Repository layout

```
C:\dev\Lama\
├── lamma-design-handoff/        reference only, never imported
├── apps/
│   ├── backend/                 NestJS
│   ├── mobile/                  React Native CLI
│   └── web/                     Next.js
├── packages/
│   └── shared/                  TypeScript only, no UI, no platform deps
├── docs/superpowers/{specs,plans}/
├── docker-compose.yml           postgres, redis, mailpit
├── package.json                 workspaces + root scripts
└── tsconfig.base.json
```

### Code-size and style rules (all apps)

- Target **≤ 150 lines per file**; a file approaching 200 lines must be split.
- One screen / component / service / DTO per file.
- Screens only **compose** components and hooks; logic lives in hooks/services.
- No hardcoded colors (use theme), no hardcoded user-facing strings (use `t()`).
- Features never import from other features; anything shared moves to `shared/`.
- Each feature exposes a public API through `index.ts`.
- TypeScript `strict`, ESLint + Prettier shared from the root.

## 4. Shared package (`packages/shared`)

```
src/
├── types/        API DTO types: Business, Customer, Charge, Invoice, PaymentClaim, …
├── domain/
│   ├── invoiceStatus.ts     computeInvoiceStatus(invoice, now)
│   ├── money.ts             formatAmount(450) → "450", currency suffix per locale
│   ├── reminderMessage.ts   buildReminderMessage({kind, customer, business, invoice, link, locale})
│   ├── plans.ts             PLAN_LIMITS, canAddCustomers()
│   └── dates.ts             period helpers ("2026-09"), due-date-in-month
├── i18n/
│   ├── ar/  common.json, auth.json, home.json, customers.json, …   (namespace per feature)
│   └── en/  same files
├── tokens/
│   ├── palette.ts           raw colors from design-tokens.json
│   ├── light.ts / dark.ts   semantic themes
│   └── typography.ts, radius.ts, sizes.ts, spacing.ts
└── index.ts
```

Has its own Jest tests. It is the single source of truth for status rules, message templates, translations and tokens.

### Invoice status rule (single implementation)

```
if invoice.paidAt                        → paid
if invoice has a pending PaymentClaim    → awaiting_confirmation
if now > dueDate                         → overdue
if dueDate - now ≤ 3 days                → due_soon
else                                     → upcoming   (no chip shown; used in lists as "مستحق يوم X")
```

The backend stores only facts (`dueDate`, `paidAt`, claims); status is always computed. The backend also exposes the computed status in responses so filters and aggregates work server-side, using the same function.

### Message templates

Taken from `source-dc/ReminderSettings.dc.html` (before / on due date / after), each ending with the pay link `https://<WEB_BASE_URL>/p/<token>`. The prototype copy is gendered («أستاذة سارة … تقدري تدفعي»), so `Customer` gets an optional `gender: male | female | null`. Female uses the feminine forms, male the masculine forms, and null uses neutral copy without an honorific. All variants live in the i18n files.

### Themes

- **Light** = `design-tokens.json` exactly.
- **Dark** = derived palette with the same semantic keys: `bg`, `surface`, `ink`, `muted`, `line`, `inputBorder`, `primary`, `primaryDark`, `primarySoft`, `gold`, `goldSoft`, `whatsapp`, `whatsappSoft`, `danger`, `dangerSoft`, `disabledBg`, and `status.{paid,dueSoon,overdue,awaiting}.{fg,bg}`.
- Dark direction: near-black teal background (`#0E1716`-ish), raised surfaces slightly lighter, primary lightened for contrast (≥ 4.5:1 for text), status chips use dark tinted backgrounds with light foregrounds.
- Exact values are tuned during the mobile-foundation phase and checked for contrast.

## 5. Backend (`apps/backend`)

### Structure

```
src/
├── main.ts, app.module.ts
├── config/             env schema (zod) + typed ConfigService
├── common/             guards (JwtAuthGuard), decorators (@CurrentBusiness),
│                       filters (AppExceptionFilter), pipes, pagination, AppError codes
├── infra/
│   ├── prisma/         PrismaService
│   ├── storage/        StorageService (interface) + LocalStorage
│   ├── queue/          BullMQ registration
│   ├── mail/           MailService + SmtpMail
│   ├── ai/             ScreenshotReader (Tesseract) + NotebookReader (Gemini) + fakes
│   └── whatsapp/       WhatsAppSender (stub) + waLink builder
└── modules/
    auth/ business/ customers/ imports/ charges/ invoices/
    reminders/ payments/ reports/ dashboard/ public/
```

Each module: `x.module.ts`, `x.controller.ts`, `x.service.ts`, `x.repository.ts` (only place that touches Prisma), `dto/` (one file per DTO, class-validator), `*.spec.ts`. Large services are split by use case (e.g. `payments/claim-checker.service.ts`, `payments/claim-decision.service.ts`).

### Data model (Prisma)

```
Business        id, name, type(academy|building|tutor|nursery|other), instapayAddress,
                phone?, email?, plan(free|basic|pro), logoUrl?, area?, weeklyBackup(bool),
                planUpgradeRequestedAt?, createdAt
OtpCode         id, target(phone|email), codeHash, expiresAt, attempts, consumedAt?
RefreshToken    id, businessId, tokenHash, expiresAt, revokedAt?
Customer        id, businessId, name, phone, note?, gender?, archivedAt?, createdAt
Charge          id, businessId, kind(monthly|one_time), title, amount, dayOfMonth?, dueDate?,
                active, createdAt
ChargeAssignment chargeId, customerId                              (PK both)
Invoice         id, businessId, chargeId, customerId, period("2026-09")?, title, amount,
                dueDate, paidAt?, publicToken(unique, 22+ char random), promisedDate?
                unique(chargeId, customerId, period)
Payment         id, invoiceId, amount, method(instapay|cash), claimId?, recordedAt
ReminderRule    businessId(PK), beforeDays(3|null), onDueDate(bool), afterDays(3|null)
ReminderLog     id, invoiceId, kind(before|on|after|promise|manual), channel(whatsapp_link|whatsapp_api), sentAt
PaymentClaim    id, invoiceId, screenshotKey, status(pending|confirmed|rejected),
                extractedAmount?, extractedDate?, transactionId?, recipient?, rawText,
                checkAmount, checkDate, checkRecipient, duplicateOfClaimId?,
                verdict(all_match|amount_differs|duplicate|unreadable|needs_review),
                decidedAt?, createdAt
                index(transactionId)
ImportJob       id, businessId, kind(notebook|excel), status(processing|ready|failed),
                rows Json, error?, createdAt
```

Amounts are stored as `Int` whole Egyptian pounds; the design never shows fractions. An OCR'd amount like `600.00` is rounded for comparison only when the fraction is `.00`, otherwise the claim is flagged `amount_differs`.

### API surface (v1)

Authenticated (owner, JWT):

| Area | Endpoints |
|---|---|
| auth | `POST /auth/otp/request`, `POST /auth/otp/verify` (signup if new + business fields), `POST /auth/refresh`, `POST /auth/logout` |
| business | `GET/PATCH /business`, `GET /business/usage`, `POST /business/upgrade-request` |
| customers | `GET /customers?search=&status=`, `POST /customers` (single or batch), `GET/PATCH/DELETE /customers/:id`, `GET /customers/:id/history` |
| imports | `POST /imports/notebook` (image) → job, `GET /imports/:id`, `POST /imports/excel` (file) → job, `POST /imports/:id/commit` (reviewed rows) |
| charges | `GET/POST /charges`, `PATCH /charges/:id` |
| invoices | `POST /invoices/:id/cash-payment` |
| reminders | `GET/PUT /reminders/rule`, `GET /reminders/today`, `POST /reminders/:invoiceId/sent` |
| payments | `GET /claims?status=pending`, `POST /claims/:id/confirm`, `POST /claims/:id/reject`, `POST /claims/:id/undo` |
| dashboard | `GET /dashboard/home` |
| reports | `GET /reports/monthly?period=`, `GET /reports/monthly/export.xlsx` |

Public (no auth, rate-limited, addressed by `publicToken`):

| Endpoint | Purpose |
|---|---|
| `GET /public/invoices/:token` | business name/logo/area, customer name, title, amount, due date, status, InstaPay address |
| `POST /public/invoices/:token/claims` | multipart screenshot → runs checks → `{ status: received }` or `{ error: UNREADABLE }` |
| `POST /public/invoices/:token/promise` | `{ date }` → stores promisedDate, schedules reminder |

### Key flows

1. **Signup / login.** Phone or email → `otp/request` (code logged to console in dev; SMS/WhatsApp/email provider behind `OtpSender` interface) → `otp/verify`. For a new identity, verify also requires `businessName`, `type`, `instapayAddress` and creates the Business plus a default ReminderRule (all three on).
2. **Invoice generation.** Creating a monthly charge generates invoices for the current period immediately. A daily job (00:30 Africa/Cairo) generates the next period's invoices for active monthly charges. One-time charges create one invoice per assigned customer.
3. **Today's reminders.** Computed on request for invoices that are unpaid, have no pending claim, and either match a rule offset (dueDate −3 / 0 / +3) or have `promisedDate = today`. Each item includes the built message and `wa.me/<intl phone>?text=<encoded>`. Already-sent items (ReminderLog today) are returned with `sent: true`.
4. **Screenshot claim.** Upload → store → `ScreenshotReader.read(image)` → parse amount / date / transaction ID / recipient → checks:
   - amount equals invoice amount
   - date not before the invoice period start, and not in the future
   - transactionId not used by another claim → duplicate
   - recipient equals the business InstaPay address (case-insensitive)

   Verdict priority: `unreadable` > `duplicate` > `amount_differs` > `needs_review` > `all_match`. Unreadable returns an error to the customer (UploadError screen) and keeps no pending claim.
5. **Owner decision.** Confirm → Payment(instapay) + `invoice.paidAt`. Reject → claim rejected, invoice back to overdue/due status. Undo allowed within 10 minutes, reverting both. Confirmation-message link for the customer (WaConfirmed reference) is returned to the app as a `wa.me` URL the owner can send.
6. **Cash payment.** `POST /invoices/:id/cash-payment` → Payment(cash) + `paidAt`.
7. **Weekly backup.** Friday 09:00 Africa/Cairo job: for businesses with `weeklyBackup`, email an Excel export (exceljs).

### Errors

`AppExceptionFilter` returns `{ code, message, details? }` for every error. `code` is a stable key (`VALIDATION_FAILED`, `OTP_INVALID`, `OTP_EXPIRED`, `PLAN_LIMIT_REACHED`, `NOT_FOUND`, `CLAIM_UNREADABLE`, `UNDO_WINDOW_EXPIRED`, …). Clients translate by code; `message` is for logs only.

### Security

- OTP codes hashed, 5-minute expiry, max 5 attempts, request rate limit.
- Refresh tokens hashed and rotated.
- Every owner query is scoped by `businessId` from the token (enforced in repositories).
- Public tokens are unguessable random strings.
- Uploads limited to images ≤ 8 MB.
- `@nestjs/throttler` on public and auth routes.

### Testing

- Unit tests for services, the claim parser/checker, and invoice generation.
- e2e tests (Supertest) against a dedicated test database, with AI / storage / mail / OTP faked.

## 6. Mobile app (`apps/mobile`)

### Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── providers/       QueryProvider, ThemeProvider, I18nProvider, SafeArea
│   └── navigation/      RootNavigator, AuthStack, OnboardingStack, MainTabs, types.ts
├── core/
│   ├── api/             axios client, auth interceptor + refresh, error → AppError(code)
│   ├── storage/         MMKV wrapper
│   └── config/
├── theme/               ThemeProvider, useTheme(), makeStyles helper, maps shared tokens
├── i18n/                i18next init with shared JSON, RTL switch (I18nManager + reload), useFormat()
├── shared/
│   ├── components/      see list below
│   └── hooks/
└── features/
    auth/ onboarding/ home/ reminders/ confirmations/ customers/ reports/ settings/
```

Feature folder: `screens/`, `components/`, `api/` (query keys + query/mutation hooks), `hooks/`, `index.ts`.

### Shared components (from `Components.html`)

`Screen` (scroll, safe area, 16px padding), `Text` (variants: display / screenTitle / section / body / caption), `Button` (primary / whatsapp / outline / danger-outline / ghost / disabled; 56px or 52px), `Input`, `AmountInput` (with ج.م suffix), `PhoneInput` (LTR), `SegmentedControl`, `ChipSelect`, `StatusChip`, `AmountText` (big number + smaller currency), `Card`, `Avatar` (initial + tinted bg), `CustomerRow`, `Toggle`, `ProgressBar`, `Badge`, `StepHeader` (step X/4), `EmptyState`, `Skeleton`, `BottomSheet`, `IconTile`.

### Screens → features

| Feature | Screens (handoff file) |
|---|---|
| auth | Signup (`Signup`, step 1/4), Login (same layout without business fields — not in the design, reuses Signup style), OtpVerify (not in the design; 6-box code entry in the same visual language) |
| onboarding | AddCustomers (2/4), NotebookScan, NotebookReview, AddCharge (3/4), ReminderSettings (4/4) |
| home | Home |
| reminders | Reminders, EmptyReminders |
| confirmations | Confirmations (ClaimCard, VerdictBanner, ExtractedField, ResultRow with undo) |
| customers | Customers (search + status pills), EmptyCustomers, CustomerProfile (+ record cash sheet) |
| reports | Report (+ export via share sheet) |
| settings | Settings (business info, InstaPay, plan usage + upgrade, team locked, weekly backup, theme picker, language picker, logout) |

`AddCharge` and `AddCustomers` are also reachable from the main app (Home, Customers, CustomerProfile), so they are registered in both stacks and reuse the same screen components.

Navigation: `RootNavigator` picks AuthStack → OnboardingStack (until the first charge is created) → MainTabs (الرئيسية · العملاء · التأكيدات [pending badge] · التقارير) with stacked screens above the tabs.

### Libraries

`@react-navigation/native` + native-stack + bottom-tabs, `@tanstack/react-query`, `zustand`, `react-native-mmkv`, `axios`, `i18next` + `react-i18next`, `react-native-localize`, `react-native-restart`, `react-native-svg` + `lucide-react-native`, `react-hook-form` + `zod`, `react-native-image-picker`, `react-native-contacts`, `@react-native-documents/picker`, `react-native-share`, `react-native-safe-area-context`. Font: IBM Plex Sans Arabic bundled via `react-native-asset`.

### Theme and localization

- `theme` store: `light | dark | system`. `useTheme()` returns semantic tokens; components style via a `makeStyles(theme => …)` helper.
- `language` store: `ar | en`. Changing it updates i18next and `I18nManager.forceRTL`, then reloads the app.
- Layout uses logical props (`marginStart`, `start`, `flexDirection: 'row'`, which auto-flips under RTL).
- Numbers always use Western digits. Phones and InstaPay addresses are rendered LTR.

### Data

TanStack Query hooks per feature. Confirm / reject / undo use optimistic updates; the confirmations tab badge is derived from the pending-claims query. API errors are mapped to `AppError(code)` → `t('errors.<code>')`.

### Testing

Jest + React Native Testing Library: shared components (render in both themes and both directions), feature hooks, key screens with the API mocked by MSW.

## 7. Web app (`apps/web`)

### Structure

```
src/
├── app/
│   ├── [locale]/page.tsx                  landing (Main)
│   ├── [locale]/layout.tsx                <html dir lang>, font, theme
│   └── p/[token]/
│       ├── page.tsx                       PayPage or AlreadyPaid (server fetch)
│       ├── upload/page.tsx                UploadProof / UploadError
│       ├── thanks/page.tsx                PayThanks
│       └── opengraph-image.tsx            WhatsApp preview card
├── features/
│   ├── landing/components/    Hero, Benefits, HowItWorks, Pricing, Faq, FinalCta, Footer
│   └── pay/
│       ├── components/        BusinessHeader, InvoiceCard, InstapayCopy, PromiseSheet,
│       │                      UploadZone, UploadTips, PoweredBy
│       └── api/               fetchInvoice, submitClaim, submitPromise
├── shared/components/         Button, StatusChip, AmountText, Card …
├── i18n/                      loads shared JSON; ar default, en via /en or ?lang=en on /p
└── theme/                     tailwind.config generated from shared tokens; dark via class +
                               prefers-color-scheme
```

The pay pages follow the device theme. "افتح InstaPay" opens the InstaPay app link with a store fallback. Testing: Vitest + Testing Library for components; Playwright smoke test of the pay flow against the backend with fakes.

## 8. Build phases

Each phase gets its own implementation plan in `docs/superpowers/plans/`.

1. **Foundation** — monorepo, tooling, `packages/shared` (types, status, money, tokens, i18n skeleton), docker-compose, backend skeleton, config, Prisma schema, auth (OTP + JWT).
2. **Backend core** — business, customers, charges + invoice generation, dashboard, reminders (rule, today, sent), cash payment.
3. **Mobile foundation** — RN CLI app, theme (light/dark), i18n/RTL, shared components, navigation, auth + signup.
4. **Mobile owner features** — onboarding AddCharge + ReminderSettings, home, customers, profile, reminders, reports, settings.
5. **Payments end to end** — backend public endpoints + Tesseract checker, web pay flow, mobile confirmations queue.
6. **Imports** — Gemini notebook reader + review table, Excel import, contacts import.
7. **Jobs and exports** — promised-date reminders, weekly backup email, Excel report export.
8. **Landing page.**

## 9. Open items to settle during implementation

- Exact dark-theme hex values (tuned with contrast checks in phase 3).
- OTP delivery provider for production (dev logs codes; the interface allows adding SMS/WhatsApp/email later).
- Hosting / deployment target (not needed until after phase 5).
