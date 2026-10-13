# Handoff — Phase 3 status (written 2026-10-13)

Read this first when continuing the project on another machine. The controller's working notes
(`.superpowers/`, git-ignored) do not travel with the repo; everything needed is summarized here.

## Start here on a new machine

1. Install Node 24, Git, JDK 17, Android Studio (SDK 35/36, emulator `Pixel_7`), the superpowers plugin for Claude Code.
2. `git clone https://github.com/mostafa22104/Lama.git C:\dev\Lama`, `cd C:\dev\Lama`,
   `git checkout feat/phase-3-mobile-foundation`, open Claude Code there and paste:

```
You are continuing the Lamma (لَمّة) project on a new Windows machine. Repo C:\dev\Lama, branch feat/phase-3-mobile-foundation.
Read docs/superpowers/handoff/phase-3-status.md first, then the specs in docs/superpowers/specs/ and the Global Constraints + "### Task 11" of docs/superpowers/plans/2026-10-11-phase-3-mobile-foundation.md.
Work with the superpowers skills (subagent-driven development; brainstorming → spec → plan for new phases), keep the architecture rules in the handoff, work locally, push only when I ask, never kill processes by image name, and don't stop between tasks to ask.
Step 0: corepack enable; yarn install; recreate apps/backend/.env and .env.test from .env.example (npx prisma dev for databases lamma + lamma-test, random dev secrets), run migrations, verify yarn lint / yarn test / yarn test:e2e.
Then do "Remaining steps for Phase 3" in this file in order, show me the acceptance screenshots, merge into main, and start Phase 4 with brainstorming.
```

## Project in one paragraph

Lamma (لَمّة) — Arabic-first Egyptian subscription / debt-collection app, built from the Claude
Design handoff in `lamma-design-handoff/`. Yarn 4 monorepo: `packages/shared` (tokens, i18n,
domain rules), `apps/backend` (NestJS + Prisma + PostgreSQL, done in Phases 1–2), `apps/mobile`
(React Native 0.87 owner app, Phase 3). A Next.js customer web app (pay flow + landing) comes later.
Specs: `docs/superpowers/specs/`. Plans: `docs/superpowers/plans/`.

## Working agreement (from the owner)

- Process: superpowers skills — brainstorming → spec → plan → **subagent-driven development**
  (implementer per task, task review, fix rounds, final whole-branch review on the most capable model).
- Feature-based architecture, ≤150 lines per file, one component per file, light/dark theme,
  Arabic default + English, shared components, readable code.
- Work locally on a feature branch; merge into local `main` when a phase is done (owner asked
  "merge first then start the next phase"). Push to GitHub only when the owner asks.
- Repo: https://github.com/mostafa22104/Lama.git

## Where Phase 3 stands

Branch `feat/phase-3-mobile-foundation` (from `main` @ 13e44c4). Plan:
`docs/superpowers/plans/2026-10-11-phase-3-mobile-foundation.md` (11 tasks).

| Task | Status |
|---|---|
| 1 Scaffold (RN CLI, Metro + workspaces, Jest) | done, reviewed |
| 2 Theme | done, reviewed |
| 3 i18n + RTL | done, reviewed |
| 4 API client + single-flight refresh | done, reviewed (1 fix round) |
| 5 Components A | done, reviewed (1 fix round) |
| 6 Components B | done, reviewed (1 fix round) |
| 7 Auth session | done, reviewed (1 fix round) |
| 8 App shell, navigation, gallery | done, reviewed |
| 9 Signup | done, reviewed (1 fix round) |
| 10 Login + OTP | done, reviewed (1 fix round) |
| 11 Boundary test, README, emulator acceptance | **not done** — stopped by the owner before committing (see below) |

## Remaining steps for Phase 3

1. **Blocker — the debug app does not bundle in Metro.** The first acceptance screenshot showed a red
   box: `TransformError ... node_modules/zod/v4/classic/external.js: Export namespace should be first
   transformed by @babel/plugin-transform-export-namespace-from` (zod v4 uses `export * as core`;
   Jest passes, Metro fails). Fix (ruling R8): add `@babel/plugin-transform-export-namespace-from` as an
   explicit devDependency of `apps/mobile` and `plugins: ['@babel/plugin-transform-export-namespace-from']`
   in `apps/mobile/babel.config.js`; restart Metro with `--reset-cache`; run the mobile tests.
