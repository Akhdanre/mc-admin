# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.8] - 2026-10-07

### Added

- Added Discord notifications for player death messages and advancement/achievement unlocks (including challenges and goals) with colored embeds.
- Added official MIT license (`80cb26a`).
### Changed

- Rewrote project documentation for public release with architecture diagrams, deployment instructions, and feature overview (`80cb26a`).

### Fixed

- Prevented duplicate Discord webhook dispatches and gateway client initializations across isolated Next.js runtime chunks by storing singletons on `globalThis` and removing top-level tailer execution (`25ab894`).

## [0.1.7] - 2026-10-07

### Added

- Added mod and package management interface to track installed mods, toggle state, upload `.jar` files, and search and install packages from Modrinth (`3b73356`).
- Added direct backup archive download and one-click world snapshot rollback system (`f3e5516`).
- Added world map archive import with automatic safety backup and root world level detection (`f3e5516`).
- Added in-app configuration for Minecraft RCON connection and Live Web Map URL in Settings, persisted to persistent storage without requiring `.env` files (`2b34ead`).
- Added persistent session secret storage in `/data/session_secret` to retain login sessions across container restarts without manual environment configuration (`6b3a63f`).

### Removed

- Removed `.env.example` in favor of in-app Settings configuration (`1d45dea`).
- Removed obsolete RCON and web map environment variables from `docker-compose.yml` (`6b3a63f`).

### Fixed
- Published release notes and changelog descriptions to GitHub Releases during automated release workflow (`427b4d2`).

- Fixed light mode text legibility across buttons, inputs, headers, and views by replacing hardcoded slate text classes with theme-adaptive tokens (`dc543b9`).
- Persisted and synced server maintenance difficulty state across page/tab navigation by querying live Minecraft server difficulty via RCON (`3973790`).
- Prevented sidebar badge text wrapping (`725126c`).

## [0.1.6] - 2026-10-06
### Fixed


- Auto-start chat tailer and Discord bot on container boot via Next.js `src/instrumentation.ts` (`fa03a97`).
- Upgraded bind-mount log tailer to active `fs.promises.stat` polling (500ms) with console diagnostics to prevent Docker volume inotify sync deadlocks across containers (`fa03a97`).
- Configured container `user: "${UID:-1000}:${GID:-1000}"` and read-write data volume in `docker-compose.yml` to ensure persistent file permissions (`admin_auth.json`, `discord_config.json`) match volume owner (`e6843d1`).
- Added public DNS resolvers (`1.1.1.1`, `8.8.8.8`) to `docker-compose.yml` to prevent local search domain lookup failures (`ENOTFOUND discord.com`) on bridge networks (`e6843d1`).

### Changed

- Migrated deprecated Next.js `middleware.ts` to standard `proxy.ts` convention (`ac26d8f`).

## [0.1.5] - 2026-10-06

### Fixed

- Fixed login loop on plain HTTP / local network setups by removing HTTPS-only `secure` flag requirement from auth session cookies (`bde512e`).

### Added

- **Discord to Minecraft Bot sync**:
  - Real-time relay of Discord channel messages into Minecraft in-game chat using Discord Gateway WebSocket (`0d1deef`).
  - Formatted broadcast via Minecraft RCON `tellraw` (`[Discord] <Username> Message`).
  - Automated filtering to ignore bot messages and webhook echoes.
  - Configurable in Settings page with Discord Bot Token and Channel ID.

## [0.1.4] - 2026-10-06

### Added

- **Discord Webhook relay integration**:
  - Real-time relay of Minecraft in-game player chat directly to Discord via webhooks (`6a57023`).
  - Automatically fetches player skin heads from public avatar API (`mc-heads.net`) for avatar icons.
  - Relays player join and leave events as colored Discord embeds (green for joined, red for left).
  - Configuration card in Settings page with webhook URL management, toggles, and live "Send Test Ping" button.
  - Configuration persisted to `/data/discord_config.json` with fallback to `DISCORD_WEBHOOK_URL` environment variable.
- **Live in-game chat tracking & broadcasting**:
  - Native log stream parsing from `/data/logs/latest.log` supporting Vanilla and Forge/modded chat formats (`28c8919`).
  - Real-time Server-Sent Events (SSE) streaming via `/api/chat/stream` with zero-latency push and keep-alive pings (`a974843`).
  - Live scrolling chat feed with player badges, server broadcast highlights, and auto-scroll control.
  - Real-time in-app broadcasting via Minecraft RCON `say` command with input sanitization.
  - Dedicated `/api/chat` route and "In-Game Chat" navigation tab.
- **Authentication and session system**:
  - Native Node crypto password hashing using `scrypt` and timing-safe comparisons (`c2e7b9e`).
  - Signed HMAC-SHA256 session tokens stored in HTTP-only cookies (`mc_admin_session`).
  - Edge middleware protecting dashboard and API routes with automatic redirects to `/login`.
  - Dedicated `/login` page with theme toggle and responsive layout.
  - Auth API endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, and `/api/auth/change-password`.
- **Settings page & management**:
  - In-app password updates with verification of current password.
  - Backup retention policy configuration.
  - One-click session sign-out from settings or sidebar footer.
  - Navigation sidebar integration with dedicated Settings tab and Sign Out action.

### Changed

- Migrated deprecated Next.js `middleware.ts` to standard `proxy.ts` (`ac26d8f`).

## [0.1.3] - 2026-10-06

### Added

- Replaced external `mc-backup` container and python scripts with native TypeScript backup & player tracking system (`aab2350`):
  - Direct volume mounting of `/data` (read-only) and `/backups` (read-write).
  - Safe RCON flush (`save-off` -> `save-all flush` -> `save-on`) and automatic `.tar.gz` archiving.
  - Automatic retention policy enforcement and pruning.
  - Native Node/Bun player activity and login tracking from `usercache.json` and `latest.log`.

### Changed

- Updated `docker-compose.yml` to use external `minecraft_default` network (`045c11d`).
- Removed SSH host/user configuration in favor of local/containerized execution for backup and player tracker scripts (`aab2350`).

### Fixed

- Lowercased docker image name for GHCR in release workflow (`8a6e15f`).

## [0.1.2] - 2026-10-06

### Fixed

- Updated Docker base image to `oven/bun:1.4-alpine` to support lockfileVersion 2 (`6b4af07`).

## [0.1.1] - 2026-10-06

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
- Added `.env.example` template covering RCON and Map URL variables.
- Added Docker support: multi-stage `Dockerfile`, `docker-compose.yml`, and `.dockerignore` with standalone Next.js deployment.
- Added automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`) running typecheck, lint, unit tests, and production build on push/PR for `main` and `development`.
- Added unit tests using `bun:test` covering Minecraft RCON list parsing, whitelist parsing, and `cn()` utility.
- Added automated Release & Container CD workflow (`.github/workflows/release.yml`) that triggers on merge/push to `main`:
  - Automatically bumps version in `package.json`.
  - Promotes `[Unreleased]` changes to a dated version section in `CHANGELOG.md`.
  - Creates and pushes Git tag.
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
