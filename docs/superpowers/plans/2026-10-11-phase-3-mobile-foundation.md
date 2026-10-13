# Phase 3 — Owner App Foundation (React Native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `apps/mobile`, the Lamma owner app, with theme, Arabic/English + RTL, shared components, navigation and a working OTP sign-up/login against the Phase 1–2 backend.

**Architecture:** A React Native 0.87 CLI app inside the Yarn monorepo (its own dependencies kept local with `hoistingLimits: workspaces`, so the Android Gradle build finds them). It imports `@lamma/shared` for tokens, translations, types and domain rules. Code is split into `src/app` (providers, navigation), `src/core` (storage, API client), `src/theme`, `src/i18n`, `src/shared` (components, hooks) and `src/features/<feature>`. Server state uses TanStack Query; client state uses Zustand persisted in MMKV; the refresh token lives in the Android Keystore.

**Tech Stack:** React Native 0.87.1, React 19.2.3, TypeScript ~6.0, React Navigation 7, TanStack Query 5, Zustand 5, react-native-mmkv 4, react-native-keychain 10, react-native-restart, i18next 26 + react-i18next 17, react-hook-form 7 + zod 4, axios 1.20, react-native-svg 15 + lucide-react-native 1.55; Jest 29 + React Native Testing Library 14 + axios-mock-adapter.

**Spec:** `docs/superpowers/specs/2026-10-11-phase-3-mobile-foundation-design.md` (parent: `docs/superpowers/specs/2026-10-11-lamma-architecture-design.md`).

## Global Constraints

- Android package / iOS bundle id `com.lamma.owner`; launcher name «لمّة»; React Native component name `LammaOwner`.
- Android only is built and verified (iOS code stays cross-platform but is not built).
- ≤150 lines per file; one component per file; screens only compose; features import each other only through `index.ts`.
- No hex colors outside `src/theme` (and `@lamma/shared` tokens); no user-facing strings outside `@lamma/shared` i18n (exception: the debug-only `features/dev` gallery).
- Arabic is the default language regardless of phone language; RTL/LTR change applies through `I18nManager.forceRTL` + app restart.
- Amounts use Western digits via shared `formatAmount`/`formatMoney`; phone numbers, OTP codes and InstaPay addresses render left-to-right.
- Minimum tap target 44 px; primary buttons 56 px tall, secondary 52 px; inputs 56 px.
- Access token in memory only; refresh token only in the Keychain/Keystore (never in MMKV or logs).
- Debug API base URL `http://10.0.2.2:3000/api/v1`; release URL comes from `app.json` `releaseApiBaseUrl` and the app refuses to start a release build without it.
- Lucide icons are imported one per file (`lucide-react-native/icons/<name>`), never from the package root (the root import takes ~80 s to load in Jest).
- React Native Testing Library 14: `render` is async — always `await render(...)`; use `userEvent.setup()`.
- Commits end with the Co-Authored-By line for the model that wrote them.

## Review Focus

1. **Offline at launch.** Opening the app with a saved session but no internet must not log the owner out; they see a "no internet" screen with retry, and the session survives. Pinned by "keeps the session when the network is down" (Task 7).
2. **Pasted or Arabic-keyboard OTP.** `١٢٣ ٤٥٦`, `123 456` or a pasted SMS line must fill all six boxes and submit once. Pinned by OtpInput tests (Task 5) and "submits a pasted Arabic code once" (Task 10).
3. **Expired access token in the middle of use.** Several requests failing with `TOKEN_INVALID` at once must trigger exactly one refresh, then succeed; a failed refresh signs out cleanly. Pinned by the client tests (Task 4).
4. **Number with no account typed on Login.** Must offer «اعمل حساب» and finish sign-up with the code already typed, without a second SMS. Pinned by the `SIGNUP_REQUIRED` test (Task 10).
5. **Language switch.** After choosing English the layout must be LTR on the next start, and a mismatch between saved language and layout direction must be corrected at startup. Pinned by the direction tests (Task 3).

---

## File Map

```
apps/mobile/
├── package.json  app.json  index.js  babel.config.js  metro.config.js  tsconfig.json
├── jest.config.js  jest.setup.ts
├── android/ …                                  (generated; ids per Global Constraints)
├── android/app/src/main/assets/fonts/IBMPlexSansArabic-{Regular,Medium,SemiBold,Bold}.ttf
└── src/
    ├── app/        App.tsx  bootstrap.ts  providers/{QueryProvider,I18nProvider}.tsx
    │               navigation/{RootNavigator,AuthStack,MainStack,MainTabs,TabBar,TabBarItem,navigation-theme,types}.ts(x)
    │               screens/{SplashScreen,OfflineScreen}.tsx
    ├── core/       api/{app-error,client,refresh,instances}.ts  storage/{mmkv,zustand-storage,secure-token}.ts
    │               config/api-base-url.ts
    ├── theme/      theme-store.ts resolve-theme.ts build-theme.ts theme-context.ts ThemeProvider.tsx
    │               use-theme.ts make-styles.ts fonts.ts index.ts
    ├── i18n/       i18n.ts language-store.ts direction.ts index.ts
    ├── shared/components/  Text Icon Screen Button Card TextField PhoneInput OtpInput SegmentedControl
    │                       ChipSelect StepHeader StatusChip AmountText AmountInput Avatar CustomerRow
    │                       Toggle ProgressBar Badge EmptyState Skeleton index.ts (+ __tests__)
    ├── shared/hooks/       use-countdown.ts
    ├── testing/            render.tsx
    └── features/
        ├── auth/   index.ts auth-store.ts session.ts api/{auth-api,use-auth-mutations}.ts
        │           schemas/{signup-schema,login-schema}.ts
        │           components/{SignupForm,ContactFields}.tsx
        │           screens/{SignupScreen,LoginScreen,OtpVerifyScreen}.tsx hooks/use-signup-submit.ts
        ├── home|customers|confirmations|reports/  index.ts screens/<X>PlaceholderScreen.tsx
        └── dev/    index.ts screens/ComponentGalleryScreen.tsx components/{GallerySettings,GalleryInputs,GalleryData}.tsx
packages/shared/src/i18n/  ar|en/auth.ts (new), ar|en/common.ts (new keys), index.ts
```

---

### Task 1: Scaffold the app inside the monorepo and prove the toolchain

**Files:**
- Create: `apps/mobile/**` (generated by the React Native CLI, then edited as below)
- Modify: root `.gitignore`, root `eslint.config.mjs`

**Interfaces:**
- Consumes: `@lamma/shared` (`formatAmount`, `toBusinessDate`, `resources`).
- Produces: a buildable `@lamma/mobile` workspace; `yarn workspace @lamma/mobile test` (Jest) and `lint` (tsc); Jest config with native-module mocks used by every later task; Metro resolving `@lamma/shared`.

- [ ] **Step 1: Generate the project**

From `C:\dev\Lama`:

```bash
npx -y @react-native-community/cli@20.2.0 init LammaOwner --version 0.87.1 --directory apps/mobile --skip-install --skip-git-init --package-name com.lamma.owner
```

- [ ] **Step 2: Normalize generated names**

The CLI's `--package-name` handling is quirky; make these exact:

- `apps/mobile/app.json` → `{ "name": "LammaOwner", "displayName": "لمّة", "releaseApiBaseUrl": "" }`
- `apps/mobile/android/settings.gradle` → `rootProject.name = 'LammaOwner'`
- Kotlin sources live in `apps/mobile/android/app/src/main/java/com/lamma/owner/` with `package com.lamma.owner` (move `MainActivity.kt` and `MainApplication.kt` there if the CLI created another folder such as `com/com.lamma.owner`, and delete the empty folder).
- `MainActivity.kt` → `override fun getMainComponentName(): String = "LammaOwner"`
- `android/app/build.gradle` keeps `namespace "com.lamma.owner"` and `applicationId "com.lamma.owner"`.
- `android/app/src/main/res/values/strings.xml` → `<string name="app_name">لمّة</string>`
- Delete `apps/mobile/__tests__/App.test.tsx`, `apps/mobile/.eslintrc.js`, `apps/mobile/.prettierrc.js` (the repo uses the root ESLint/Prettier), `apps/mobile/App.tsx` (replaced in Task 8).

- [ ] **Step 3: Workspace package.json**

Replace `apps/mobile/package.json` with:

```json
{
  "name": "@lamma/mobile",
  "version": "0.0.1",
  "private": true,
  "installConfig": { "hoistingLimits": "workspaces" },
  "scripts": {
    "android": "react-native run-android",
    "start": "react-native start",
    "test": "jest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@lamma/shared": "workspace:^",
    "react": "19.2.3",
    "react-native": "0.87.1",
    "react-native-safe-area-context": "^5.5.2"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.3",
    "@babel/runtime": "^7.25.0",
    "@react-native-community/cli": "20.2.0",
    "@react-native-community/cli-platform-android": "20.2.0",
    "@react-native-community/cli-platform-ios": "20.2.0",
    "@react-native/babel-preset": "0.87.1",
    "@react-native/jest-preset": "0.87.1",
    "@react-native/metro-config": "0.87.1",
    "@react-native/typescript-config": "0.87.1",
    "@testing-library/react-native": "^14.1.0",
    "@types/jest": "^29.5.13",
    "@types/react": "^19.2.0",
    "jest": "^29.6.3",
    "test-renderer": "^1.3.0",
    "typescript": "~6.0.2"
  },
  "engines": { "node": ">= 22.11.0" }
}
```

Then from the repo root: `yarn install`. Expected: `apps/mobile/node_modules/react-native` exists (not hoisted to the root).

- [ ] **Step 4: Metro, Babel, TypeScript, Jest**

`apps/mobile/metro.config.js`:

```js
const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../../packages/shared');
const defaults = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaults, {
  watchFolders: [sharedRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    sourceExts: [...new Set([...defaults.resolver.sourceExts, 'mjs', 'cjs'])],
  },
});
```

`apps/mobile/tsconfig.json`:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": { "types": ["jest"] },
  "include": ["src/**/*.ts", "src/**/*.tsx", "index.js", "jest.setup.ts"],
  "exclude": ["**/node_modules", "**/Pods", "android", "ios"]
}
```

`apps/mobile/jest.config.js`:

```js
const path = require('node:path');

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    // Apply this app's Babel config to @lamma/shared too (it lives outside apps/mobile).
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: path.join(__dirname, 'babel.config.js') }],
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  moduleNameMapper: {
    '^lucide-react-native/icons/(.*)$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|@lamma|lucide-react-native|react-native-mmkv|react-native-nitro-modules|react-native-svg|react-native-screens|react-native-safe-area-context|react-native-keychain|react-native-restart)/)',
  ],
};
```

`apps/mobile/jest.setup.ts`:

```ts
/* Native modules have no JS implementation under Jest; replace them with in-memory fakes. */
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const data = new Map<string, string | number | boolean>();
    return {
      set: (key: string, value: string | number | boolean) => data.set(key, value),
      getString: (key: string) => {
        const value = data.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      contains: (key: string) => data.has(key),
      remove: (key: string) => data.delete(key),
      clearAll: () => data.clear(),
    };
  },
}));

jest.mock('react-native-keychain', () => {
  let stored: false | { username: string; password: string } = false;
  return {
    setGenericPassword: jest.fn(async (username: string, password: string) => {
      stored = { username, password };
      return { service: 'test', storage: 'test' };
    }),
    getGenericPassword: jest.fn(async () => stored),
    resetGenericPassword: jest.fn(async () => {
      stored = false;
      return true;
    }),
  };
});

jest.mock('react-native-restart', () => ({ __esModule: true, default: { restart: jest.fn() } }));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
```

Install the libraries every later task uses (from the repo root):

```bash
yarn workspace @lamma/mobile add react-native-mmkv@^4.3.2 react-native-nitro-modules@^0.37.1 react-native-keychain@^10.0.0 react-native-restart@^0.0.29 react-native-svg@^15.15.5 lucide-react-native@^1.55.0 @react-navigation/native@^7.5.0 @react-navigation/native-stack@^7.20.0 @react-navigation/bottom-tabs@^7.20.0 react-native-screens@^4.29.0 @tanstack/react-query@^5.104.2 zustand@^5.0.15 i18next@^26.4.3 react-i18next@^17.0.16 react-hook-form@^7.90.0 zod@^4.6.5 @hookform/resolvers@^5.9.1 axios@^1.20.0
yarn workspace @lamma/mobile add -D axios-mock-adapter@^2.1.0
```

- [ ] **Step 5: Write the failing toolchain test**

`apps/mobile/src/__tests__/toolchain.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import Check from 'lucide-react-native/icons/check';
import { createMMKV } from 'react-native-mmkv';
import { formatAmount, resources, toBusinessDate } from '@lamma/shared';

