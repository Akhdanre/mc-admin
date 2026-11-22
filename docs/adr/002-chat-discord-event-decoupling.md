# ADR 002: Event-Driven Decoupling Between Chat and Discord

## Status
Accepted

## Context
Previously, `src/server/data/logs/tailer.ts` directly imported and called `sendDiscordChatMessage` and `sendDiscordEvent` from `@/server/data/discord`. Simultaneously, Discord bot execution sent commands into in-game chat, creating a circular coupling between in-game chat tailing and Discord relaying. Testing chat parsing in isolation required mocking or configuring Discord credentials.

## Decision
Decouple `server/chat` from `server/discord`:
1. `server/chat` is an event producer (`EventEmitter`). It emits `chat` and `serverEvent` events and exposes subscription methods (`subscribeToChatStream`, `subscribeToServerEvents`).
2. `server/chat` does not import `server/discord`.
3. In `src/instrumentation.ts` (the server composition root), Discord listeners subscribe to chat events to relay messages and alerts.

```
[Minecraft Log File]
         │
         ▼
[ChatLogTailer] ──(emits "chat", "serverEvent")
         │
         ├──► [SSE Client Web Stream]
         │
         └──► [Discord Relay Subscriber] (wired in instrumentation.ts)
                     │
                     ▼
           [Discord Webhook API]
```

## Consequences
- `server/chat` operates completely standalone and can be unit-tested without external network services.
- Adding additional sinks (e.g. IRC, Matrix, Telegram) requires adding a subscriber without modifying core chat logic.
- Eliminates circular dependencies between server domains.
