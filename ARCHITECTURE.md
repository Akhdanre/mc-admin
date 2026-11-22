# Architecture Documentation

## Overview
`mc-dashboard` is an administrative panel for Minecraft servers built with Next.js (App Router), TypeScript, Bun, and Tailwind CSS. The application follows a modular, feature-based architecture with strict boundary enforcement.

---

## Directory Structure

```
src/
├── app/                        # Next.js App Router (pages and API endpoints only)
│   ├── api/                    # Thin HTTP handlers (validate -> call server feature -> respond)
│   │   ├── auth/               # Login, logout, session, password management
│   │   ├── backup/             # Snapshot listing, trigger, download, restore, retention
│   │   ├── chat/               # Recent messages and SSE live stream
│   │   ├── command/            # Direct RCON command execution with rate limiting
│   │   ├── discord/            # Webhook alerts and bot status/settings
│   │   ├── info/               # Server host & port connection info
│   │   ├── mods/               # Installed mods/plugins CRUD and Modrinth search
│   │   ├── players/            # Player history, locations, teleportation
│   │   ├── settings/           # Server and application properties
│   │   ├── status/             # Realtime player count and difficulty
│   │   ├── whitelist/          # Whitelist operations
│   │   └── world/              # World imports
│   ├── login/                  # Dedicated authentication screen
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                # Client tab router
│   └── providers.tsx           # Theme provider wrapper
│
├── components/                 # UI Presentation Layer
│   ├── features/               # 1:1 view components matching application tabs (*View.tsx)
│   │   ├── backup/             # BackupView.tsx
│   │   ├── chat/               # ChatView.tsx
│   │   ├── console/            # ConsoleView.tsx
│   │   ├── dashboard/          # DashboardView.tsx
│   │   ├── mods/               # ModsView.tsx
│   │   ├── settings/           # SettingsView.tsx
│   │   ├── telemetry/          # TelemetryView.tsx
│   │   ├── users/              # OnlinePlayersView.tsx, AccessControlView.tsx, PlayerInventoryModal.tsx
│   │   └── world/              # WorldView.tsx, LiveMapView.tsx
│   ├── layout/                 # Shell chrome (Sidebar.tsx)
│   └── ui/                     # Design primitives (Button, Card, Modal, Table, Toggle, etc.)
│
├── hooks/                      # Client state and polling hooks
│   ├── useFeedback.ts          # Action feedback toasts
│   ├── usePolling.ts           # Periodic data refresh
│   ├── useServerActions.ts     # Server command/mutation dispatchers
│   └── useServerStatus.ts      # Server polling coordinator
│
├── lib/                        # Universal/client utilities
│   ├── api.ts                  # Typed client fetcher
│   └── cn.ts                   # Class name merger
│
├── schemas/                    # Zod schemas shared by API handlers and client forms
│   └── index.ts                # Command, auth, settings, backup, whitelist, chat schemas
│
├── server/                     # Backend domain modules (server-only)
│   ├── core/                   # Foundation: config, errors, http middleware (handleRoute, rateLimit, csrf)
│   ├── auth/                   # Password verification, HMAC session tokens, withAuth wrapper
│   ├── backup/                 # Snapshots, retention pruning, restore, scheduler, time math
│   ├── chat/                   # Log tailer, SSE emitter, chat & event regex parsers
│   ├── discord/                # Webhook notifier and WebSocket Discord gateway bot
│   ├── mods/                   # Jar metadata extractor, enable/disable toggle, file upload
│   ├── players/                # Coordinate/dimension parsers, location fetcher, activity tracker
│   ├── rcon/                   # RCON client, player list parser, whitelist parser
│   ├── settings/               # App configuration and disk persistence
│   └── world/                  # Level name reader, world zip/tar importer
│
├── types.ts                    # Single source of truth for DTOs and view models
├── proxy.ts                    # Edge session cookie check
└── instrumentation.ts          # Server boot initialization (chat tailer, discord bot, backup scheduler)
```

---

## Dependency & Architectural Rules

1. **Layer Hierarchy**:
   - `app/api/**` -> `server/<feature>` -> `server/core`
   - No reverse dependencies. `server/core` never imports feature modules.
2. **Client Isolation**:
   - Client code (`components/**`, `hooks/**`, `lib/**`, `app/page.tsx`) must **never** import from `server/`.
   - Client code interacts with backend state exclusively via HTTP (`/api/*`).
3. **Public Feature Boundaries**:
   - External callers import a feature strictly via its `index.ts` (e.g. `import { executeRconCommand } from "@/server/rcon"`).
   - Internal implementations (`client.ts`, `service.ts`, `parse.ts`) are encapsulated within each feature folder.
4. **Decoupled Event Streaming**:
   - `server/chat` produces events (`chat`, `serverEvent`) and has zero dependency on Discord.
   - `server/discord` or `instrumentation.ts` subscribes to events.
5. **Pure Logic Separation**:
   - All regex parsers (`parse.ts`) and time calculation helpers (`time.ts`) are pure functions with zero I/O (`fs`, `child_process`, `rcon`), making them fast and isolated for unit tests.

---

## How to Add a Feature

1. **Create Feature Module in `src/server/<name>/`**:
   - `parse.ts`: Pure parser/formatter functions (unit-testable).
   - `service.ts`: I/O operations (`fs`, `child_process`, or external APIs) marked with `import "server-only";`.
   - `index.ts`: Re-export only public functions.
2. **Define Validation Schema in `src/schemas/`**:
   - Add request payload schemas with Zod.
3. **Create API Endpoint in `src/app/api/<name>/route.ts`**:
   - Wrap handler with `withAuth` (or `handleRoute` if unauthenticated).
   - Parse inputs using Zod schema.
   - Call feature service and return `NextResponse.json(...)`.
4. **Build UI View in `src/components/features/<name>/<Name>View.tsx`**:
   - Use direct imports from `@/components/ui/<Component>`.
   - Provide explicit loading and empty states when data is absent.
5. **Register Tab in `src/components/layout/Sidebar.tsx` and `src/app/page.tsx`**.