test('shared package, MMKV mock, icons and Intl work under Jest', async () => {
  const kv = createMMKV({ id: 'probe' });
  kv.set('k', 'v');
  await render(
    <>
      <Text>{`${formatAmount(23400)} ${toBusinessDate(new Date('2026-09-20T22:30:00Z'))} ${kv.getString('k')}`}</Text>
      <Text>{resources.ar.common.appName}</Text>
      <Check />
    </>,
  );
  expect(screen.getByText('23,400 2026-09-21 v')).toBeTruthy();
  expect(screen.getByText('لَمّة')).toBeTruthy();
});
```

Run: `yarn workspace @lamma/mobile test src/__tests__/toolchain.test.tsx` — first run before Step 4's config exists fails; after Step 4 it must PASS. If `@lamma/shared` fails to transform (`SyntaxError: Unexpected token 'export'`), the Babel `configFile` override is not applied — fix the `transform` entry, don't skip the test.

- [ ] **Step 6: Root config**

Root `.gitignore` — append:

```gitignore
apps/mobile/android/.gradle/
apps/mobile/android/app/build/
apps/mobile/android/build/
apps/mobile/android/local.properties
apps/mobile/ios/Pods/
apps/mobile/*.keystore
!apps/mobile/android/app/debug.keystore
```

Root `eslint.config.mjs` — add to the `ignores` array:

```js
      'apps/mobile/android/**',
      'apps/mobile/ios/**',
      'apps/mobile/*.config.js',
      'apps/mobile/index.js',
```

- [ ] **Step 7: Prove Hermes and Metro on the emulator**

Temporarily create `apps/mobile/src/app/App.tsx` (Task 8 replaces it):

```tsx
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { formatAmount, resources, toBusinessDate } from '@lamma/shared';

export default function App() {
  return (
    <SafeAreaView>
      <Text>{resources.ar.common.appName}</Text>
      <Text>{formatAmount(23400)}</Text>
      <Text>{toBusinessDate(new Date('2026-09-20T22:30:00Z'))}</Text>
    </SafeAreaView>
  );
}
```

`apps/mobile/index.js`:

```js
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

Run (three terminals, or background processes):

```bash
"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd Pixel_7 -no-snapshot-save
yarn workspace @lamma/mobile start
yarn workspace @lamma/mobile android
```

Then capture: `adb exec-out screencap -p > .superpowers/phase3-task1.png`.
Expected on screen: `لَمّة`, `23,400`, `2026-09-21`. If the date shows `2026-09-20` or an error, Hermes lacks the Cairo time zone — STOP and report (the spec's fallback is `@formatjs` polyfills; that is a plan change). Stop Metro and the emulator processes you started.

- [ ] **Step 8: Verify and commit**

```bash
yarn workspace @lamma/mobile test
yarn workspace @lamma/mobile lint
yarn lint
git add apps/mobile .gitignore eslint.config.mjs yarn.lock
git commit -m "feat(mobile): scaffold React Native owner app in the monorepo"
```

---

### Task 2: Theme — store, provider, `useTheme`, `makeStyles`, fonts

**Files:**
- Create: `apps/mobile/src/core/storage/mmkv.ts`, `zustand-storage.ts`; `apps/mobile/src/theme/{fonts,resolve-theme,build-theme,theme-context,theme-store,use-theme,make-styles,index}.ts`, `ThemeProvider.tsx`; `apps/mobile/android/app/src/main/assets/fonts/*.ttf`
- Test: `apps/mobile/src/theme/__tests__/theme.test.tsx`

**Interfaces:**
- Consumes: shared `themes`, `ThemeName`, `TYPE_SCALE`, `RADIUS`, `SIZES`, `SPACING`, `FONT_WEIGHTS`.
- Produces:
  - `storage` (MMKV instance), `persistStorage` (zustand `createJSONStorage`)
  - `type ThemeMode = 'light' | 'dark' | 'system'`; `useThemeStore` (`{ mode, setMode }`, persisted as `theme`)
  - `resolveThemeName(mode, systemScheme): ThemeName`
  - `interface AppTheme` = shared `Theme` + `{ type, radius, sizes, spacing, fonts }`; `buildTheme(name): AppTheme`
  - `ThemeProvider` (follows store + system scheme; sets StatusBar), `useTheme(): AppTheme`
  - `makeStyles(factory)` → `useStyles()` memoized per theme name
  - `FONTS: Record<400|500|600|700, string>`

- [ ] **Step 1: Fonts**

```bash
mkdir -p apps/mobile/android/app/src/main/assets/fonts
for w in Regular Medium SemiBold Bold; do curl -sL -o "apps/mobile/android/app/src/main/assets/fonts/IBMPlexSansArabic-$w.ttf" "https://github.com/google/fonts/raw/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-$w.ttf"; done
ls -l apps/mobile/android/app/src/main/assets/fonts
```

Expected: four files, each > 100 KB. (Android maps `fontFamily` to the file name.)

- [ ] **Step 2: Write the failing test**

`apps/mobile/src/theme/__tests__/theme.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { darkTheme, lightTheme } from '@lamma/shared';
import { makeStyles, resolveThemeName, ThemeProvider, useTheme, useThemeStore } from '../index';

function Probe() {
  const theme = useTheme();
  return <Text testID="probe">{`${theme.name} ${theme.colors.bg} ${theme.fonts[700]}`}</Text>;
}

const useProbeStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));

describe('theme', () => {
  beforeEach(() => act(() => useThemeStore.getState().setMode('system')));

  it('resolves system mode from the phone scheme', () => {
    expect(resolveThemeName('system', 'dark')).toBe('dark');
    expect(resolveThemeName('system', null)).toBe('light');
    expect(resolveThemeName('light', 'dark')).toBe('light');
    expect(resolveThemeName('dark', 'light')).toBe('dark');
  });

  it('provides the selected theme', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => useThemeStore.getState().setMode('dark'));
    expect(screen.getByTestId('probe').props.children).toBe(
      `dark ${darkTheme.colors.bg} IBMPlexSansArabic-Bold`,
    );
    act(() => useThemeStore.getState().setMode('light'));
    expect(screen.getByTestId('probe').props.children).toBe(
      `light ${lightTheme.colors.bg} IBMPlexSansArabic-Bold`,
    );
  });

  it('persists the chosen mode', () => {
    act(() => useThemeStore.getState().setMode('dark'));
    expect(useThemeStore.persist.getOptions().name).toBe('theme');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('memoizes styles per theme', async () => {
    const seen: unknown[] = [];
    function StyleProbe() {
      seen.push(useProbeStyles());
      return null;
    }
    const view = await render(
      <ThemeProvider>
        <StyleProbe />
      </ThemeProvider>,
    );
    await view.rerender(
      <ThemeProvider>
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(seen[0]).toBe(seen[1]);
  });
});
```

Run: `yarn workspace @lamma/mobile test src/theme` → FAIL (modules missing).

- [ ] **Step 3: Storage helpers**

`apps/mobile/src/core/storage/mmkv.ts`:

```ts
import { createMMKV } from 'react-native-mmkv';

/** Fast local key-value store for non-secret preferences. Never store tokens here. */
export const storage = createMMKV({ id: 'lamma' });
```

`apps/mobile/src/core/storage/zustand-storage.ts`:

```ts
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { storage } from './mmkv';

const mmkvStateStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};

export const persistStorage = createJSONStorage(() => mmkvStateStorage);
```

- [ ] **Step 4: Theme modules**

`apps/mobile/src/theme/fonts.ts`:

```ts
import type { FontWeight } from '@lamma/shared';

/** Android picks a font by file name, so each weight is its own family. */
export const FONTS: Record<FontWeight, string> = {
  400: 'IBMPlexSansArabic-Regular',
  500: 'IBMPlexSansArabic-Medium',
  600: 'IBMPlexSansArabic-SemiBold',
  700: 'IBMPlexSansArabic-Bold',
};
```

`apps/mobile/src/theme/resolve-theme.ts`:

```ts
import type { ThemeName } from '@lamma/shared';

export type ThemeMode = 'light' | 'dark' | 'system';

export function resolveThemeName(mode: ThemeMode, systemScheme: string | null | undefined): ThemeName {
  if (mode !== 'system') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
```

`apps/mobile/src/theme/build-theme.ts`:

```ts
import { RADIUS, SIZES, SPACING, type Theme, type ThemeName, themes, TYPE_SCALE } from '@lamma/shared';
import { FONTS } from './fonts';

export interface AppTheme extends Theme {
  type: typeof TYPE_SCALE;
  radius: typeof RADIUS;
  sizes: typeof SIZES;
  spacing: typeof SPACING;
  fonts: typeof FONTS;
}

const cache = new Map<ThemeName, AppTheme>();

export function buildTheme(name: ThemeName): AppTheme {
  const cached = cache.get(name);
  if (cached) return cached;
  const theme: AppTheme = { ...themes[name], type: TYPE_SCALE, radius: RADIUS, sizes: SIZES, spacing: SPACING, fonts: FONTS };
  cache.set(name, theme);
  return theme;
}
```

`apps/mobile/src/theme/theme-context.ts`:

```ts
import { createContext } from 'react';
import { type AppTheme, buildTheme } from './build-theme';

export const ThemeContext = createContext<AppTheme>(buildTheme('light'));
```

`apps/mobile/src/theme/theme-store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../core/storage/zustand-storage';
import type { ThemeMode } from './resolve-theme';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ mode: 'system', setMode: (mode) => set({ mode }) }), {
    name: 'theme',
    storage: persistStorage,
  }),
);
```

`apps/mobile/src/theme/use-theme.ts`:

```ts
import { useContext } from 'react';
import type { AppTheme } from './build-theme';
import { ThemeContext } from './theme-context';

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
```

`apps/mobile/src/theme/make-styles.ts`:

```ts
import { StyleSheet } from 'react-native';
import type { ThemeName } from '@lamma/shared';
import type { AppTheme } from './build-theme';
import { useTheme } from './use-theme';

/** Builds a hook returning StyleSheet styles for the current theme, created once per theme. */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: AppTheme) => T) {
  const cache = new Map<ThemeName, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme.name);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme.name, styles);
    }
    return styles;
  };
}
```

`apps/mobile/src/theme/ThemeProvider.tsx`:

```tsx
import React, { type ReactNode, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { buildTheme } from './build-theme';
import { resolveThemeName } from './resolve-theme';
import { ThemeContext } from './theme-context';
import { useThemeStore } from './theme-store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => buildTheme(resolveThemeName(mode, systemScheme)), [mode, systemScheme]);
  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar
        barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg}
      />
      {children}
    </ThemeContext.Provider>
  );
}
```

`apps/mobile/src/theme/index.ts`:

```ts
export { type AppTheme, buildTheme } from './build-theme';
export { FONTS } from './fonts';
export { makeStyles } from './make-styles';
export { resolveThemeName, type ThemeMode } from './resolve-theme';
export { ThemeProvider } from './ThemeProvider';
export { useThemeStore } from './theme-store';
export { useTheme } from './use-theme';
```

- [ ] **Step 5: Run tests, type-check, commit**

```bash
yarn workspace @lamma/mobile test
yarn workspace @lamma/mobile lint
git add apps/mobile
git commit -m "feat(mobile): add theme store, provider, makeStyles and IBM Plex Sans Arabic"
```

Expected: PASS, no type errors.

---

### Task 3: Language, i18n and RTL direction

**Files:**
- Create: `packages/shared/src/i18n/ar/auth.ts`, `packages/shared/src/i18n/en/auth.ts`; `apps/mobile/src/i18n/{i18n,language-store,direction,index}.ts`; `apps/mobile/src/app/providers/I18nProvider.tsx`
- Modify: `packages/shared/src/i18n/ar/common.ts`, `en/common.ts`, `i18n/index.ts`
- Test: `packages/shared/src/i18n/i18n.test.ts` (extend), `apps/mobile/src/i18n/__tests__/direction.test.ts`, `apps/mobile/src/i18n/__tests__/i18n.test.ts`

**Interfaces:**
- Consumes: shared `resources`, `isRtl`, `DEFAULT_LOCALE`, `Locale`; `persistStorage`.
- Produces:
  - shared namespaces `auth` (keys below) and new `common` keys `network`, `retry`, `offlineTitle`, `comingSoon`, `tabs.{home,customers,confirmations,reports}`
  - `initI18n(language: Locale)` (synchronous init, idempotent) → i18next instance; `i18n` export
  - `useLanguageStore` (`{ language, setLanguage }`, persisted as `language`, default `'ar'`)
  - `interface DirectionDeps { isRTL: boolean; allowRTL(v: boolean): void; forceRTL(v: boolean): void; restart(): void }`; `ensureDirection(language, deps?): boolean` (true when it restarted); `changeLanguage(language, deps?)`
  - `I18nProvider`

- [ ] **Step 1: Shared copy (test first)**

Extend `packages/shared/src/i18n/i18n.test.ts` inside the existing `describe`:

```ts
  it('ships the auth screens copy from the Signup design', () => {
    expect(resources.ar.auth).toMatchObject({
      signupTitle: 'حساب جديد',
      channelPhone: 'موبايل',
      channelEmail: 'إيميل',
      phoneLabel: 'رقم الموبايل',
      businessNameLabel: 'اسم النشاط',
      businessTypeLabel: 'نوع النشاط',
      instapayLabel: 'عنوان InstaPay',
      instapayHint: 'ده العنوان اللي عملاءك هيحوّلوا عليه',
      continue: 'كمّل',
    });
    expect(resources.ar.common.tabs).toEqual({
      home: 'الرئيسية',
      customers: 'العملاء',
      confirmations: 'التأكيدات',
      reports: 'التقارير',
    });
  });
```

Run: `yarn workspace @lamma/shared test` → FAIL.

`packages/shared/src/i18n/ar/auth.ts`:

```ts
/** Copy for the sign-up / login / OTP screens. i18next interpolation uses {{name}}. */
export const arAuth = {
  signupTitle: 'حساب جديد',
  loginTitle: 'دخول',
  stepOf: 'خطوة {{step}} من {{total}}',
  channelPhone: 'موبايل',
  channelEmail: 'إيميل',
  phoneLabel: 'رقم الموبايل',
  emailLabel: 'الإيميل',
  businessNameLabel: 'اسم النشاط',
  businessTypeLabel: 'نوع النشاط',
  instapayLabel: 'عنوان InstaPay',
  instapayHint: 'ده العنوان اللي عملاءك هيحوّلوا عليه',
  continue: 'كمّل',
  haveAccount: 'عندك حساب؟ ادخل',
  noAccount: 'معندكش حساب؟ اعمل حساب جديد',
  sendCode: 'ابعت الكود',
  otpTitle: 'اكتب الكود',
  otpSentTo: 'بعتنالك كود من 6 أرقام على {{contact}}',
  resend: 'ابعت كود تاني',
  resendIn: 'تقدر تطلب كود تاني بعد {{seconds}} ثانية',
  notRegistered: 'الرقم ده مش متسجّل',
  createAccount: 'اعمل حساب',
  invalidPhone: 'اكتب رقم موبايل مصري صحيح',
  invalidEmail: 'اكتب إيميل صحيح',
  required: 'الخانة دي مطلوبة',
  logout: 'تسجيل الخروج',
} as const;
```

`packages/shared/src/i18n/en/auth.ts`:

```ts
import type { arAuth } from '../ar/auth.js';
import type { TranslationShape } from '../translation.js';

export const enAuth: TranslationShape<typeof arAuth> = {
  signupTitle: 'New account',
  loginTitle: 'Log in',
  stepOf: 'Step {{step}} of {{total}}',
  channelPhone: 'Mobile',
  channelEmail: 'Email',
  phoneLabel: 'Mobile number',
  emailLabel: 'Email',
  businessNameLabel: 'Business name',
  businessTypeLabel: 'Business type',
  instapayLabel: 'InstaPay address',
  instapayHint: 'Your customers will transfer to this address',
  continue: 'Continue',
  haveAccount: 'Have an account? Log in',
  noAccount: "Don't have an account? Create one",
  sendCode: 'Send code',
  otpTitle: 'Enter the code',
  otpSentTo: 'We sent a 6-digit code to {{contact}}',
  resend: 'Send a new code',
  resendIn: 'You can request a new code in {{seconds}} s',
  notRegistered: 'This number is not registered',
  createAccount: 'Create account',
  invalidPhone: 'Enter a valid Egyptian mobile number',
  invalidEmail: 'Enter a valid email',
  required: 'This field is required',
  logout: 'Log out',
};
```

`packages/shared/src/i18n/ar/common.ts` — add inside `arCommon`:

```ts
  network: 'مفيش إنترنت، جرّب تاني',
  retry: 'جرّب تاني',
  offlineTitle: 'مفيش إنترنت',
  comingSoon: 'الصفحة دي جاية قريب',
  tabs: { home: 'الرئيسية', customers: 'العملاء', confirmations: 'التأكيدات', reports: 'التقارير' },
```

`packages/shared/src/i18n/en/common.ts` — add inside `enCommon`:

```ts
  network: 'No internet connection, try again',
  retry: 'Try again',
  offlineTitle: 'No internet',
  comingSoon: 'This page is coming soon',
  tabs: { home: 'Home', customers: 'Customers', confirmations: 'Confirmations', reports: 'Reports' },
```

`packages/shared/src/i18n/index.ts` — import `arAuth`/`enAuth` and add `auth` to both locales:

```ts
  ar: { common: arCommon, errors: arErrors, reminders: arReminders, auth: arAuth },
  en: { common: enCommon, errors: enErrors, reminders: enReminders, auth: enAuth },
```

Run: `yarn workspace @lamma/shared test && yarn build:shared` → PASS.

- [ ] **Step 2: Write the failing mobile tests**

`apps/mobile/src/i18n/__tests__/direction.test.ts`:

```ts
import { changeLanguage, type DirectionDeps, ensureDirection } from '../direction';
import { useLanguageStore } from '../language-store';

function fakeDeps(isRTL: boolean): DirectionDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    isRTL,
    calls,
    allowRTL: (v) => calls.push(`allow:${v}`),
    forceRTL: (v) => calls.push(`force:${v}`),
    restart: () => calls.push('restart'),
  };
}

