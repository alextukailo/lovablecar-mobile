# Feature-Sliced Design rules for LovableCar

## Layers (top to bottom)
`application` (FSD app bootstrap) -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`.

A module can depend on lower layers, never higher layers. Within `features`, `entities`, or `widgets`, avoid importing from another slice in the **same layer**; compose both from an upper layer or extract shared primitives. `src/app` is an Expo Router integration exception.

## Slice layout
```text
features/manage-service/
  ui/ServiceForm.tsx
  model/useCreateService.ts
  api/createService.ts
  lib/normalizeServiceForm.ts
  index.ts
```

Use only segments needed by the slice (`ui`, `model`, `api`, `lib`, `config`). Export a small public API via `index.ts`; never export implementation-only internals.

## Placement examples
- `entities/car`: `Car` model, read API, car-specific display component.
- `features/create-car`: form state, validation, submit mutation.
- `features/manage-maintenance`: schedule editor, mutations and form logic.
- `widgets/car-summary`: car overview block combining multiple entities/features.
- `pages/car-details`: layout/composition and route-level loading/empty/error states.
- `shared/lib/formatCurrency.ts`: pure currency formatting; `shared/ui/Button.tsx`: generic button.
- `shared/config/theme.ts`: color and spacing tokens; `shared/api/client.ts`: HTTP transport.

## Refactoring guidelines
1. Preserve behavior and styles first; don't redesign while extracting.
2. Extract pure helpers before components, then hooks, then UI blocks.
3. Prefer named, typed props over components reading global navigation state.
4. Keep hooks at top level and put request logic in API/model modules.
5. One responsibility per file; target ~100–300 lines for screen compositions where practical, not a rigid limit.
6. Put `StyleSheet` beside its component initially; extract shared design tokens, not one global giant stylesheet.
7. Prefer explicit query key factories and stable cache invalidation.
8. Keep translation keys in locales and call `useTranslation` from UI, not generic utilities.
9. Add focused tests for transforms, selectors, validation, and maintenance calculations.
10. Move incrementally by screen and verify each change before proceeding.

## Import conventions
Use `@/` alias (currently maps to `src/*`); import cross-slice through public APIs (`@/entities/car`), local internals through relative paths. Do not introduce barrel exports for every folder.

## Suggested refactor order
1. Services list (1,620 lines): extract filters, sorting, service row, list header, empty state, query aggregation.
2. Tabs layout (1,175): tab config, navigation item, profile menu, header.
3. Maintenance detail/new: schedule form, field groups, date/mileage calculations.
4. Login: hero/presentation, Telegram flow hook, status UI.
5. Service detail/new: record header, metadata, form sections, mutation hooks.
6. Home dashboard: overview widgets, summary selectors.

## Definition of done
TypeScript passes; routes unchanged; no duplicate data fetching; no regression in current designs; query invalidation and login persist; relevant smoke tests completed.
