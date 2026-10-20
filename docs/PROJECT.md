# LovableCar — Project overview

## Purpose
LovableCar is a mobile-first vehicle maintenance log for car owners. It tracks cars, service records, maintenance schedules and reminders, supports document scanning, and connects Telegram for login and notifications.

## Verified stack (uploaded mobile snapshot)
- Expo SDK 57, React Native 0.86, React 19, TypeScript strict mode
- Expo Router (file-based routes in `src/app`)
- TanStack React Query for server-state fetching/caching
- Zustand for client UI state; React Hook Form and Zod for forms
- i18next/react-i18next with English and Russian locales
- Expo Camera/Image Picker and OCR parser for scanned services
- Expo SecureStore for mobile authentication session storage

## Related backend
Separate NestJS/Prisma/PostgreSQL service, accessed via `EXPO_PUBLIC_API_URL` and the existing API client. The uploaded archive audited here is the **mobile application**; backend endpoints mentioned in other project discussions are not independently validated by this snapshot.

## Product areas
Cars; service history; maintenance schedules; scanner/OCR; profile and preferences; Telegram login/linking; home dashboard.

## Development
`npm install`; `npx expo start`; `npx tsc --noEmit`; `npx expo lint` (if lint configured). Avoid committing API keys or credentials. Use the existing environment configuration.

## Refactor acceptance criteria
No change to visual styling or routing behavior; all existing screen flows preserved; same API request contracts; no cross-slice internal imports; reusable components have explicit props; typecheck and functional smoke tests pass.

## Documentation
See `ARCHITECTURE.md`, `FSD.md`, `DESIGN.md`, and `SCREENS.md`.