describe('direction', () => {
  it('does nothing when the layout already matches the language', () => {
    const deps = fakeDeps(true);
    expect(ensureDirection('ar', deps)).toBe(false);
    expect(deps.calls).toEqual([]);
  });

  it('fixes a mismatch at startup and restarts once', () => {
    const deps = fakeDeps(true);
    expect(ensureDirection('en', deps)).toBe(true);
    expect(deps.calls).toEqual(['allow:true', 'force:false', 'restart']);
  });

  it('saves the language, applies its direction and restarts', () => {
    const deps = fakeDeps(true);
    changeLanguage('en', deps);
    expect(useLanguageStore.getState().language).toBe('en');
    expect(deps.calls).toEqual(['allow:true', 'force:false', 'restart']);
  });

  it('defaults to Arabic', () => {
    useLanguageStore.setState({ language: 'ar' });
    expect(useLanguageStore.persist.getOptions().name).toBe('language');
  });
});
```

`apps/mobile/src/i18n/__tests__/i18n.test.ts`:

```ts
import { initI18n } from '../i18n';

describe('initI18n', () => {
  it('starts synchronously with shared resources and interpolation', () => {
    const i18n = initI18n('ar');
    expect(i18n.t('auth:continue')).toBe('كمّل');
    expect(i18n.t('auth:stepOf', { step: 1, total: 4 })).toBe('خطوة 1 من 4');
    expect(i18n.t('errors:OTP_INVALID')).toBe('الكود مش صح');
  });

  it('is idempotent and switches language', async () => {
    const i18n = initI18n('en');
    await i18n.changeLanguage('en');
    expect(i18n.t('auth:continue')).toBe('Continue');
    expect(initI18n('ar')).toBe(i18n);
  });
});
```

Run: `yarn workspace @lamma/mobile test src/i18n` → FAIL.

- [ ] **Step 3: Implement**

`apps/mobile/src/i18n/language-store.ts`:

```ts
import type { Locale } from '@lamma/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../core/storage/zustand-storage';

interface LanguageState {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

/** Arabic by default, whatever the phone's language: the product is Arabic-first. */
export const useLanguageStore = create<LanguageState>()(
  persist((set) => ({ language: 'ar', setLanguage: (language) => set({ language }) }), {
    name: 'language',
    storage: persistStorage,
  }),
);
```

`apps/mobile/src/i18n/direction.ts`:

```ts
import { I18nManager } from 'react-native';
import RNRestart from 'react-native-restart';
import { isRtl, type Locale } from '@lamma/shared';
import { useLanguageStore } from './language-store';

export interface DirectionDeps {
  isRTL: boolean;
  allowRTL: (value: boolean) => void;
  forceRTL: (value: boolean) => void;
  restart: () => void;
}

const nativeDeps = (): DirectionDeps => ({
  isRTL: I18nManager.isRTL,
  allowRTL: (value) => I18nManager.allowRTL(value),
  forceRTL: (value) => I18nManager.forceRTL(value),
  restart: () => RNRestart.restart(),
});

function apply(language: Locale, deps: DirectionDeps): void {
  deps.allowRTL(true);
  deps.forceRTL(isRtl(language));
  deps.restart();
}

/** RN applies RTL only after a restart; fix any mismatch at startup. Returns true if it restarted. */
export function ensureDirection(language: Locale, deps: DirectionDeps = nativeDeps()): boolean {
  if (deps.isRTL === isRtl(language)) return false;
  apply(language, deps);
  return true;
}

export function changeLanguage(language: Locale, deps: DirectionDeps = nativeDeps()): void {
  useLanguageStore.getState().setLanguage(language);
  apply(language, deps);
}
```

`apps/mobile/src/i18n/i18n.ts`:

```ts
import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type Locale, resources } from '@lamma/shared';

/** Initializes i18next once, synchronously (resources are bundled). */
export function initI18n(language: Locale): I18n {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: DEFAULT_LOCALE,
      ns: ['common', 'errors', 'auth', 'reminders'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      initAsync: false,
    });
  }
  return i18next;
}

export { i18next as i18n };
```

`apps/mobile/src/i18n/index.ts`:

```ts
export { changeLanguage, type DirectionDeps, ensureDirection } from './direction';
export { i18n, initI18n } from './i18n';
export { useLanguageStore } from './language-store';
```

`apps/mobile/src/app/providers/I18nProvider.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../../i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

- [ ] **Step 4: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
git add packages/shared/src apps/mobile
git commit -m "feat(mobile): add i18n, persisted language and RTL direction handling"
```

---

### Task 4: Core — API client with single-flight refresh, errors, secure token, base URL

**Files:**
- Create: `apps/mobile/src/core/api/{app-error,refresh,client,instances}.ts`, `apps/mobile/src/core/storage/secure-token.ts`, `apps/mobile/src/core/config/api-base-url.ts`
- Test: `apps/mobile/src/core/__tests__/{app-error,client,api-base-url,secure-token}.test.ts`

**Interfaces:**
- Consumes: shared `ERROR_CODES`, `ErrorCode`; `app.json` `releaseApiBaseUrl`.
- Produces:
  - `type ClientErrorCode = ErrorCode | 'NETWORK'`; `class AppError extends Error { code; status?; details? }`; `toAppError(error: unknown): AppError`; `errorMessageKey(error: AppError): string` (`'common:network'` or `'errors:<CODE>'`)
  - `interface AuthHooks { getAccessToken(): string | null; refresh(): Promise<string | null>; onAuthFailure(): void }`; `configureAuth(hooks: AuthHooks | null)`
  - `createApiClient(baseURL): AxiosInstance` (bearer + one shared refresh + retry once + errors → `AppError`); `createPublicClient(baseURL)` (errors → `AppError` only)
  - `api`, `publicApi` (instances on `API_BASE_URL`)
  - `resolveApiBaseUrl({ isDev, releaseUrl }): string`; `API_BASE_URL`
  - `saveRefreshToken(token)`, `readRefreshToken(): Promise<string | null>`, `clearRefreshToken()`

- [ ] **Step 1: Write the failing tests**

`apps/mobile/src/core/__tests__/app-error.test.ts`:

```ts
import { AxiosError, AxiosHeaders } from 'axios';
import { AppError, errorMessageKey, toAppError } from '../api/app-error';

const axiosError = (status?: number, data?: unknown) =>
  new AxiosError('x', 'ERR', { headers: new AxiosHeaders() }, null,
    status ? { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } : undefined);

describe('toAppError', () => {
  it('keeps the server error code and details', () => {
    const error = toAppError(axiosError(400, { code: 'VALIDATION_FAILED', details: [{ field: 'name' }] }));
    expect(error).toMatchObject({ code: 'VALIDATION_FAILED', status: 400, details: [{ field: 'name' }] });
  });

  it('maps a missing response to NETWORK and unknown codes to INTERNAL_ERROR', () => {
    expect(toAppError(axiosError()).code).toBe('NETWORK');
    expect(toAppError(axiosError(500, { code: 'WAT' })).code).toBe('INTERNAL_ERROR');
    expect(toAppError(new Error('boom')).code).toBe('INTERNAL_ERROR');
  });

  it('picks the translation key', () => {
    expect(errorMessageKey(new AppError('NETWORK'))).toBe('common:network');
    expect(errorMessageKey(new AppError('OTP_INVALID'))).toBe('errors:OTP_INVALID');
  });
});
```

`apps/mobile/src/core/__tests__/client.test.ts`:

```ts
import MockAdapter from 'axios-mock-adapter';
import { configureAuth, createApiClient } from '../api/client';

const tokenInvalid = [401, { code: 'TOKEN_INVALID', message: 'expired' }] as const;

describe('api client', () => {
  let access: string | null;
  let refresh: jest.Mock<Promise<string | null>, []>;
  let onAuthFailure: jest.Mock;

  beforeEach(() => {
    access = 'old';
    refresh = jest.fn(async () => {
      access = 'new';
      return 'new';
    });
    onAuthFailure = jest.fn();
    configureAuth({ getAccessToken: () => access, refresh, onAuthFailure });
  });

  afterEach(() => configureAuth(null));

  it('sends the access token', async () => {
    const client = createApiClient('http://api');
    const mock = new MockAdapter(client);
    mock.onGet('/business').reply((config) => [200, { auth: config.headers?.Authorization }]);
    await expect(client.get('/business')).resolves.toMatchObject({ data: { auth: 'Bearer old' } });
  });

  it('refreshes once for parallel 401s and retries each request once', async () => {
    const client = createApiClient('http://api');
    const mock = new MockAdapter(client);
    mock.onGet(/\/a|\/b/).reply((config) =>
      config.headers?.Authorization === 'Bearer new' ? [200, { ok: config.url }] : [...tokenInvalid],
    );
    const [a, b] = await Promise.all([client.get('/a'), client.get('/b')]);
    expect([a.data, b.data]).toEqual([{ ok: '/a' }, { ok: '/b' }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh fails', async () => {
    refresh.mockResolvedValueOnce(null);
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet('/a').reply(...tokenInvalid);
    await expect(client.get('/a')).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for other errors', async () => {
    const client = createApiClient('http://api');
    new MockAdapter(client).onPost('/x').reply(400, { code: 'VALIDATION_FAILED', message: '' });
    await expect(client.post('/x')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
```

`apps/mobile/src/core/__tests__/api-base-url.test.ts`:

```ts
import { resolveApiBaseUrl } from '../config/api-base-url';

describe('resolveApiBaseUrl', () => {
  it('uses the emulator host alias in development', () => {
    expect(resolveApiBaseUrl({ isDev: true, releaseUrl: '' })).toBe('http://10.0.2.2:3000/api/v1');
  });

  it('requires a configured URL in release builds', () => {
    expect(resolveApiBaseUrl({ isDev: false, releaseUrl: 'https://api.lamma.app/api/v1' })).toBe(
      'https://api.lamma.app/api/v1',
    );
    expect(() => resolveApiBaseUrl({ isDev: false, releaseUrl: '' })).toThrow(/releaseApiBaseUrl/);
  });
});
```

`apps/mobile/src/core/__tests__/secure-token.test.ts`:

```ts
import { clearRefreshToken, readRefreshToken, saveRefreshToken } from '../storage/secure-token';

describe('secure token storage', () => {
  it('saves, reads and clears the refresh token', async () => {
    await saveRefreshToken('rt-1');
    await expect(readRefreshToken()).resolves.toBe('rt-1');
    await clearRefreshToken();
    await expect(readRefreshToken()).resolves.toBeNull();
  });
});
```

Run: `yarn workspace @lamma/mobile test src/core` → FAIL.

- [ ] **Step 2: Implement**

`apps/mobile/src/core/api/app-error.ts`:

```ts
import { isAxiosError } from 'axios';
import { ERROR_CODES, type ErrorCode } from '@lamma/shared';

export type ClientErrorCode = ErrorCode | 'NETWORK';

export class AppError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isAxiosError(error)) {
    if (!error.response) return new AppError('NETWORK');
    const body = error.response.data as { code?: unknown; details?: unknown } | undefined;
    const code = isErrorCode(body?.code) ? body.code : 'INTERNAL_ERROR';
    return new AppError(code, error.response.status, body?.details);
  }
  return new AppError('INTERNAL_ERROR');
}

export function errorMessageKey(error: AppError): string {
  return error.code === 'NETWORK' ? 'common:network' : `errors:${error.code}`;
}
```

`apps/mobile/src/core/api/refresh.ts`:

```ts
let inflight: Promise<string | null> | null = null;

/** Runs at most one refresh at a time; concurrent callers share its result. */
export function refreshOnce(refresh: () => Promise<string | null>): Promise<string | null> {
  inflight ??= refresh()
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
```

`apps/mobile/src/core/api/client.ts`:

```ts
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { toAppError } from './app-error';
import { refreshOnce } from './refresh';

export interface AuthHooks {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
}

let hooks: AuthHooks | null = null;

/** The auth feature plugs its session in here, so core never imports features. */
export function configureAuth(next: AuthHooks | null): void {
  hooks = next;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

function isExpiredToken(error: AxiosError): boolean {
  const body = error.response?.data as { code?: string } | undefined;
  return error.response?.status === 401 && body?.code === 'TOKEN_INVALID';
}

export function createPublicClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15_000 });
  client.interceptors.response.use(undefined, (error) => Promise.reject(toAppError(error)));
  return client;
}

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15_000 });
  client.interceptors.request.use((config) => {
    const token = hooks?.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (hooks && original && !original._retried && isExpiredToken(error)) {
      original._retried = true;
      const token = await refreshOnce(hooks.refresh);
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`);
        return client(original);
      }
      hooks.onAuthFailure();
    }
    throw toAppError(error);
  });
  return client;
}
```

`apps/mobile/src/core/config/api-base-url.ts`:

```ts
import appConfig from '../../../app.json';

const DEV_API_BASE_URL = 'http://10.0.2.2:3000/api/v1'; // the Android emulator's alias for this PC

export function resolveApiBaseUrl(input: { isDev: boolean; releaseUrl: string }): string {
  if (input.isDev) return DEV_API_BASE_URL;
  if (!input.releaseUrl) throw new Error('Set "releaseApiBaseUrl" in apps/mobile/app.json for release builds');
  return input.releaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl({ isDev: __DEV__, releaseUrl: appConfig.releaseApiBaseUrl });
```

`apps/mobile/src/core/api/instances.ts`:

```ts
import { API_BASE_URL } from '../config/api-base-url';
import { createApiClient, createPublicClient } from './client';

/** Authenticated calls (bearer + refresh). */
export const api = createApiClient(API_BASE_URL);
/** Calls that must never trigger a refresh (refresh/logout themselves). */
export const publicApi = createPublicClient(API_BASE_URL);
```

`apps/mobile/src/core/storage/secure-token.ts`:

```ts
import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.lamma.owner.refresh-token';

/** The refresh token is long-lived: keep it in the Android Keystore, never in MMKV. */
export async function saveRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refresh', token, { service: SERVICE });
}

export async function readRefreshToken(): Promise<string | null> {
  const entry = await Keychain.getGenericPassword({ service: SERVICE });
  return entry ? entry.password : null;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
```

- [ ] **Step 3: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn workspace @lamma/mobile lint
git add apps/mobile/src/core
git commit -m "feat(mobile): add API client with single-flight token refresh and secure token storage"
```

---

### Task 5: Shared components A — text, icons, layout, buttons, inputs

**Files:**
- Create (`apps/mobile/src/shared/components/`): `Text.tsx`, `Icon.tsx`, `Screen.tsx`, `Button.tsx`, `Card.tsx`, `TextField.tsx`, `PhoneInput.tsx`, `OtpInput.tsx`, `SegmentedControl.tsx`, `ChipSelect.tsx`, `StepHeader.tsx`, `index.ts`; `apps/mobile/src/testing/render.tsx`
- Test: `apps/mobile/src/shared/components/__tests__/{text-icon,button,inputs,otp-input,selection,step-header}.test.tsx`

**Interfaces:**
- Consumes: `useTheme`, `makeStyles`, `ThemeProvider`, `initI18n`, `I18nProvider`; shared `toWesternDigits`, `stripFormatting`, `ThemeColors`, `TypeVariant`, `FontWeight`.
- Produces:
  - `renderWithProviders(ui)` test helper (Theme + i18n `ar` + Query + safe area), `await`-able
  - `Text` props: `variant?: TypeVariant` (default `body`), `color?: keyof ThemeColors` (default `ink`), `weight?: FontWeight`, `align?: 'start' | 'center' | 'end'`, `ltr?: boolean`, plus RN `TextProps`
  - `type IconName = 'arrowBack' | 'chevronForward' | 'home' | 'users' | 'confirmations' | 'reports' | 'check' | 'close' | 'plus' | 'search' | 'bell' | 'whatsapp' | 'calendar' | 'sun' | 'moon' | 'language' | 'logout' | 'mail' | 'phone' | 'cash' | 'alert'`; `Icon({ name, size?, color? })` (back arrow mirrors in RTL, chevron in LTR)
  - `Screen({ children, scroll?, footer? })`
  - `Button({ label, onPress, variant?: 'primary'|'whatsapp'|'outline'|'danger'|'ghost', size?: 'large'|'medium', icon?: IconName, loading?, disabled?, testID? })`
  - `Card({ children, style? })`
  - `TextField({ label, hint?, error?, ltr?, suffix?, ...TextInputProps })`; `PhoneInput(props of TextField minus keyboardType)`
  - `OtpInput({ value, onChange, onComplete, error?, autoFocus? })` — normalizes Arabic digits/spaces/bidi marks, keeps 6 digits, calls `onComplete(code)` once per completed code
  - `SegmentedControl<T>({ options: { value: T; label: string }[], value, onChange })`; `ChipSelect<T>({ options, value, onChange, columns? })`
  - `StepHeader({ title, step?, total?, onBack? })`

- [ ] **Step 1: Test helper**

`apps/mobile/src/testing/render.tsx`:

```tsx
import React, { type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '../app/providers/I18nProvider';
import { initI18n } from '../i18n';
import { ThemeProvider } from '../theme';

/** Renders with the real theme, Arabic i18n and a fresh query client. Always `await` it (RNTL 14). */
export function renderWithProviders(ui: ReactElement) {
  initI18n('ar');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <I18nProvider>{ui}</I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
```

- [ ] **Step 2: Write the failing tests**

`__tests__/text-icon.test.tsx`:

```tsx
import React from 'react';
import { screen } from '@testing-library/react-native';
import { lightTheme } from '@lamma/shared';
import { renderWithProviders } from '../../../testing/render';
import { Icon, Text } from '../index';

describe('Text and Icon', () => {
  it('maps variants to the IBM Plex font and theme colors', async () => {
    await renderWithProviders(<Text variant="screenTitle" color="danger">عنوان</Text>);
    const style = Object.assign({}, ...[screen.getByText('عنوان').props.style].flat(3).filter(Boolean));
    expect(style).toMatchObject({ fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 22, color: lightTheme.colors.danger });
  });

  it('forces left-to-right writing for phone numbers', async () => {
    await renderWithProviders(<Text ltr>010 1234 5678</Text>);
    const style = Object.assign({}, ...[screen.getByText('010 1234 5678').props.style].flat(3).filter(Boolean));
    expect(style.writingDirection).toBe('ltr');
  });

  it('renders icons by name', async () => {
    await renderWithProviders(<Icon name="whatsapp" />);
    expect(screen.toJSON()).toBeTruthy();
  });
});
```

`__tests__/button.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Button } from '../index';

describe('Button', () => {
  it('is an accessible 56px button that calls onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="كمّل" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'كمّل' });
    await userEvent.setup().press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading or disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="ابعت" onPress={onPress} loading />);
    await userEvent.setup().press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeBusy();
  });
});
```

`__tests__/inputs.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { PhoneInput, TextField } from '../index';

describe('TextField and PhoneInput', () => {
  it('labels the input and shows the error instead of the hint', async () => {
    await renderWithProviders(<TextField label="اسم النشاط" hint="مساعدة" error="الخانة دي مطلوبة" />);
    expect(screen.getByLabelText('اسم النشاط')).toBeTruthy();
    expect(screen.getByText('الخانة دي مطلوبة')).toBeTruthy();
    expect(screen.queryByText('مساعدة')).toBeNull();
  });

  it('types into a left-to-right phone field', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<PhoneInput label="رقم الموبايل" onChangeText={onChangeText} />);
    const input = screen.getByLabelText('رقم الموبايل');
    await userEvent.setup().type(input, '010');
    expect(onChangeText).toHaveBeenLastCalledWith('010');
    expect(input.props.keyboardType).toBe('phone-pad');
  });
});
```

`__tests__/otp-input.test.tsx`:

```tsx
import React, { useState } from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { OtpInput } from '../index';

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
}

describe('OtpInput', () => {
  it('accepts Arabic digits, spaces and bidi marks and completes once', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText('otp');
    await userEvent.setup().paste(input, '\u200E١٢٣ ٤٥٦');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(screen.getAllByTestId(/otp-box-/).map((b) => b.props.children.props.children)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('ignores extra characters beyond six digits', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await userEvent.setup().paste(screen.getByLabelText('otp'), 'Your code: 654321. Thanks 99');
    expect(onComplete).toHaveBeenCalledWith('654321');
  });
});
```

`__tests__/selection.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { ChipSelect, SegmentedControl } from '../index';

describe('selection controls', () => {
  it('SegmentedControl marks the selected tab and reports changes', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedControl options={[{ value: 'phone', label: 'موبايل' }, { value: 'email', label: 'إيميل' }]} value="phone" onChange={onChange} />,
    );
    expect(screen.getByRole('tab', { name: 'موبايل' })).toBeSelected();
    await userEvent.setup().press(screen.getByRole('tab', { name: 'إيميل' }));
    expect(onChange).toHaveBeenCalledWith('email');
  });

  it('ChipSelect works like a radio group', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <ChipSelect options={[{ value: 'academy', label: 'أكاديمية' }, { value: 'tutor', label: 'مدرّس' }]} value="academy" onChange={onChange} />,
    );
    expect(screen.getByRole('radio', { name: 'أكاديمية' })).toBeChecked();
    await userEvent.setup().press(screen.getByRole('radio', { name: 'مدرّس' }));
    expect(onChange).toHaveBeenCalledWith('tutor');
  });
});
```

`__tests__/step-header.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { StepHeader } from '../index';

