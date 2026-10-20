# Screen and navigation inventory

All paths below are **source file routes** verified in the uploaded mobile archive. Expo Router resolves actual URLs from these files. `(tabs)` is a route group and not a URL segment.

| Route file | Responsibility | Suggested FSD page |
|---|---|---|
| `src/app/index.tsx` | Root entry/redirect | application navigation |
| `src/app/_layout.tsx` | Providers and root stack | application/providers |
| `src/app/login.tsx` | Login | pages/login |
| `src/app/(tabs)/_layout.tsx` | Tab navigation/header | widgets/app-navigation |
| `src/app/(tabs)/index.tsx` | Home/dashboard | pages/home |
| `src/app/(tabs)/cars.tsx` | Cars list | pages/cars |
| `src/app/(tabs)/services.tsx` | Services list | pages/services |
| `src/app/(tabs)/more.tsx` | More/settings entry | pages/more |
| `src/app/car/new.tsx` | Add car | pages/car-create |
| `src/app/car/edit.tsx` | Edit car | pages/car-edit |
| `src/app/car/[id].tsx` | Car details | pages/car-details |
| `src/app/service/new.tsx` | Add service | pages/service-create |
| `src/app/service/edit.tsx` | Edit service | pages/service-edit |
| `src/app/service/[id].tsx` | Service details | pages/service-details |
| `src/app/maintenance/new.tsx` | New schedule | pages/maintenance-create |
| `src/app/maintenance/[id].tsx` | Schedule detail/edit | pages/maintenance-details |
| `src/app/scanner/index.tsx` | Scanner capture | pages/scanner |
| `src/app/scanner/preview.tsx` | Scan preview | pages/scanner-preview |
| `src/app/scanner/processing.tsx` | OCR processing | pages/scanner-processing |
| `src/app/scanner/review.tsx` | OCR review | pages/scanner-review |
| `src/app/profile.tsx` | Profile | pages/profile |
| `src/app/api-test.tsx` | Development API test | dev-only route (review before production) |
| `src/app/explore.tsx` | Explore/legacy screen | audit usage before removal |

## Screen responsibilities
A route should read URL parameters and render a page. Page compositions should own layout, loading/error/empty states and orchestration. Features own mutations and user interactions; entities own data contracts; shared owns reusable presentation primitives.

## Critical user journeys
1. Login via Telegram -> session restore -> tabs.
2. View/add/edit/delete car -> view car service timeline.
3. View/filter/sort services -> add/edit/view service record.
4. View/edit maintenance schedules -> reminders.
5. Scan document -> preview -> OCR processing -> review -> save.
6. Profile and language settings -> Telegram connection and notifications.

## Navigation regression checks
Do not turn tab navigation into full-page reloads on web. Preserve dynamic route params, deep links, back navigation, modals, and authentication guards. Ensure screen modules outside `src/app` are not accidentally registered as routes.
