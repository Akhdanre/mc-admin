# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Live in-game chat tracking & broadcasting**:
  - Native log stream parsing from `/data/logs/latest.log` supporting Vanilla and Forge/modded chat formats.
  - Real-time Server-Sent Events (SSE) streaming via `/api/chat/stream` with zero-latency push and keep-alive pings.
  - Live scrolling chat feed with player badges, server broadcast highlights, and auto-scroll control.
  - Real-time in-app broadcasting via Minecraft RCON `say` command with input sanitization.
  - Dedicated `/api/chat` route and "In-Game Chat" navigation tab.
- **Authentication and session system**:
  - Native Node crypto password hashing using `scrypt` and timing-safe comparisons.
  - Signed HMAC-SHA256 session tokens stored in secure HTTP-only cookies (`mc_admin_session`).
  - Edge middleware protecting dashboard and API routes with automatic redirects to `/login`.
  - Dedicated `/login` page with theme toggle and responsive layout.
  - Auth API endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, and `/api/auth/change-password`.
- **Settings page & management**:
  - In-app password updates with verification of current password.
  - Backup retention policy configuration.
  - One-click session sign-out from settings or sidebar footer.
  - Navigation sidebar integration with dedicated Settings tab and Sign Out action.
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
- Added `.env.example` template covering RCON and Map URL variables.
- Added Docker support: multi-stage `Dockerfile`, `docker-compose.yml`, and `.dockerignore` with standalone Next.js deployment.
- Replaced external `mc-backup` container and python scripts with a 100% native TypeScript backup & player tracking system:
  - Direct volume mounting of `/data` (read-only) and `/backups` (read-write).
  - Safe RCON flush (`save-off` -> `save-all flush` -> `save-on`) and automatic `.tar.gz` archiving.
  - Automatic retention policy enforcement and pruning.
  - Native Node/Bun player activity and login tracking from `usercache.json` and `latest.log`.
- Added automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`) running typecheck, lint, unit tests, and production build on push/PR for `main` and `development`.
- Added unit tests using `bun:test` covering Minecraft RCON list parsing, whitelist parsing, and `cn()` utility.
- Added automated Release & Container CD workflow (`.github/workflows/release.yml`) that triggers on merge/push to `main`:
  - Automatically bumps version in `package.json`.
  - Promotes `[Unreleased]` changes to a dated version section in `CHANGELOG.md`.
  - Creates and pushes Git tag (e.g. `v0.1.1`).
  - Builds and pushes multi-arch Docker image to GitHub Container Registry (`ghcr.io`).
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
- Removed redundant `PORT` config parsing to use default platform behavior.
- Removed SSH host/user configuration in favor of local/containerized execution for backup and player tracker scripts.
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