describe('StepHeader', () => {
  it('shows the title, step text and a back button', async () => {
    const onBack = jest.fn();
    await renderWithProviders(<StepHeader title="حساب جديد" step={1} total={4} onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'حساب جديد' })).toBeTruthy();
    expect(screen.getByText('خطوة 1 من 4')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('hides the back button without onBack', async () => {
    await renderWithProviders(<StepHeader title="دخول" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
```

Run: `yarn workspace @lamma/mobile test src/shared` → FAIL.

- [ ] **Step 3: Implement the components**

`Text.tsx`:

```tsx
import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import type { FontWeight, ThemeColors, TypeVariant } from '@lamma/shared';
import { useTheme } from '../../theme';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: keyof ThemeColors;
  weight?: FontWeight;
  align?: 'start' | 'center' | 'end';
  /** Phone numbers, codes, InstaPay addresses: always left-to-right. */
  ltr?: boolean;
}

// RN swaps left/right under RTL, so 'left' means "start".
const ALIGN = { start: 'left', center: 'center', end: 'right' } as const;

export function Text({ variant = 'body', color = 'ink', weight, align, ltr, style, ...rest }: AppTextProps) {
  const { colors, type, fonts } = useTheme();
  const scale = type[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight ?? scale.weight],
          fontSize: scale.size,
          lineHeight: Math.round(scale.size * scale.lineHeight),
          color: colors[color],
        },
        align ? { textAlign: ALIGN[align] } : null,
        ltr ? { writingDirection: 'ltr' } : null,
        style,
      ]}
    />
  );
}
```

`Icon.tsx`:

```tsx
import React from 'react';
import { I18nManager } from 'react-native';
import type { ThemeColors } from '@lamma/shared';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Banknote from 'lucide-react-native/icons/banknote';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import ChartNoAxesColumn from 'lucide-react-native/icons/chart-no-axes-column';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import House from 'lucide-react-native/icons/house';
import Languages from 'lucide-react-native/icons/languages';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Moon from 'lucide-react-native/icons/moon';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sun from 'lucide-react-native/icons/sun';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import { useTheme } from '../../theme';

const ICONS = {
  arrowBack: ArrowLeft, chevronForward: ChevronLeft, home: House, users: Users,
  confirmations: CircleCheck, reports: ChartNoAxesColumn, check: Check, close: X, plus: Plus,
  search: Search, bell: Bell, whatsapp: MessageCircle, calendar: Calendar, sun: Sun, moon: Moon,
  language: Languages, logout: LogOut, mail: Mail, phone: Smartphone, cash: Banknote, alert: CircleAlert,
} as const;

export type IconName = keyof typeof ICONS;

/** "Back" points right in RTL; "forward" chevrons point left in RTL (the design's direction). */
function isFlipped(name: IconName): boolean {
  if (name === 'arrowBack') return I18nManager.isRTL;
  if (name === 'chevronForward') return !I18nManager.isRTL;
  return false;
}

export function Icon({ name, size = 24, color = 'ink' }: { name: IconName; size?: number; color?: keyof ThemeColors }) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      color={colors[color]}
      strokeWidth={2}
      style={isFlipped(name) ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
```

`Screen.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Pinned to the bottom (e.g. the primary button), above the keyboard. */
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, footer }: ScreenProps) {
  const styles = useStyles();
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  fill: { flex: 1 },
  content: { paddingHorizontal: t.spacing.screenPaddingX, paddingVertical: 16, gap: t.spacing.stackGap },
  footer: { paddingHorizontal: t.spacing.screenPaddingX, paddingBottom: 16, paddingTop: 8 },
}));
```

`Button.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ThemeColors } from '@lamma/shared';
import { makeStyles, useTheme } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'whatsapp' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'large' | 'medium';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

const LOOK: Record<ButtonVariant, { bg: keyof ThemeColors | null; fg: keyof ThemeColors; border: keyof ThemeColors | null }> = {
  primary: { bg: 'primary', fg: 'onPrimary', border: null },
  whatsapp: { bg: 'whatsapp', fg: 'onPrimary', border: null },
  outline: { bg: 'surface', fg: 'primaryInk', border: 'primary' },
  danger: { bg: 'surface', fg: 'danger', border: 'danger' },
  ghost: { bg: null, fg: 'primaryInk', border: null },
};

export function Button({ label, onPress, variant = 'primary', size = 'large', icon, loading, disabled, testID }: ButtonProps) {
  const styles = useStyles();
  const { colors, sizes } = useTheme();
  const inactive = disabled || loading;
  const look = disabled ? { bg: 'disabledBg' as const, fg: 'muted' as const, border: null } : LOOK[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: size === 'large' ? sizes.buttonPrimary : sizes.buttonSecondary },
        look.bg ? { backgroundColor: colors[look.bg] } : null,
        look.border ? { borderWidth: 1.5, borderColor: colors[look.border] } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[look.fg]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color={look.fg} size={22} /> : null}
          <Text variant="section" color={look.fg}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.85 },
}));
```

`Card.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { makeStyles } from '../../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.line,
    borderWidth: 1,
    borderRadius: t.radius.card,
    padding: t.spacing.cardPadding,
    gap: 12,
  },
}));
```

`TextField.tsx`:

```tsx
import React from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  ltr?: boolean;
  /** Fixed text at the end of the box, e.g. «ج.م». */
  suffix?: string;
}

export function TextField({ label, hint, error, ltr, suffix, ...input }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text weight={600}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          style={[styles.input, ltr ? styles.ltr : null]}
        />
        {suffix ? (
          <View style={styles.suffix}>
            <Text color="muted">{suffix}</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text variant="caption" color="danger">{error}</Text> : null}
      {!error && hint ? <Text variant="caption" color="muted">{hint}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: t.sizes.input,
    borderRadius: t.radius.input,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    backgroundColor: t.colors.surface,
  },
  boxError: { borderColor: t.colors.danger },
  input: { flex: 1, paddingHorizontal: 16, fontFamily: t.fonts[400], fontSize: 18, color: t.colors.ink },
  ltr: { writingDirection: 'ltr' },
  suffix: { paddingHorizontal: 16, borderStartWidth: 1, borderStartColor: t.colors.line, alignSelf: 'stretch', justifyContent: 'center' },
}));
```

`PhoneInput.tsx`:

```tsx
import React from 'react';
import { TextField, type TextFieldProps } from './TextField';

/** Egyptian mobile entry: phone keypad, left-to-right digits. Normalization happens on submit. */
export function PhoneInput(props: Omit<TextFieldProps, 'keyboardType' | 'ltr'>) {
  return <TextField {...props} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" ltr />;
}
```

`OtpInput.tsx`:

```tsx
import React, { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { stripFormatting, toWesternDigits } from '@lamma/shared';
import { makeStyles } from '../../theme';
import { Text } from './Text';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/** Keeps only digits (Arabic-Indic included), max 6; pasting a whole SMS works. */
export function normalizeOtp(raw: string): string {
  return toWesternDigits(stripFormatting(raw)).replace(/\D/g, '').slice(0, LENGTH);
}

export function OtpInput({ value, onChange, onComplete, error, autoFocus = true }: OtpInputProps) {
  const styles = useStyles();
  const input = useRef<TextInput>(null);
  const handleChange = (raw: string) => {
    const next = normalizeOtp(raw);
    onChange(next);
    if (next.length === LENGTH && next !== value) onComplete(next);
  };
  return (
    <Pressable onPress={() => input.current?.focus()} style={styles.row}>
      {Array.from({ length: LENGTH }, (_, i) => (
        <View key={i} testID={`otp-box-${i}`} style={[styles.box, value.length === i ? styles.active : null, error ? styles.error : null]}>
          <Text variant="screenTitle" ltr>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        ref={input}
        accessibilityLabel="otp"
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={64}
        style={styles.hidden}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', direction: 'ltr', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1, height: t.sizes.input, borderRadius: t.radius.input, borderWidth: 1.5,
    borderColor: t.colors.inputBorder, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  active: { borderColor: t.colors.primary, borderWidth: 2 },
  error: { borderColor: t.colors.danger },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
}));
```

Note for the test: box children are `<Text>` whose own child is the digit — the test reads `b.props.children.props.children`. If RNTL exposes the host `View` differently, read the digit with `within(box).getByText(...)` instead; keep the assertion "six boxes show 1…6".

`SegmentedControl.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: Option<T>[]; value: T; onChange: (value: T) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Text weight={selected ? 600 : 500} color={selected ? 'primaryInk' : 'muted'}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { flexDirection: 'row', backgroundColor: t.colors.disabledBg, borderRadius: t.radius.button, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.button - 4 },
  selected: { backgroundColor: t.colors.surface, elevation: 2 },
}));
```

`ChipSelect.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}

export function ChipSelect<T extends string>({ options, value, onChange, columns = 3 }: ChipSelectProps<T>) {
  const styles = useStyles();
  const width = `${100 / columns - 3}%` as const;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, { width }, checked ? styles.checked : null]}
          >
            <Text weight={600} color={checked ? 'onPrimary' : 'ink'}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    height: t.sizes.buttonSecondary, borderRadius: t.radius.button, borderWidth: 1.5,
    borderColor: t.colors.inputBorder, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  checked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
}));
```

`StepHeader.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface StepHeaderProps {
  title: string;
  step?: number;
  total?: number;
  onBack?: () => void;
}

