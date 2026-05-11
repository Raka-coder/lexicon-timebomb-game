# Copilot Instructions for `lexicon-timebomb-game`

## Build, lint, and test commands

Use Bun in this monorepo.

| Task | Command |
|---|---|
| Install root tooling (husky, prettier) | `bun install` |
| Install backend deps | `bun install --cwd backend` |
| Install frontend deps | `bun install --cwd frontend` |
| Run backend dev server (port 3001) | `bun run --cwd backend dev` |
| Run frontend dev server (port 5173) | `bun run --cwd frontend dev` |
| Lint frontend | `bun run --cwd frontend lint` |
| Lint one file | `bun run --cwd frontend lint src/pages/GamePage.tsx` |
| Build frontend | `bun run --cwd frontend build` |
| Build backend | `bun run --cwd backend build` *(currently fails: Bun build target mismatch with Node HTTP imports in `backend/src/server.ts`)* |

There is currently **no automated test script** in `backend/package.json`, `frontend/package.json`, or root `package.json`, so there is no single-test command yet.

## High-level architecture

- This is a **frontend/backend monorepo**: React + Vite client in `frontend/`, Bun + Hono + Socket.IO server in `backend/`.
- Backend bootstrap flow is: `backend/src/index.ts` → `createHttpServer()` (`server.ts`) + `createSocketIO()` (`server.ts`) + socket handlers (`socket/*`).
- HTTP routes (`/api/health`, `/api/room/:code`, `/api/dictionary/check/:word`) are defined with Hono in `app.ts` and `routes/*`.
- Real-time gameplay is entirely event-driven through Socket.IO:
  - room lifecycle in `socket/roomHandler.ts`
  - gameplay/turn transitions in `socket/gameHandler.ts`
  - disconnect behavior in `socket/disconnectHandler.ts`
- Game state is **in-memory only** on backend (`Map<string, Room>` in `game/roomManager.ts`), so rooms reset when server restarts.
- Timer is **server-authoritative** (`game/timerManager.ts`): server emits `TIMER_SYNC` every second; client only displays it.
- Word validation is split:
  1. local turn-rule validation (`game/gameLogic.ts`: min length, starting letter, duplicate)
  2. dictionary check (`dictionary/words.ts`) against local `kbbi-words.txt` dataset.
- Frontend lifecycle is route-driven (`App.tsx` + pages) with a singleton socket (`hooks/useSocket.ts`) and centralized state in Zustand (`stores/gameStore.ts`).

## Key conventions in this codebase

- **Socket event names are ALL_CAPS strings** (`CREATE_ROOM`, `GAME_STARTED`, `WORD_INVALID`, etc.) and payloads are typed in backend `src/types/index.ts`.
- **Server is the source of truth** for turn/timer/game progression. Frontend should not calculate timer or winner logic independently.
- `room.players` is keyed by **socket ID**, but gameplay uses separate **player IDs** (`crypto.randomUUID()`); keep that distinction when adding features.
- Reconnect flow convention:
  - client emits `SYNC_ROOM` on reconnect (`useGameSocket.ts`)
  - server re-joins socket to room and sends a fresh player snapshot (`roomHandler.ts`).
- UI/game state transitions rely on `gameStatus` (`idle` → `waiting` → `playing` → `finished`) and page guards in `LandingPage`, `PlayPage`, `LobbyPage`, and `GamePage`.
- Audio SFX uses Web Audio API in `lib/sfx.ts` and is initialized lazily from first user interaction in `main.tsx`.
- Path alias `@/*` points to `frontend/src/*` (see `vite.config.ts` and `tsconfig*.json`).

## MCP

- Context7 MCP is configured in repo-level `.mcp.json` as server name `context7` via:
  - `command: npx`
  - `args: ["-y", "@upstash/context7-mcp"]`
