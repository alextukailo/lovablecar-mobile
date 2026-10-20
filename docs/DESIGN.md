# LovableCar design system — existing implementation

## Principle
Preserve the **actual current screens** during architectural refactoring. This document describes observed tokens and patterns, not a new visual redesign.

## Observed palette
The current services tab defines local colors: navy `#092344`, blue `#0872D5`, muted `#58799D`, sky `#DDF1FF`, yellow `#FFD43B`, yellowLight `#FFF6D9`, white `#FFFFFF`, border `#E1EDF7`, danger `#D85A52`.

**Important:** `src/theme/colors.ts` currently defines a *different* palette (`#F7F7F5` background, `#F5C400` primary). Do not globally replace local screen tokens before visual review. Treat palette consolidation as a separate visual-regression-controlled change.

## Existing assets
`assets/images/cars-hero.png`, `assets/images/lovablecar-main-background.png`, `assets/images/lovablecarlogo.png`, `assets/images/lovablecar-background.png`, and tab icon images. Keep static `require(...)` paths valid when moving UI files; prefer passing image sources as props when moving components.

## UI patterns
Card-based car and service summaries; large image-backed hero areas; rounded controls; high-contrast primary actions; status badges for maintenance; custom tab navigation; form validation and loading/error states; responsive safe-area-aware layouts.

## Design system target
```text
shared/ui/
  Button/ Card/ Screen/ FormField/ EmptyState/
  StatusBadge/ SectionHeader/ LoadingState/
shared/config/
  colors.ts  spacing.ts  typography.ts  radii.ts
```

Do not prematurely combine car, service and maintenance cards: extract a generic surface only when behavior and visual semantics match. Keep domain-specific card variants in their entity/widget slices.

## Accessibility and UX
Touch targets around 44pt or larger; readable contrast; screen-reader labels on icon-only buttons; safe-area insets; keyboard avoidance; loading and error states; consistent locale-aware number/date/currency formatting; preserve current images and positioning.

## Visual QA checklist
Compare before/after screenshots for login, dashboard, tabs, cars, car detail, services, service detail, schedule editor, scanner and profile on iPhone. Check web layout separately. No visual changes should be merged as a side effect of FSD extraction.