export function StepHeader({ title, step, total, onBack }: StepHeaderProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="screenTitle" accessibilityRole="header" style={styles.title}>{title}</Text>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack} style={styles.back}>
            <Icon name="arrowBack" />
          </Pressable>
        ) : null}
      </View>
      {step && total ? (
        <>
          <View style={styles.bars}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.bar, i < step ? styles.barDone : null]} />
            ))}
          </View>
          <Text variant="caption" color="muted">{t('auth:stepOf', { step, total })}</Text>
        </>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  title: { flex: 1 },
  back: {
    width: 48, height: 48, borderRadius: t.radius.iconTile, borderWidth: 1, borderColor: t.colors.line,
    backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.colors.disabledBg },
  barDone: { backgroundColor: t.colors.primary },
}));
```

`index.ts`:

```ts
export { Button, type ButtonVariant } from './Button';
export { Card } from './Card';
export { ChipSelect } from './ChipSelect';
export { Icon, type IconName } from './Icon';
export { normalizeOtp, OtpInput } from './OtpInput';
export { PhoneInput } from './PhoneInput';
export { Screen } from './Screen';
export { SegmentedControl } from './SegmentedControl';
export { StepHeader } from './StepHeader';
export { Text, type AppTextProps } from './Text';
export { TextField, type TextFieldProps } from './TextField';
```

- [ ] **Step 4: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
git add apps/mobile/src
git commit -m "feat(mobile): add text, icon, layout, button and input components"
```

---

### Task 6: Shared components B — status, money, rows, toggles, feedback

**Files:**
- Create (`apps/mobile/src/shared/components/`): `StatusChip.tsx`, `AmountText.tsx`, `AmountInput.tsx`, `Avatar.tsx`, `CustomerRow.tsx`, `Toggle.tsx`, `ProgressBar.tsx`, `Badge.tsx`, `EmptyState.tsx`, `Skeleton.tsx`
- Modify: `apps/mobile/src/shared/components/index.ts`
- Test: `apps/mobile/src/shared/components/__tests__/{status-amount,rows,feedback}.test.tsx`

**Interfaces:**
- Consumes: Task 5 components; `useLanguageStore`; shared `statusKeyFor`, `formatMoney`, `CURRENCY_LABEL`, `InvoiceStatus`.
- Produces:
  - `StatusChip({ status: InvoiceStatus })` (renders nothing for `upcoming`)
  - `AmountText({ amount, size?: 'large' | 'medium' | 'row', color? })`
  - `AmountInput(props of TextField minus keyboardType/suffix/ltr)`
  - `Avatar({ name, size? })`; `CustomerRow({ name, subtitle, amount, status, onPress? })`
  - `Toggle({ value, onChange, label })`; `ProgressBar({ value: number /*0..1*/ })`; `Badge({ count })`
  - `EmptyState({ icon, title, message?, action? })`; `Skeleton({ width, height, radius? })`

- [ ] **Step 1: Write the failing tests**

`__tests__/status-amount.test.tsx`:

```tsx
import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { AmountInput, AmountText, StatusChip } from '../index';

describe('status and money', () => {
  it('shows the Arabic chip label for each status and nothing for upcoming', async () => {
    await renderWithProviders(
      <>
        <StatusChip status="overdue" />
        <StatusChip status="awaiting_confirmation" />
        <StatusChip status="upcoming" />
      </>,
    );
    expect(screen.getByText('متأخر')).toBeTruthy();
    expect(screen.getByText('في انتظار التأكيد')).toBeTruthy();
    expect(screen.queryByText('مستحق')).toBeNull();
  });

  it('formats amounts with Western digits and a separate currency label', async () => {
    await renderWithProviders(<AmountText amount={23400} size="large" />);
    expect(screen.getByText('23,400')).toBeTruthy();
    expect(screen.getByText('ج.م')).toBeTruthy();
  });

  it('AmountInput uses a number pad and the currency suffix', async () => {
    await renderWithProviders(<AmountInput label="المبلغ" />);
    expect(screen.getByLabelText('المبلغ').props.keyboardType).toBe('number-pad');
    expect(screen.getByText('ج.م')).toBeTruthy();
  });
});
```

`__tests__/rows.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Avatar, CustomerRow, Toggle } from '../index';

describe('rows and toggles', () => {
  it('Avatar shows the first letter', async () => {
    await renderWithProviders(<Avatar name="محمود حسن" />);
    expect(screen.getByText('م')).toBeTruthy();
  });

  it('CustomerRow shows name, subtitle, amount and status and is pressable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <CustomerRow name="محمود حسن" subtitle="اشتراك سبتمبر · متأخر 3 أيام" amount={450} status="overdue" onPress={onPress} />,
    );
    expect(screen.getByText('اشتراك سبتمبر · متأخر 3 أيام')).toBeTruthy();
    expect(screen.getByText('450')).toBeTruthy();
    expect(screen.getByText('متأخر')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: /محمود حسن/ }));
    expect(onPress).toHaveBeenCalled();
  });

  it('Toggle is an accessible switch', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<Toggle label="باك أب" value={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'باك أب' });
    expect(toggle).not.toBeChecked();
    await userEvent.setup().press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

`__tests__/feedback.test.tsx`:

```tsx
import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Badge, Button, EmptyState, ProgressBar, Skeleton } from '../index';

describe('feedback components', () => {
  it('Badge hides at zero and caps at 9+', async () => {
    await renderWithProviders(
      <>
        <Badge count={0} />
        <Badge count={3} />
        <Badge count={12} />
      </>,
    );
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('ProgressBar reports its value', async () => {
    await renderWithProviders(<ProgressBar value={0.74} />);
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 74 });
  });

  it('EmptyState shows title, message and action', async () => {
    await renderWithProviders(
      <EmptyState icon="users" title="لسه مفيش عملاء" message="ضيف أول عميل" action={<Button label="ضيف" onPress={() => {}} />} />,
    );
    expect(screen.getByText('لسه مفيش عملاء')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ضيف' })).toBeTruthy();
  });

  it('Skeleton renders', async () => {
    await renderWithProviders(<Skeleton width={120} height={16} />);
    expect(screen.getByTestId('skeleton')).toBeTruthy();
  });
});
```

Run: `yarn workspace @lamma/mobile test src/shared` → FAIL.

- [ ] **Step 2: Implement**

`StatusChip.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { type InvoiceStatus, statusKeyFor } from '@lamma/shared';
import { makeStyles, useTheme } from '../../theme';
import { Text } from './Text';

export function StatusChip({ status }: { status: InvoiceStatus }) {
  const styles = useStyles();
  const { status: palette } = useTheme();
  const { t } = useTranslation();
  const key = statusKeyFor(status);
  if (!key) return null;
  const colors = palette[key];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.fg }]} />
      <Text variant="caption" weight={600} style={{ color: colors.fg }}>{t(`common:status.${status}`)}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.chip },
  dot: { width: 7, height: 7, borderRadius: 4 },
}));
```

`AmountText.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { formatMoney, type ThemeColors } from '@lamma/shared';
import { useLanguageStore } from '../../i18n';
import { makeStyles } from '../../theme';
import { Text } from './Text';

const SIZES = { large: { number: 38, currency: 22 }, medium: { number: 26, currency: 16 }, row: { number: 16, currency: 12 } } as const;

/** Big Western-digit number with a smaller currency after it (design rule). */
export function AmountText({ amount, size = 'row', color = 'ink' }: { amount: number; size?: keyof typeof SIZES; color?: keyof ThemeColors }) {
  const styles = useStyles();
  const language = useLanguageStore((state) => state.language);
  const money = formatMoney(amount, language);
  const scale = SIZES[size];
  return (
    <View style={styles.row}>
      <Text weight={700} color={color} ltr style={{ fontSize: scale.number, lineHeight: Math.round(scale.number * 1.25) }}>{money.amount}</Text>
      <Text weight={600} color={color} style={{ fontSize: scale.currency }}>{money.currency}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({ row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 } }));
```

`AmountInput.tsx`:

```tsx
import React from 'react';
import { CURRENCY_LABEL } from '@lamma/shared';
import { useLanguageStore } from '../../i18n';
import { TextField, type TextFieldProps } from './TextField';

export function AmountInput(props: Omit<TextFieldProps, 'keyboardType' | 'suffix' | 'ltr'>) {
  const language = useLanguageStore((state) => state.language);
  return <TextField {...props} keyboardType="number-pad" suffix={CURRENCY_LABEL[language]} ltr />;
}
```

`Avatar.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

