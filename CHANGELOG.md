# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Light mode support** with theme toggle and system preference default:
  - Configured `@custom-variant dark` in Tailwind CSS and dynamic CSS custom properties on `:root` and `.dark`.
  - Integrated `next-themes` with hydration-safe `ThemeToggle` in the dashboard header.
  - Introduced `--color-heading` token to flip text between light and dark modes cleanly.
  - Integrated `tailwind-merge` in `cn()` to resolve utility conflicts across custom component overrides.
- **Data layer hooks** (`src/hooks/`): `useServerStatus` (aggregates the polled
  server state), `useServerActions` (whitelist / teleport / RCON / backup
  mutations), `usePolling`, and `useFeedback` — extracted from the page component.
- Typed fetch helpers `apiGet` / `apiPost` in `src/lib/api.ts`.
- `server-only` package and a `server-only` guard import in every `src/server/`
  module, so server code (RCON credentials) can never be bundled to the client.
- Added `.env.example` template covering RCON, SSH, PORT, and Map URL variables.
### Fixed

- Fixed sidebar navigation buttons alignment issue caused by `justify-center` base style conflict.

### Changed

- **Broke up the `page.tsx` god-component** (430 lines, 7 handlers, 12 `useState`)
  into a thin shell that composes the new hooks; behavior and polling cadence
  are unchanged.
- **Reorganized `src/components/`** into layers: `layout/` (Sidebar, Header),
  `features/{dashboard,users,world,console,backup}/`, and the existing `ui/`.
- **Moved server code** from `src/services/` + `src/config.ts` to
  `src/server/services/` + `src/server/config.ts`, updating all import paths.
## [0.1.0] - 2026-10-06

### Added

- **Global design system** with semantic design tokens and reusable UI primitives (`4016e57`).
  - Semantic color tokens in `src/app/globals.css` (`@theme`): surfaces
    (`surface`, `surface-raised`, `overlay`, `background`), borders (`border`,
    `border-strong`), text (`foreground`, `muted`/`subtle`/`faint`), brand
    (`primary`, `ring`), and status colors (`success`, `danger`, `warning`, `info`).
  - Reusable primitives in `src/components/ui/`: `Button` (7 variants),
    `Card` + `CardLabel`, `Badge` (6 tones), `Input` / `Select` / `Textarea`,
    and a `Typography` scale (`PageTitle`, `SectionTitle`, `Body`, `Muted`,
    `Caption`, `Mono`).
  - Dependency-free `cn()` class-name combiner in `src/lib/cn.ts`.
- Dedicated backup management page with retention policy editor and delete controls (`46c1fd9`).
- Backup management widget with status display and manual trigger (`6a6f8d0`).
- Player login history with filtering and sorting (`3b98490`).
- Live map, player location tracking, and teleportation controls (`b349556`).
- Sticky sidebar navigation and dedicated admin views for dashboard, users, world controls, and console (`1b09987`).

### Changed

- Migrated all 12 feature components to the new design tokens and UI primitives,
  replacing scattered hardcoded Tailwind palette classes. Visual output is
  unchanged; no props, state, or behavior were modified (`4016e57`).
- Migrated the project to the Next.js App Router with Tailwind CSS (`7e79018`).
- Refactored architecture to a modular Bun backend with Vite, React, and Tailwind CSS (`3b1c981`).

### Fixed

- `src/app/page.tsx`: deferred the initial `fetchStatus()` call to a microtask to
  avoid calling `setState` synchronously inside an effect
  (`react-hooks/set-state-in-effect`) (`4016e57`).
- `src/components/BackupPage.tsx`: read the current time via `useSyncExternalStore`
  instead of the impure `Date.now()` during render (`react-hooks/purity`) (`4016e57`).

---

## How this changelog is maintained

- New entries go under **[Unreleased]** and are moved into a versioned section on release.
- Each entry references its commit short-hash for traceability.
- Categories follow Keep a Changelog: **Added**, **Changed**, **Deprecated**,
  **Removed**, **Fixed**, **Security**.

[Unreleased]: https://github.com/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/releases/tag/v0.1.0