2. **Redo Task 11** from the plan (`### Task 11`), plus these controller additions:
   - add `.superpowers/` to the root `.gitignore` (done in this handoff commit);
   - test in `root-navigator.test.tsx`: pressing retry on the offline screen calls `restoreSession` once;
   - README: also note the Windows gradlew fallback below;
   - the architecture test needs `node:fs` typings — prefer a test-only tsconfig/`/// <reference types="node" />`
     over adding `node` to the app-wide `types`;
   - emulator acceptance screenshots 01–08 (Signup, OTP, Home, restored, gallery light/dark × ar/en,
     logged out); check that the contact `+201012345678` renders LTR on the OTP screen.
3. **Final whole-branch review** (most capable model) of `main..feat/phase-3-mobile-foundation`,
   one fix wave + scoped re-review.
4. **Finish the branch**: merge into `main` (owner's standing preference), then start Phase 4.

## Controller rulings (amend the plan/spec — keep honoring them)

- **R1** API tests use axios-mock-adapter instead of MSW.
- **Trailers** Commit `Co-Authored-By` names the model that actually wrote the commit.
- **R2/R5** Token refresh (`core/api/refresh.ts`): single-flight; signs out ONLY on a real token
  rejection (refresh returns null or server answers `TOKEN_INVALID`). Network errors, 5xx, 429 keep
  the session; `restoreSession` maps them to status `offline` (retry screen).
- **R3** Accessibility labels are translated (`common:back`, `auth:otpLabel` = «كود التأكيد»).
  OTP paste takes the first standalone 6-digit run (Arabic digits supported).
- **R4** `CustomerRow` a11y label = name, subtitle, amount + currency, translated status.
- **R5 (cont.)** OTP request/verify go through `publicApi`; tests mock `publicApi`.
- **R6** Test `QueryClient` uses `gcTime: Infinity` (no open handles). Signup/Login submit the
  normalized contact (`+201012345678`). Coming from Login with `SIGNUP_REQUIRED`, Signup locks the
  contact and verifies with the carried code (no second OTP).
- **R7** OtpVerify ignores input while a verify is pending; resend restarts the 60 s countdown only
  on success or `OTP_COOLDOWN`, other resend errors are shown; OTP clears after an error.

## Deferred minors (for the final review / later phases)

- Late 401 after a finished refresh triggers a second refresh; no test for "retried request 401s again".
- OTP boxes are exposed to screen readers alongside the hidden input; ChipSelect width is approximate.
- CustomerRow name lacks `numberOfLines`; Avatar `charAt` splits surrogate pairs; gold/goldSoft
  contrast unchecked; Skeleton ignores reduce-motion.
- TabBarItem pill gap 4 px vs design 2 px; `'ComponentGallery' as never` (dev-only).
- `changeLanguage` restarts even when the language is unchanged; a few noisy test setups.
- iOS display name still `LammaOwner` (iOS not built yet); generated RN README/Gemfile boilerplate.

## Machine setup notes (Windows)

- Node 24, Yarn via `corepack enable`, JDK 17, Android SDK 35/36, emulator `Pixel_7`.
- Keep the repo at a short path (`C:\dev\Lama`) — Gradle/CMake hit Windows path limits.
- Backend env files are NOT in git: copy `apps/backend/.env`, `.env.test`, `.env.test.local`
  (template: `.env.example`). Local Postgres without Docker: `npx prisma dev` (databases `lamma`,
  `lamma-test`); paste the printed URLs into `DATABASE_URL`.
- `yarn workspace @lamma/mobile android` (run-android) failed on the first machine. Fallback:
  start the emulator + Metro (`yarn workspace @lamma/mobile start`), then
  `cd apps/mobile/android && GRADLE_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" ./gradlew.bat app:installDebug`,
  `adb reverse tcp:8081 tcp:8081`, `adb shell am start -n com.lamma.owner/.MainActivity`.
- Subagents must never kill processes by image name (`taskkill /IM node.exe`) — only PIDs they started.
- OTP codes appear in the backend log in development.

## After Phase 3

Next phases per `docs/superpowers/specs/2026-10-11-lamma-architecture-design.md` §8: onboarding
steps 2–4 and the real tab screens (Home, Customers, Confirmations, Reports, Settings), then the
Next.js customer web app (pay flow + landing). Each phase: brainstorm → spec → plan → subagent-driven.