/** Initial letter on a tint picked from the name, so a customer keeps the same color. */
export function Avatar({ name, size }: { name: string; size?: number }) {
  const { colors, status, sizes } = useTheme();
  const tints = [
    { bg: colors.primarySoft, fg: colors.primaryInk },
    { bg: colors.goldSoft, fg: colors.gold },
    { bg: status.awaiting.bg, fg: status.awaiting.fg },
    { bg: status.overdue.bg, fg: status.overdue.fg },
  ];
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const tint = tints[hash % tints.length];
  const side = size ?? sizes.avatar + 8;
  return (
    <View style={{ width: side, height: side, borderRadius: side / 2, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="section" style={{ color: tint.fg }}>{name.trim().charAt(0)}</Text>
    </View>
  );
}
```

`CustomerRow.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import type { InvoiceStatus } from '@lamma/shared';
import { makeStyles } from '../../theme';
import { AmountText } from './AmountText';
import { Avatar } from './Avatar';
import { StatusChip } from './StatusChip';
import { Text } from './Text';

interface CustomerRowProps {
  name: string;
  subtitle: string;
  amount: number;
  status: InvoiceStatus | null;
  onPress?: () => void;
}

export function CustomerRow({ name, subtitle, amount, status, onPress }: CustomerRowProps) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${name} ${subtitle}`} onPress={onPress} style={styles.row}>
      <Avatar name={name} />
      <View style={styles.texts}>
        <Text variant="section">{name}</Text>
        <Text variant="caption" color="muted" numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.end}>
        <AmountText amount={amount} />
        {status ? <StatusChip status={status} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: t.spacing.cardPadding,
    backgroundColor: t.colors.surface, borderColor: t.colors.line, borderWidth: 1, borderRadius: t.radius.card,
  },
  texts: { flex: 1, gap: 2 },
  end: { alignItems: 'flex-end', gap: 6 },
}));
```

`Toggle.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.track, value ? styles.on : null]}
    >
      <View style={[styles.knob, value ? styles.knobOn : null]} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  track: { width: 52, height: 30, borderRadius: 15, backgroundColor: t.colors.disabledBg, padding: 4, justifyContent: 'center' },
  on: { backgroundColor: t.colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.surface },
  knobOn: { alignSelf: 'flex-end' },
}));
```

`ProgressBar.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';

export function ProgressBar({ value }: { value: number }) {
  const styles = useStyles();
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { height: 14, borderRadius: 7, backgroundColor: t.colors.disabledBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, backgroundColor: t.colors.primary },
}));
```

`Badge.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

export function Badge({ count }: { count: number }) {
  const styles = useStyles();
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text variant="caption" weight={700} color="onPrimary">{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: t.colors.danger, alignItems: 'center', justifyContent: 'center' },
}));
```

`EmptyState.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.tile}>
        <Icon name={icon} size={32} color="primaryInk" />
      </View>
      <Text variant="section" align="center">{title}</Text>
      {message ? <Text color="muted" align="center">{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  tile: { width: 72, height: 72, borderRadius: t.radius.cardLarge, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  action: { alignSelf: 'stretch', marginTop: 8 },
}));
```

`Skeleton.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { useTheme } from '../../theme';

export function Skeleton({ width, height, radius = 8 }: { width: DimensionValue; height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View testID="skeleton" style={{ width, height, borderRadius: radius, backgroundColor: colors.disabledBg, opacity }} />;
}
```

Append to `index.ts`:

```ts
export { AmountInput } from './AmountInput';
export { AmountText } from './AmountText';
export { Avatar } from './Avatar';
export { Badge } from './Badge';
export { CustomerRow } from './CustomerRow';
export { EmptyState } from './EmptyState';
export { ProgressBar } from './ProgressBar';
export { Skeleton } from './Skeleton';
export { StatusChip } from './StatusChip';
export { Toggle } from './Toggle';
```

- [ ] **Step 3: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
git add apps/mobile/src
git commit -m "feat(mobile): add status, money, row, toggle and feedback components"
```

---

### Task 7: Auth session — store, API, restore, refresh wiring

**Files:**
- Create (`apps/mobile/src/features/auth/`): `auth-store.ts`, `session.ts`, `api/auth-api.ts`, `api/use-auth-mutations.ts`, `index.ts`
- Test: `apps/mobile/src/features/auth/__tests__/session.test.ts`

**Interfaces:**
- Consumes: `api`, `publicApi`, `configureAuth`, `AppError`, `saveRefreshToken`, `readRefreshToken`, `clearRefreshToken`; shared `AuthResponse`, `AuthTokens`, `BusinessDto`, `OtpRequestBody`, `OtpVerifyBody`.
- Produces:
  - `type AuthStatus = 'restoring' | 'offline' | 'signedOut' | 'signedIn'`; `useAuthStore` (`{ status, accessToken, business }`, not persisted)
  - `authApi` = `{ requestOtp(body): Promise<void>; verifyOtp(body): Promise<AuthResponse>; refresh(refreshToken): Promise<AuthTokens>; logout(refreshToken): Promise<void>; me(): Promise<BusinessDto> }`
  - `installAuthHooks()`, `restoreSession(): Promise<void>`, `signIn(response: AuthResponse): Promise<void>`, `signOut(): Promise<void>`
  - `useRequestOtp()`, `useVerifyOtp()` (TanStack mutations; `useVerifyOtp` signs in on success)
  - `features/auth/index.ts` exports the above plus (Task 9/10) screens

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/features/auth/__tests__/session.test.ts`:

```ts
import MockAdapter from 'axios-mock-adapter';
import { api, publicApi } from '../../../core/api/instances';
import { readRefreshToken, saveRefreshToken, clearRefreshToken } from '../../../core/storage/secure-token';
import { useAuthStore } from '../auth-store';
import { installAuthHooks, restoreSession, signIn, signOut } from '../session';

const business = { id: 'b1', name: 'أكاديمية النجوم للكرة', type: 'academy', instapayAddress: 'x@instapay', phone: '+201012345678', email: null, plan: 'free', logoUrl: null, area: null, weeklyBackup: false };
const tokens = { accessToken: 'acc-2', refreshToken: 'ref-2', accessTokenExpiresIn: 900 };

describe('session', () => {
  let apiMock: MockAdapter;
  let publicMock: MockAdapter;

  beforeEach(async () => {
    apiMock = new MockAdapter(api);
    publicMock = new MockAdapter(publicApi);
    useAuthStore.setState({ status: 'restoring', accessToken: null, business: null });
    await clearRefreshToken();
    installAuthHooks();
  });

  afterEach(() => {
    apiMock.restore();
    publicMock.restore();
  });

  it('goes to signed-out when there is no saved session', async () => {
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('restores a saved session and rotates the refresh token', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh', { refreshToken: 'ref-1' }).reply(200, tokens);
    apiMock.onGet('/business').reply(200, business);
    await restoreSession();
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'acc-2', business: { id: 'b1' } });
    await expect(readRefreshToken()).resolves.toBe('ref-2');
  });

  it('signs out and forgets the token when the server rejects it', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').reply(401, { code: 'TOKEN_INVALID', message: '' });
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('signedOut');
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('keeps the session when the network is down', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').networkError();
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('offline');
    await expect(readRefreshToken()).resolves.toBe('ref-1');
  });

  it('signs in from a verify response and signs out cleanly', async () => {
    await signIn({ business: business as never, tokens, isNewBusiness: true });
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'acc-2' });
    await expect(readRefreshToken()).resolves.toBe('ref-2');

    publicMock.onPost('/auth/logout').reply(204);
    await signOut();
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', accessToken: null, business: null });
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('refreshes an expired access token transparently during use', async () => {
    await signIn({ business: business as never, tokens: { ...tokens, accessToken: 'stale' }, isNewBusiness: false });
    publicMock.onPost('/auth/refresh').reply(200, { ...tokens, accessToken: 'fresh', refreshToken: 'ref-3' });
    apiMock.onGet('/business').reply((config) =>
      config.headers?.Authorization === 'Bearer fresh' ? [200, business] : [401, { code: 'TOKEN_INVALID', message: '' }],
    );
    await expect(api.get('/business')).resolves.toMatchObject({ data: { id: 'b1' } });
    expect(useAuthStore.getState().accessToken).toBe('fresh');
  });
});
```

Run: `yarn workspace @lamma/mobile test src/features/auth` → FAIL.

- [ ] **Step 2: Implement**

`auth-store.ts`:

```ts
import { create } from 'zustand';
import type { BusinessDto } from '@lamma/shared';

export type AuthStatus = 'restoring' | 'offline' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  business: BusinessDto | null;
}

/** In-memory only: the access token never touches disk. */
export const useAuthStore = create<AuthState>()(() => ({ status: 'restoring', accessToken: null, business: null }));
```

`api/auth-api.ts`:

```ts
import type { AuthResponse, AuthTokens, BusinessDto, OtpRequestBody, OtpVerifyBody } from '@lamma/shared';
import { api, publicApi } from '../../../core/api/instances';

export const authApi = {
  requestOtp: async (body: OtpRequestBody): Promise<void> => {
    await api.post('/auth/otp/request', body);
  },
  verifyOtp: async (body: OtpVerifyBody): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/otp/verify', body)).data,
  refresh: async (refreshToken: string): Promise<AuthTokens> =>
    (await publicApi.post<AuthTokens>('/auth/refresh', { refreshToken })).data,
  logout: async (refreshToken: string): Promise<void> => {
    await publicApi.post('/auth/logout', { refreshToken });
  },
  me: async (): Promise<BusinessDto> => (await api.get<BusinessDto>('/business')).data,
};
```

`session.ts`:

```ts
import type { AuthResponse } from '@lamma/shared';
import { AppError } from '../../core/api/app-error';
import { configureAuth } from '../../core/api/client';
import { clearRefreshToken, readRefreshToken, saveRefreshToken } from '../../core/storage/secure-token';
import { authApi } from './api/auth-api';
import { useAuthStore } from './auth-store';

async function forget(): Promise<void> {
  await clearRefreshToken();
  useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
}

/** Exchanges the saved refresh token for a new pair. Returns the new access token, or null. */
async function rotate(): Promise<string | null> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;
  const tokens = await authApi.refresh(refreshToken);
  await saveRefreshToken(tokens.refreshToken);
  useAuthStore.setState({ accessToken: tokens.accessToken });
  return tokens.accessToken;
}

export function installAuthHooks(): void {
  configureAuth({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refresh: rotate,
    onAuthFailure: () => {
      void forget();
    },
  });
}

export async function restoreSession(): Promise<void> {
  useAuthStore.setState({ status: 'restoring' });
  try {
    const accessToken = await rotate();
    if (!accessToken) return void useAuthStore.setState({ status: 'signedOut' });
    const business = await authApi.me();
    useAuthStore.setState({ status: 'signedIn', business });
  } catch (error) {
    // No internet: keep the saved session and let the owner retry.
    if (error instanceof AppError && error.code === 'NETWORK') return void useAuthStore.setState({ status: 'offline' });
    await forget();
  }
}

export async function signIn(response: AuthResponse): Promise<void> {
  await saveRefreshToken(response.tokens.refreshToken);
  useAuthStore.setState({ status: 'signedIn', accessToken: response.tokens.accessToken, business: response.business });
}

export async function signOut(): Promise<void> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
  await forget();
}
```

`api/use-auth-mutations.ts`:

```ts
import { useMutation } from '@tanstack/react-query';
import type { OtpRequestBody, OtpVerifyBody } from '@lamma/shared';
import type { AppError } from '../../../core/api/app-error';
import { signIn } from '../session';
import { authApi } from './auth-api';

export function useRequestOtp() {
  return useMutation<void, AppError, OtpRequestBody>({ mutationFn: authApi.requestOtp });
}

export function useVerifyOtp() {
  return useMutation<void, AppError, OtpVerifyBody>({
    mutationFn: async (body) => signIn(await authApi.verifyOtp(body)),
  });
}
```

`index.ts`:

```ts
export { useAuthStore, type AuthStatus } from './auth-store';
export { useRequestOtp, useVerifyOtp } from './api/use-auth-mutations';
export { installAuthHooks, restoreSession, signIn, signOut } from './session';
```

- [ ] **Step 3: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn workspace @lamma/mobile lint
git add apps/mobile/src/features/auth
git commit -m "feat(mobile): add auth session with restore, offline handling and token refresh"
```

---

### Task 8: App shell — providers, navigation, tabs, placeholders, component gallery

**Files:**
- Create: `apps/mobile/src/app/{App.tsx,bootstrap.ts}`, `app/providers/QueryProvider.tsx`, `app/navigation/{types,navigation-theme,RootNavigator,AuthStack,MainStack,MainTabs,TabBar,TabBarItem}.ts(x)`, `app/screens/{SplashScreen,OfflineScreen}.tsx`
- Create: `apps/mobile/src/features/{home,customers,confirmations,reports}/{index.ts,screens/<Name>PlaceholderScreen.tsx}`; `apps/mobile/src/features/dev/{index.ts,screens/ComponentGalleryScreen.tsx,components/{GallerySettings,GalleryInputs,GalleryData}.tsx}`
- Create (temporary until Tasks 9–10): `apps/mobile/src/features/auth/screens/{SignupScreen,LoginScreen,OtpVerifyScreen}.tsx` as minimal stubs
- Modify: `apps/mobile/index.js`, `apps/mobile/src/features/auth/index.ts`
- Test: `apps/mobile/src/app/__tests__/root-navigator.test.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `AuthStackParamList = { Signup: { prefill?: { channel: ContactChannel; contact: string; code: string } } | undefined; Login: undefined; OtpVerify: { channel: ContactChannel; contact: string; signup?: SignupDetails } }`
  - `MainTabParamList = { Home: undefined; Customers: undefined; Confirmations: undefined; Reports: undefined }`; `MainStackParamList = { Tabs: undefined; ComponentGallery: undefined }`
  - `bootstrap()` (i18n init + direction check; returns false when it restarted)
  - `App` (providers + `NavigationContainer` + `RootNavigator`; installs auth hooks and restores the session on mount)
  - feature exports: `HomePlaceholderScreen`, `CustomersPlaceholderScreen`, `ConfirmationsPlaceholderScreen`, `ReportsPlaceholderScreen`, `ComponentGalleryScreen`, `SignupScreen`, `LoginScreen`, `OtpVerifyScreen`

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/app/__tests__/root-navigator.test.tsx`:

```tsx
import React from 'react';
import { act, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../features/auth';
import { renderWithProviders } from '../../testing/render';
import { RootNavigator } from '../navigation/RootNavigator';

async function renderRoot() {
  await renderWithProviders(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );
}

describe('RootNavigator', () => {
  it('shows the auth flow when signed out', async () => {
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
    await renderRoot();
    expect(await screen.findByTestId('signup-screen')).toBeTruthy();
  });

  it('shows the four tabs when signed in', async () => {
    useAuthStore.setState({ status: 'signedIn', accessToken: 'a', business: null });
    await renderRoot();
    for (const label of ['الرئيسية', 'العملاء', 'التأكيدات', 'التقارير']) {
      expect(await screen.findByRole('tab', { name: label })).toBeTruthy();
    }
  });

  it('switches to the tabs as soon as the session is signed in', async () => {
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
    await renderRoot();
    await act(async () => useAuthStore.setState({ status: 'signedIn', accessToken: 'a' }));
    expect(await screen.findByRole('tab', { name: 'الرئيسية' })).toBeTruthy();
  });

  it('shows the offline screen with a retry button', async () => {
    useAuthStore.setState({ status: 'offline', accessToken: null, business: null });
    await renderRoot();
    expect(screen.getByText('مفيش إنترنت')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'جرّب تاني' })).toBeTruthy();
  });
});
```

Run → FAIL.

- [ ] **Step 2: Navigation types, theme, stacks, tabs**

`app/navigation/types.ts`:

```ts
import type { ContactChannel, SignupDetails } from '@lamma/shared';

export type AuthStackParamList = {
  Signup: { prefill?: { channel: ContactChannel; contact: string; code: string } } | undefined;
  Login: undefined;
  OtpVerify: { channel: ContactChannel; contact: string; signup?: SignupDetails };
};

export type MainTabParamList = { Home: undefined; Customers: undefined; Confirmations: undefined; Reports: undefined };

export type MainStackParamList = { Tabs: undefined; ComponentGallery: undefined };
```

`app/navigation/navigation-theme.ts`:

```ts
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { AppTheme } from '../../theme';

export function toNavigationTheme(theme: AppTheme): Theme {
  const base = theme.name === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.ink,
      border: theme.colors.line,
      primary: theme.colors.primary,
      notification: theme.colors.danger,
    },
  };
}
```

`app/navigation/AuthStack.tsx`:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, OtpVerifyScreen, SignupScreen } from '../../features/auth';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
```

`app/navigation/TabBarItem.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Icon, type IconName, Text } from '../../shared/components';
import { makeStyles } from '../../theme';

interface TabBarItemProps {
  label: string;
  icon: IconName;
  focused: boolean;
  badge?: number;
  onPress: () => void;
}

export function TabBarItem({ label, icon, focused, badge = 0, onPress }: TabBarItemProps) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }} onPress={onPress} style={styles.item}>
      <View style={[styles.pill, focused ? styles.pillActive : null]}>
        <Icon name={icon} color={focused ? 'primaryInk' : 'muted'} />
        {badge > 0 ? (
          <View style={styles.badge}>
            <Badge count={badge} />
          </View>
        ) : null}
      </View>
      <Text variant="caption" weight={focused ? 700 : 500} color={focused ? 'primaryInk' : 'muted'}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: t.colors.primarySoft },
  badge: { position: 'absolute', top: -6, end: 6 },
}));
```

`app/navigation/TabBar.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { IconName } from '../../shared/components';
import { makeStyles } from '../../theme';
import { TabBarItem } from './TabBarItem';
import type { MainTabParamList } from './types';

const TABS: Record<keyof MainTabParamList, { icon: IconName; label: string }> = {
  Home: { icon: 'home', label: 'common:tabs.home' },
  Customers: { icon: 'users', label: 'common:tabs.customers' },
  Confirmations: { icon: 'confirmations', label: 'common:tabs.confirmations' },
  Reports: { icon: 'reports', label: 'common:tabs.reports' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as keyof MainTabParamList];
        return (
          <TabBarItem
            key={route.key}
            label={t(tab.label)}
            icon={tab.icon}
            focused={state.index === index}
            onPress={() => navigation.navigate(route.name)}
          />
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: { flexDirection: 'row', height: t.sizes.bottomNav, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.line, boxSizing: 'content-box' },
}));
```

Note: `boxSizing: 'content-box'` keeps the 72 px content height above the bottom inset; if the installed RN version rejects it, remove it and add `insets.bottom` to `height` inline instead.

`app/navigation/MainTabs.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConfirmationsPlaceholderScreen } from '../../features/confirmations';
import { CustomersPlaceholderScreen } from '../../features/customers';
import { HomePlaceholderScreen } from '../../features/home';
import { ReportsPlaceholderScreen } from '../../features/reports';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomePlaceholderScreen} />
      <Tab.Screen name="Customers" component={CustomersPlaceholderScreen} />
      <Tab.Screen name="Confirmations" component={ConfirmationsPlaceholderScreen} />
      <Tab.Screen name="Reports" component={ReportsPlaceholderScreen} />
    </Tab.Navigator>
  );
}
```

`app/navigation/MainStack.tsx`:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComponentGalleryScreen } from '../../features/dev';
import { MainTabs } from './MainTabs';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      {__DEV__ ? <Stack.Screen name="ComponentGallery" component={ComponentGalleryScreen} /> : null}
    </Stack.Navigator>
  );
}
```

`app/navigation/RootNavigator.tsx`:

```tsx
import React from 'react';
import { useAuthStore } from '../../features/auth';
import { OfflineScreen } from '../screens/OfflineScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  if (status === 'restoring') return <SplashScreen />;
  if (status === 'offline') return <OfflineScreen />;
  return status === 'signedIn' ? <MainStack /> : <AuthStack />;
}
```

- [ ] **Step 3: Splash, offline, placeholders**

`app/screens/SplashScreen.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../shared/components';
import { makeStyles, useTheme } from '../../theme';

export function SplashScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text variant="display" color="primaryInk">{t('common:appName')}</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24 },
}));
```

`app/screens/OfflineScreen.tsx`:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { restoreSession } from '../../features/auth';
import { Button, EmptyState, Screen } from '../../shared/components';

export function OfflineScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <EmptyState
        icon="alert"
        title={t('common:offlineTitle')}
        message={t('common:network')}
        action={<Button label={t('common:retry')} onPress={() => void restoreSession()} />}
      />
    </Screen>
  );
}
```

`features/home/screens/HomePlaceholderScreen.tsx` (dev button only in debug builds):

```tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen } from '../../../shared/components';

export function HomePlaceholderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Screen>
      <EmptyState icon="home" title={t('common:tabs.home')} message={t('common:comingSoon')} />
      {__DEV__ ? (
        <Button
          label="Component gallery"
          variant="outline"
          onPress={() => navigation.getParent()?.navigate('ComponentGallery' as never)}
        />
      ) : null}
    </Screen>
  );
}
```

`features/home/index.ts`:

```ts
export { HomePlaceholderScreen } from './screens/HomePlaceholderScreen';
```

Create the same pair for `customers` (`CustomersPlaceholderScreen`, icon `users`, title `common:tabs.customers`), `confirmations` (`ConfirmationsPlaceholderScreen`, icon `confirmations`, title `common:tabs.confirmations`) and `reports` (`ReportsPlaceholderScreen`, icon `reports`, title `common:tabs.reports`) — each screen is:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '../../../shared/components';

export function CustomersPlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState icon="users" title={t('common:tabs.customers')} message={t('common:comingSoon')} />
    </Screen>
  );
}
```

(with the name, icon and tab key substituted), and each `index.ts` exports its screen.

Minimal auth stubs (replaced in Tasks 9–10), e.g. `features/auth/screens/SignupScreen.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';

export function SignupScreen() {
  return <View testID="signup-screen" />;
}
```

`LoginScreen.tsx` and `OtpVerifyScreen.tsx`: same shape with `testID="login-screen"` / `"otp-screen"`. Append to `features/auth/index.ts`:

```ts
export { LoginScreen } from './screens/LoginScreen';
export { OtpVerifyScreen } from './screens/OtpVerifyScreen';
export { SignupScreen } from './screens/SignupScreen';
```

- [ ] **Step 4: Component gallery (debug only; English strings allowed)**

`features/dev/components/GallerySettings.tsx`:

```tsx
import React from 'react';
import { changeLanguage, useLanguageStore } from '../../../i18n';
import { Button, Card, SegmentedControl, Text } from '../../../shared/components';
import { type ThemeMode, useThemeStore } from '../../../theme';
import { signOut } from '../../auth';

