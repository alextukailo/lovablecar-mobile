# Application architecture

## Current state (audited mobile archive, 2026-10-20)
Expo Router screens are implemented under `src/app`; feature components and maintenance utilities exist under `src/features`; global auth, stores, UI components, types, theme, and i18n live in separate top-level directories. This is a hybrid architecture, **not yet fully FSD**.

## Target architecture
```text
src/
  app/                     # Expo Router route entrypoints ONLY (framework-required)
  application/             # app bootstrap, providers, navigation configuration
  pages/                   # FSD page compositions, distinct from Expo Router app/
    home/ cars/ car-details/ services/ service-details/
    maintenance/ scanner/ login/ profile/
  widgets/                 # larger cross-feature UI blocks: app-header, tab-bar, car-overview
  features/                # user actions: add-car, edit-car, add-service, manage-schedule, telegram-login
  entities/                # business objects: car, service, maintenance, user
  shared/
    api/                   # HTTP client and error handling
    config/                # environment, constants
    lib/                   # pure helpers, formatting, date/currency functions
    ui/                    # design-system primitives
    assets/                # references to app assets
    types/                 # truly generic types
  i18n/                    # translations; can later move to shared/config/i18n
```

Expo Router's `src/app` is an **adapter**, not the FSD `app` layer. Keep files there thin; re-export or render from `src/pages` and preserve the exact route paths. Providers belong in root layout/application bootstrap. Do not rename/move routes during initial refactor.

## Data flow
Screen/page -> feature/widget -> entity query or mutation -> shared API -> backend. React Query owns server state and invalidation; Zustand is limited to ephemeral client UI state. Auth/session storage stays centralized. Avoid duplicating server records in Zustand.

## Non-negotiable constraints
- Keep Expo Router navigation client-side; no `window.location` for internal routes.
- Preserve query keys and cache invalidation behavior when extracting hooks.
- Never import internal implementation paths of another slice; use slice public `index.ts` APIs.
- Avoid circular imports; dependencies flow downward.
- Keep secrets out of `EXPO_PUBLIC_*` variables (they are bundled into the app).
- Separate side effects (API, navigation, notifications) from pure transforms.

## Migration phases
1. Baseline: typecheck, screen screenshots, route and API inventory.
2. Add `shared/ui`, `shared/lib`, `shared/api` with tests; centralize repeated tokens and formatting without changing UI.
3. Introduce `entities/{car,service,maintenance,user}` models, types, API hooks and public exports.
4. Extract feature actions/forms and widgets from oversized route files.
5. Create `pages` compositions and replace route bodies with thin adapters.
6. Remove dead duplicates, update imports, run cross-platform smoke tests.

## Test matrix
Authentication and logout; tabs without full reload; car CRUD; service CRUD; schedule editing and reminders; scanner capture/preview/review; language switching; profile/Telegram status; iOS safe areas, Android, and web where supported.