export function GallerySettings() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const language = useLanguageStore((state) => state.language);
  return (
    <Card>
      <Text variant="section">Theme</Text>
      <SegmentedControl<ThemeMode>
        options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
        value={mode}
        onChange={setMode}
      />
      <Text variant="section">Language (restarts the app)</Text>
      <SegmentedControl
        options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]}
        value={language}
        onChange={(next) => changeLanguage(next)}
      />
      <Button label="Log out" variant="danger" icon="logout" onPress={() => void signOut()} />
    </Card>
  );
}
```

`features/dev/components/GalleryInputs.tsx`:

```tsx
import React, { useState } from 'react';
import { AmountInput, Button, Card, ChipSelect, OtpInput, PhoneInput, StepHeader, TextField, Toggle } from '../../../shared/components';

export function GalleryInputs() {
  const [otp, setOtp] = useState('');
  const [type, setType] = useState<'academy' | 'tutor' | 'other'>('academy');
  const [on, setOn] = useState(true);
  return (
    <Card>
      <StepHeader title="حساب جديد" step={1} total={4} onBack={() => {}} />
      <Button label="دفعت" icon="check" onPress={() => {}} />
      <Button label="ابعت على واتساب" variant="whatsapp" icon="whatsapp" onPress={() => {}} />
      <Button label="هدفع يوم…" variant="outline" icon="calendar" onPress={() => {}} />
      <Button label="رفض" variant="danger" icon="close" onPress={() => {}} />
      <Button label="ابعت الإثبات" disabled onPress={() => {}} />
      <TextField label="اسم النشاط" defaultValue="أكاديمية النجوم للكرة" />
      <PhoneInput label="رقم الموبايل" defaultValue="010 1234 5678" />
      <AmountInput label="المبلغ" defaultValue="450" />
      <TextField label="خانة بخطأ" error="الخانة دي مطلوبة" />
      <OtpInput value={otp} onChange={setOtp} onComplete={() => {}} autoFocus={false} />
      <ChipSelect
        options={[{ value: 'academy', label: 'أكاديمية' }, { value: 'tutor', label: 'مدرّس' }, { value: 'other', label: 'حاجة تانية' }]}
        value={type}
        onChange={setType}
      />
      <Toggle label="toggle" value={on} onChange={setOn} />
    </Card>
  );
}
```

`features/dev/components/GalleryData.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { AmountText, Badge, Card, CustomerRow, EmptyState, ProgressBar, Skeleton, StatusChip } from '../../../shared/components';

export function GalleryData() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <StatusChip status="paid" />
        <StatusChip status="due_soon" />
        <StatusChip status="overdue" />
        <StatusChip status="awaiting_confirmation" />
        <Badge count={3} />
      </View>
      <AmountText amount={23400} size="large" color="primaryInk" />
      <AmountText amount={2850} size="medium" color="danger" />
      <ProgressBar value={0.74} />
      <CustomerRow name="محمود حسن" subtitle="اشتراك سبتمبر · متأخر 3 أيام" amount={450} status="overdue" />
      <CustomerRow name="سارة عادل" subtitle="اشتراك شهري · 26 في الشهر" amount={450} status="due_soon" />
      <CustomerRow name="أحمد السيد" subtitle="اشتراك شهري · ولدين" amount={600} status="awaiting_confirmation" />
      <Skeleton width="100%" height={18} />
      <EmptyState icon="bell" title="مفيش تذكيرات النهارده" message="كل العملاء دافعين" />
    </Card>
  );
}
```

`features/dev/screens/ComponentGalleryScreen.tsx`:

```tsx
import React from 'react';
import { Screen, Text } from '../../../shared/components';
import { GalleryData } from '../components/GalleryData';
import { GalleryInputs } from '../components/GalleryInputs';
import { GallerySettings } from '../components/GallerySettings';

/** Debug-only copy of the design's Components sheet, for visual checks in every theme/language. */
export function ComponentGalleryScreen() {
  return (
    <Screen>
      <Text variant="display">مكوّنات لمّة</Text>
      <GallerySettings />
      <GalleryInputs />
      <GalleryData />
    </Screen>
  );
}
```

`features/dev/index.ts`:

```ts
export { ComponentGalleryScreen } from './screens/ComponentGalleryScreen';
```

- [ ] **Step 5: Providers, App, bootstrap**

`app/providers/QueryProvider.tsx`:

```tsx
import React, { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 }, mutations: { retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

`app/bootstrap.ts`:

```ts
import { ensureDirection, initI18n, useLanguageStore } from '../i18n';

/** Runs before the first render. Returns false if the app is restarting to fix RTL/LTR. */
export function bootstrap(): boolean {
  const { language } = useLanguageStore.getState();
  initI18n(language);
  return !ensureDirection(language);
}
```

`app/App.tsx`:

```tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installAuthHooks, restoreSession } from '../features/auth';
import { ThemeProvider, useTheme } from '../theme';
import { toNavigationTheme } from './navigation/navigation-theme';
import { RootNavigator } from './navigation/RootNavigator';
import { I18nProvider } from './providers/I18nProvider';
import { QueryProvider } from './providers/QueryProvider';

function ThemedNavigation() {
  const theme = useTheme();
  return (
    <NavigationContainer theme={toNavigationTheme(theme)}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    installAuthHooks();
    void restoreSession();
  }, []);
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <I18nProvider>
            <ThemedNavigation />
          </I18nProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
```

`apps/mobile/index.js`:

```js
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { bootstrap } from './src/app/bootstrap';
import { name as appName } from './app.json';

if (bootstrap()) {
  AppRegistry.registerComponent(appName, () => App);
}
```

- [ ] **Step 6: Run tests, lint, check on the emulator, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
```

Start the backend (`yarn workspace @lamma/backend start:dev`), the emulator and Metro, then `yarn workspace @lamma/mobile android`. Expected: splash, then the Signup stub (empty). Stop every process you started.

```bash
git add apps/mobile
git commit -m "feat(mobile): add app shell, navigation, tabs, placeholders and component gallery"
```

---

### Task 9: Signup screen

**Files:**
- Create: `apps/mobile/src/features/auth/schemas/signup-schema.ts`, `components/ContactFields.tsx`, `components/SignupForm.tsx`, `hooks/use-signup-submit.ts`
- Modify: `apps/mobile/src/features/auth/screens/SignupScreen.tsx` (replace stub)
- Test: `apps/mobile/src/features/auth/__tests__/signup-screen.test.tsx`, `signup-schema.test.ts`

**Interfaces:**
- Consumes: `useRequestOtp`, `useVerifyOtp`, components, `AuthStackParamList`; shared `normalizeContact`, `BUSINESS_TYPES`, `CONTACT_CHANNELS`.
- Produces:
  - `signupSchema` (zod) and `type SignupValues = { channel; contact; businessName; businessType; instapayAddress }`; issue messages are `auth:` translation keys
  - `ContactFields({ control, errors, channel })` reused by Login
  - `useSignupSubmit(prefill?)` → `{ submit(values): Promise<void>; pending: boolean; error: AppError | null }`
  - Behavior: no prefill → request OTP (an `OTP_COOLDOWN` error still navigates) → `OtpVerify` with `{ channel, contact, signup }`; with prefill → verify directly with the carried code (no new OTP)

- [ ] **Step 1: Write the failing tests**

`__tests__/signup-schema.test.ts`:

```ts
import { signupSchema } from '../schemas/signup-schema';

const valid = { channel: 'phone', contact: '٠١٠ ١٢٣٤ ٥٦٧٨', businessName: 'أكاديمية النجوم', businessType: 'academy', instapayAddress: 'nogoum@instapay' };

describe('signupSchema', () => {
  it('accepts an Arabic-digit Egyptian mobile', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it('flags a bad phone, a bad email and empty fields with translation keys', () => {
    const issues = (input: object) =>
      (signupSchema.safeParse({ ...valid, ...input }).error?.issues ?? []).map((i) => [i.path.join('.'), i.message]);
    expect(issues({ contact: '0123' })).toEqual([['contact', 'auth:invalidPhone']]);
    expect(issues({ channel: 'email', contact: 'nope' })).toEqual([['contact', 'auth:invalidEmail']]);
    expect(issues({ businessName: ' ' })).toEqual([['businessName', 'auth:required']]);
  });
});
```

`__tests__/signup-screen.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { useAuthStore } from '../auth-store';
import { SignupScreen } from '../screens/SignupScreen';

const navigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate, goBack: jest.fn(), canGoBack: () => false }),
  useRoute: () => ({ params: (globalThis as { __route?: object }).__route }),
}));

async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('رقم الموبايل'), '٠١٠١٢٣٤٥٦٧٨');
  await user.type(screen.getByLabelText('اسم النشاط'), 'أكاديمية النجوم للكرة');
  await user.press(screen.getByRole('radio', { name: 'أكاديمية' }));
  await user.type(screen.getByLabelText('عنوان InstaPay'), 'nogoum.academy@instapay');
  await user.press(screen.getByRole('button', { name: 'كمّل' }));
}

describe('SignupScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    navigate.mockClear();
    (globalThis as { __route?: object }).__route = undefined;
  });
  afterEach(() => mock.restore());

  it('shows the design copy', async () => {
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    expect(screen.getByRole('header', { name: 'حساب جديد' })).toBeTruthy();
    expect(screen.getByText('خطوة 1 من 4')).toBeTruthy();
    expect(screen.getByText('ده العنوان اللي عملاءك هيحوّلوا عليه')).toBeTruthy();
  });

  it('validates before calling the server', async () => {
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    await userEvent.setup().press(screen.getByRole('button', { name: 'كمّل' }));
    expect(await screen.findAllByText('الخانة دي مطلوبة')).not.toHaveLength(0);
    expect(mock.history.post).toHaveLength(0);
  });

  it('requests a code and opens the OTP screen with the signup details', async () => {
    mock.onPost('/auth/otp/request').reply(204);
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    await fill();
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ channel: 'phone', contact: '٠١٠١٢٣٤٥٦٧٨' });
    expect(navigate).toHaveBeenCalledWith('OtpVerify', {
      channel: 'phone',
      contact: '٠١٠١٢٣٤٥٦٧٨',
      signup: { businessName: 'أكاديمية النجوم للكرة', businessType: 'academy', instapayAddress: 'nogoum.academy@instapay' },
    });
  });

  it('finishes sign-up with the carried code when coming from login', async () => {
    (globalThis as { __route?: object }).__route = { prefill: { channel: 'phone', contact: '01012345678', code: '123456' } };
    mock.onPost('/auth/otp/verify').reply(200, {
      business: { id: 'b1' }, tokens: { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900 }, isNewBusiness: true,
    });
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    expect(screen.getByLabelText('رقم الموبايل').props.value).toBe('01012345678');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('اسم النشاط'), 'أكاديمية النجوم للكرة');
    await user.type(screen.getByLabelText('عنوان InstaPay'), 'nogoum.academy@instapay');
    await user.press(screen.getByRole('button', { name: 'كمّل' }));
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ code: '123456', signup: { businessType: 'academy' } });
    expect(mock.history.post.filter((r) => r.url === '/auth/otp/request')).toHaveLength(0);
    expect(useAuthStore.getState().status).toBe('signedIn');
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

`schemas/signup-schema.ts`:

```ts
import { z } from 'zod';
import { BUSINESS_TYPES, CONTACT_CHANNELS, normalizeContact } from '@lamma/shared';

export const contactSchema = z
  .object({ channel: z.enum(CONTACT_CHANNELS), contact: z.string() })
  .superRefine((value, ctx) => {
    if (normalizeContact(value.channel, value.contact)) return;
    ctx.addIssue({
      code: 'custom',
      path: ['contact'],
      message: value.channel === 'phone' ? 'auth:invalidPhone' : 'auth:invalidEmail',
    });
  });

export const signupSchema = z
  .object({
    channel: z.enum(CONTACT_CHANNELS),
    contact: z.string(),
    businessName: z.string().trim().min(2, 'auth:required').max(80),
    businessType: z.enum(BUSINESS_TYPES),
    instapayAddress: z.string().trim().min(3, 'auth:required').max(120),
  })
  .superRefine((value, ctx) => {
    const check = contactSchema.safeParse(value);
    if (!check.success) for (const issue of check.error.issues) ctx.addIssue({ ...issue, code: 'custom' });
  });

export type SignupValues = z.infer<typeof signupSchema>;
```

`components/ContactFields.tsx`:

```tsx
import React from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ContactChannel } from '@lamma/shared';
import { PhoneInput, SegmentedControl, TextField } from '../../../shared/components';

interface ContactValues {
  channel: ContactChannel;
  contact: string;
}

interface ContactFieldsProps {
  control: Control<ContactValues & Record<string, unknown>>;
  errors: FieldErrors<ContactValues>;
  channel: ContactChannel;
}

export function ContactFields({ control, errors, channel }: ContactFieldsProps) {
  const { t } = useTranslation();
  const error = errors.contact?.message ? t(errors.contact.message) : undefined;
  return (
    <>
      <Controller
        control={control}
        name="channel"
        render={({ field }) => (
          <SegmentedControl
            options={[{ value: 'phone', label: t('auth:channelPhone') }, { value: 'email', label: t('auth:channelEmail') }]}
            value={field.value as ContactChannel}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="contact"
        render={({ field }) =>
          channel === 'phone' ? (
            <PhoneInput label={t('auth:phoneLabel')} value={field.value as string} onChangeText={field.onChange} error={error} />
          ) : (
            <TextField
              label={t('auth:emailLabel')}
              value={field.value as string}
              onChangeText={field.onChange}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              ltr
            />
          )
        }
      />
    </>
  );
}
```

`components/SignupForm.tsx`:

```tsx
import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BUSINESS_TYPES, type BusinessType } from '@lamma/shared';
import { ChipSelect, Text, TextField } from '../../../shared/components';
import type { SignupValues } from '../schemas/signup-schema';
import { ContactFields } from './ContactFields';

export function SignupForm({ form }: { form: UseFormReturn<SignupValues> }) {
  const { t } = useTranslation();
  const { control, formState, watch } = form;
  const error = (key: keyof SignupValues) => {
    const message = formState.errors[key]?.message;
    return message ? t(message) : undefined;
  };
  return (
    <>
      <ContactFields control={control as never} errors={formState.errors} channel={watch('channel')} />
      <Controller
        control={control}
        name="businessName"
        render={({ field }) => (
          <TextField label={t('auth:businessNameLabel')} value={field.value} onChangeText={field.onChange} error={error('businessName')} />
        )}
      />
      <Text weight={600}>{t('auth:businessTypeLabel')}</Text>
      <Controller
        control={control}
        name="businessType"
        render={({ field }) => (
          <ChipSelect<BusinessType>
            options={BUSINESS_TYPES.map((type) => ({ value: type, label: t(`common:businessType.${type}`) }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="instapayAddress"
        render={({ field }) => (
          <TextField
            label={t('auth:instapayLabel')}
            hint={t('auth:instapayHint')}
            value={field.value}
            onChangeText={field.onChange}
            error={error('instapayAddress')}
            autoCapitalize="none"
            ltr
          />
        )}
      />
    </>
  );
}
```

`hooks/use-signup-submit.ts`:

```ts
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppError } from '../../../core/api/app-error';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useRequestOtp, useVerifyOtp } from '../api/use-auth-mutations';
import type { SignupValues } from '../schemas/signup-schema';

type Prefill = NonNullable<AuthStackParamList['Signup']>['prefill'];

export function useSignupSubmit(prefill: Prefill) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const submit = async ({ channel, contact, businessName, businessType, instapayAddress }: SignupValues) => {
    const signup = { businessName, businessType, instapayAddress };
    if (prefill) {
      // Coming from login with SIGNUP_REQUIRED: the typed code is still valid, so verify directly.
      await verifyOtp.mutateAsync({ channel, contact, code: prefill.code, signup }).catch(() => undefined);
      return;
    }
    try {
      await requestOtp.mutateAsync({ channel, contact });
    } catch (error) {
      if ((error as AppError).code !== 'OTP_COOLDOWN') return;
    }
    navigation.navigate('OtpVerify', { channel, contact, signup });
  };

  const error = (prefill ? verifyOtp.error : requestOtp.error) ?? null;
  return { submit, pending: requestOtp.isPending || verifyOtp.isPending, error };
}
```

Note: `features/auth` imports `AuthStackParamList` from `src/app/navigation/types` — `app` is not a feature, so the boundary rule allows it.

`screens/SignupScreen.tsx` (replace the stub):

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { errorMessageKey } from '../../../core/api/app-error';
import { Button, Screen, StepHeader, Text } from '../../../shared/components';
import { SignupForm } from '../components/SignupForm';
import { useSignupSubmit } from '../hooks/use-signup-submit';
import { signupSchema, type SignupValues } from '../schemas/signup-schema';

export function SignupScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const prefill = useRoute<RouteProp<AuthStackParamList, 'Signup'>>().params?.prefill;
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      channel: prefill?.channel ?? 'phone',
      contact: prefill?.contact ?? '',
      businessName: '',
      businessType: 'academy',
      instapayAddress: '',
    },
  });
  const { submit, pending, error } = useSignupSubmit(prefill);
  const footer = (
    <View style={{ gap: 12 }}>
      {error ? <Text color="danger" align="center">{t(errorMessageKey(error))}</Text> : null}
      <Button label={t('auth:continue')} loading={pending} onPress={form.handleSubmit(submit)} />
      {!prefill ? (
        <Button label={t('auth:haveAccount')} variant="ghost" size="medium" onPress={() => navigation.navigate('Login' as never)} />
      ) : null}
    </View>
  );
  return (
    <View testID="signup-screen" style={{ flex: 1 }}>
      <Screen footer={footer}>
        <StepHeader title={t('auth:signupTitle')} step={1} total={4} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
        <SignupForm form={form} />
      </Screen>
    </View>
  );
}
```

- [ ] **Step 3: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
git add apps/mobile/src/features/auth
git commit -m "feat(mobile): add sign-up screen with validation and OTP request"
```

---

### Task 10: Login and OTP verification

**Files:**
- Create: `apps/mobile/src/features/auth/schemas/login-schema.ts`, `apps/mobile/src/shared/hooks/use-countdown.ts`
- Modify: `apps/mobile/src/features/auth/screens/LoginScreen.tsx`, `OtpVerifyScreen.tsx` (replace stubs)
- Test: `apps/mobile/src/shared/hooks/__tests__/use-countdown.test.tsx`, `apps/mobile/src/features/auth/__tests__/{login-screen,otp-verify-screen}.test.tsx`

**Interfaces:**
- Consumes: `contactSchema`, `ContactFields`, `useRequestOtp`, `useVerifyOtp`, components, `AppError`, `errorMessageKey`.
- Produces:
  - `loginSchema` / `LoginValues`
  - `useCountdown(seconds: number)` → `{ remaining: number; restart(): void }` (starts on mount)
  - OtpVerify behaviors: auto-submit on 6 digits; inline error text; `SIGNUP_REQUIRED` → «الرقم ده مش متسجّل» + «اعمل حساب» → `navigate('Signup', { prefill: { channel, contact, code } })`; resend shown after 60 s; `OTP_COOLDOWN` on resend restarts the countdown

- [ ] **Step 1: Write the failing tests**

`apps/mobile/src/shared/hooks/__tests__/use-countdown.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react-native';
import { useCountdown } from '../use-countdown';

describe('useCountdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('counts down to zero and restarts', async () => {
    const { result } = await renderHook(() => useCountdown(3));
    expect(result.current.remaining).toBe(3);
    await act(async () => jest.advanceTimersByTime(3_000));
    expect(result.current.remaining).toBe(0);
    await act(async () => result.current.restart());
    expect(result.current.remaining).toBe(3);
  });
});
```

`__tests__/login-screen.test.tsx`:

```tsx
import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { LoginScreen } from '../screens/LoginScreen';

const navigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('LoginScreen', () => {
  it('requests a code for a valid number and opens the OTP screen', async () => {
    const mock = new MockAdapter(api);
    mock.onPost('/auth/otp/request').reply(204);
    await renderWithProviders(<NavigationContainer><LoginScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('رقم الموبايل'), '+20 10 1234 5678');
    await user.press(screen.getByRole('button', { name: 'ابعت الكود' }));
    expect(navigate).toHaveBeenCalledWith('OtpVerify', { channel: 'phone', contact: '+20 10 1234 5678' });
    mock.restore();
  });

  it('rejects an invalid number locally', async () => {
    await renderWithProviders(<NavigationContainer><LoginScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('رقم الموبايل'), '0123');
    await user.press(screen.getByRole('button', { name: 'ابعت الكود' }));
    expect(await screen.findByText('اكتب رقم موبايل مصري صحيح')).toBeTruthy();
  });
});
```

`__tests__/otp-verify-screen.test.tsx`:

```tsx
import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { useAuthStore } from '../auth-store';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';

const navigate = jest.fn();
let params: object = { channel: 'phone', contact: '01012345678' };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate, goBack: jest.fn(), canGoBack: () => true }),
  useRoute: () => ({ params }),
}));

const authResponse = { business: { id: 'b1' }, tokens: { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900 }, isNewBusiness: false };

describe('OtpVerifyScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    navigate.mockClear();
    params = { channel: 'phone', contact: '01012345678' };
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
  });
  afterEach(() => mock.restore());

  it('submits a pasted Arabic code once and signs in', async () => {
    mock.onPost('/auth/otp/verify').reply(200, authResponse);
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText('otp'), 'الكود ١٢٣٤٥٦');
    await act(async () => {});
    expect(mock.history.post).toHaveLength(1);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ channel: 'phone', contact: '01012345678', code: '123456' });
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('shows a translated error for a wrong code', async () => {
    mock.onPost('/auth/otp/verify').reply(400, { code: 'OTP_INVALID', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText('otp'), '000000');
    expect(await screen.findByText('الكود مش صح')).toBeTruthy();
  });

  it('offers sign-up for an unregistered number and carries the code', async () => {
    mock.onPost('/auth/otp/verify').reply(404, { code: 'SIGNUP_REQUIRED', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText('otp'), '123456');
    expect(await screen.findByText('الرقم ده مش متسجّل')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: 'اعمل حساب' }));
    expect(navigate).toHaveBeenCalledWith('Signup', { prefill: { channel: 'phone', contact: '01012345678', code: '123456' } });
  });

  it('sends the signup details when coming from sign-up', async () => {
    params = { channel: 'phone', contact: '01012345678', signup: { businessName: 'x', businessType: 'academy', instapayAddress: 'y@instapay' } };
    mock.onPost('/auth/otp/verify').reply(200, { ...authResponse, isNewBusiness: true });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText('otp'), '123456');
    await act(async () => {});
    expect(JSON.parse(mock.history.post[0].data).signup).toEqual({ businessName: 'x', businessType: 'academy', instapayAddress: 'y@instapay' });
  });

  it('hides resend until the countdown ends', async () => {
    jest.useFakeTimers();
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    expect(screen.queryByRole('button', { name: 'ابعت كود تاني' })).toBeNull();
    await act(async () => jest.advanceTimersByTime(60_000));
    expect(screen.getByRole('button', { name: 'ابعت كود تاني' })).toBeTruthy();
    jest.useRealTimers();
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

`apps/mobile/src/shared/hooks/use-countdown.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';

/** Seconds left until zero; starts on mount; restart() goes back to the full time. */
export function useCountdown(seconds: number) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + seconds * 1000);
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const restart = useCallback(() => setEndsAt(Date.now() + seconds * 1000), [seconds]);
  return { remaining, restart };
}
```

`schemas/login-schema.ts`:

```ts
import type { z } from 'zod';
import { contactSchema } from './signup-schema';

export const loginSchema = contactSchema;
export type LoginValues = z.infer<typeof loginSchema>;
```

`screens/LoginScreen.tsx`:

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { AuthStackParamList } from '../../../app/navigation/types';
import type { AppError } from '../../../core/api/app-error';
import { errorMessageKey } from '../../../core/api/app-error';
import { Button, Screen, StepHeader, Text } from '../../../shared/components';
import { useRequestOtp } from '../api/use-auth-mutations';
import { ContactFields } from '../components/ContactFields';
import { loginSchema, type LoginValues } from '../schemas/login-schema';

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const requestOtp = useRequestOtp();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { channel: 'phone', contact: '' } });

  const submit = async ({ channel, contact }: LoginValues) => {
    try {
      await requestOtp.mutateAsync({ channel, contact });
    } catch (error) {
      if ((error as AppError).code !== 'OTP_COOLDOWN') return;
    }
    navigation.navigate('OtpVerify', { channel, contact });
  };

  const footer = (
    <View style={{ gap: 12 }}>
      {requestOtp.error ? <Text color="danger" align="center">{t(errorMessageKey(requestOtp.error))}</Text> : null}
      <Button label={t('auth:sendCode')} loading={requestOtp.isPending} onPress={form.handleSubmit(submit)} />
      <Button label={t('auth:noAccount')} variant="ghost" size="medium" onPress={() => navigation.navigate('Signup', undefined)} />
    </View>
  );
  return (
    <View testID="login-screen" style={{ flex: 1 }}>
      <Screen footer={footer}>
        <StepHeader title={t('auth:loginTitle')} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
        <ContactFields control={form.control as never} errors={form.formState.errors} channel={form.watch('channel')} />
      </Screen>
    </View>
  );
}
```

`screens/OtpVerifyScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { errorMessageKey } from '../../../core/api/app-error';
import { Button, OtpInput, Screen, StepHeader, Text } from '../../../shared/components';
import { useCountdown } from '../../../shared/hooks/use-countdown';
import { useRequestOtp, useVerifyOtp } from '../api/use-auth-mutations';

const RESEND_SECONDS = 60;

export function OtpVerifyScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { channel, contact, signup } = useRoute<RouteProp<AuthStackParamList, 'OtpVerify'>>().params;
  const [code, setCode] = useState('');
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const countdown = useCountdown(RESEND_SECONDS);

  const submit = (value: string) => verify.mutate({ channel, contact, code: value, signup });
  const resendCode = () =>
    resend.mutate({ channel, contact }, { onSettled: () => countdown.restart() });

  const notRegistered = verify.error?.code === 'SIGNUP_REQUIRED';
  return (
    <View testID="otp-screen" style={{ flex: 1 }}>
      <Screen>
        <StepHeader title={t('auth:otpTitle')} onBack={navigation.goBack} />
        <Text color="muted">{t('auth:otpSentTo', { contact })}</Text>
        <OtpInput value={code} onChange={setCode} onComplete={submit} error={!!verify.error} />
        {notRegistered ? (
          <>
            <Text color="danger">{t('auth:notRegistered')}</Text>
            <Button label={t('auth:createAccount')} onPress={() => navigation.navigate('Signup', { prefill: { channel, contact, code } })} />
          </>
        ) : verify.error ? (
          <Text color="danger">{t(errorMessageKey(verify.error))}</Text>
        ) : null}
        {countdown.remaining > 0 ? (
          <Text variant="caption" color="muted">{t('auth:resendIn', { seconds: countdown.remaining })}</Text>
        ) : (
          <Button label={t('auth:resend')} variant="ghost" size="medium" loading={resend.isPending} onPress={resendCode} />
        )}
      </Screen>
    </View>
  );
}
```

- [ ] **Step 3: Run tests, lint, commit**

```bash
yarn workspace @lamma/mobile test
yarn lint
git add apps/mobile/src
git commit -m "feat(mobile): add login and OTP verification with sign-up handoff"
```

---

### Task 11: Feature boundaries, docs and emulator acceptance

**Files:**
- Create: `apps/mobile/src/__tests__/architecture.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: the whole app.
- Produces: boundary test for `src/features`; README "Mobile app" section; acceptance screenshots under `.superpowers/phase3/` (git-ignored scratch).

- [ ] **Step 1: Write the boundary test**

`apps/mobile/src/__tests__/architecture.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const featuresDir = resolve(__dirname, '../features');
const IMPORT = /from\s+['"](\.[^'"]+)['"]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

function featureOf(path: string): string | null {
  const rel = relative(featuresDir, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

test('features import other features only through their index', () => {
  const files = sourceFiles(featuresDir);
  expect(files.length).toBeGreaterThan(0);
  const violations: string[] = [];
  for (const file of files) {
    const own = featureOf(file);
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const target = resolve(dirname(file), spec);
      const other = featureOf(target);
      if (!other || other === own) continue;
      if (relative(join(featuresDir, other), target) !== 'index') violations.push(`${relative(featuresDir, file)} → ${spec}`);
    }
  }
  expect(violations).toEqual([]);
});
```

Run: `yarn workspace @lamma/mobile test src/__tests__/architecture.test.ts` → PASS (fix any violation by importing through the other feature's `index`).

- [ ] **Step 2: README**

Add after the "API (v1)" section of `README.md`:

````markdown
## Mobile app (owner, React Native)

`apps/mobile` — React Native 0.87 CLI, Android package `com.lamma.owner`. Needs JDK 17 and the Android SDK (API 35/36) with an emulator (e.g. `Pixel_7`).

```bash
yarn workspace @lamma/backend start:dev          # API on :3000 (the emulator reaches it as 10.0.2.2)
"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd Pixel_7
yarn workspace @lamma/mobile start               # Metro
yarn workspace @lamma/mobile android             # build + install the debug app
yarn workspace @lamma/mobile test                # Jest + React Native Testing Library
```

- OTP codes appear in the backend log in development.
- Debug builds open a component gallery from the Home tab (theme + language switches, logout).
- Release builds read the API URL from `apps/mobile/app.json` → `releaseApiBaseUrl` and refuse to start without it.
- iOS: the code is cross-platform, but building needs macOS (not covered yet).
````

- [ ] **Step 3: Full verification**

```bash
yarn install
yarn lint
yarn test
yarn test:e2e
```

Expected: all exit 0.

- [ ] **Step 4: Emulator acceptance (screenshots)**

With the backend, emulator and Metro running and the debug app installed (README commands), capture each step with `adb exec-out screencap -p > .superpowers/phase3/<n>.png`:

1. `01-signup.png` — fresh install: Signup screen matches `lamma-design-handoff/screenshots/Signup.png` (RTL, copy, chips, button).
2. Fill phone `010 1234 5678`, business name, type, InstaPay → «كمّل» → `02-otp.png`. Read the code from the backend log (`[OTP] [phone] +201012345678 → ######`), type it → `03-home.png` (tabs visible, Home placeholder).
3. Kill the app (`adb shell am force-stop com.lamma.owner`) and reopen → `04-restored.png` shows tabs without logging in.
4. Home → Component gallery → `05-gallery-light-ar.png`; switch Theme → Dark → `06-gallery-dark-ar.png`; Language → English (app restarts, LTR) → open gallery again → `07-gallery-dark-en.png`.
5. Gallery → Log out → `08-logged-out.png` shows Signup.

Compare 01 and 05 against the design screenshots (`Signup.png`, `Components.png`); list any visual differences in the report. Stop every process you started.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/__tests__/architecture.test.ts README.md
git commit -m "test(mobile): enforce feature boundaries; docs: add mobile app section"
```
