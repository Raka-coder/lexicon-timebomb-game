# 🎮 Sambung Kata — Project Instructions

**Sambung Kata** is a real-time multiplayer word chain game where players must connect words based on their last and first letters. The game features a 15-second bomb timer that switches between players on every valid turn.

## 🏗️ Architecture & Tech Stack

The project is structured as a monorepo with separate `frontend` and `backend` directories.

### Backend
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Hono](https://hono.dev/) with `@hono/node-server`
- **Real-time:** [Socket.IO](https://socket.io/)
- **Validation:** Hybrid KBBI validation (Offline dataset + REST API fallback)
- **State:** In-memory room and game management (reset per session)

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Client/Game state)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Real-time:** `socket.io-client`
- **Audio:** `howler` or Web Audio API for SFX

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed on your machine.

### Installation
```bash
# Install root dependencies (husky, prettier)
bun install

# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd frontend
bun install
```

### Development
```bash
# Run backend (Port 3001)
cd backend
bun run dev # or bun run index.ts

# Run frontend (Port 5173)
cd frontend
bun run dev
```

### Building for Production
```bash
# Backend
cd backend
bun run build # (if applicable)

# Frontend
cd frontend
bun run build
```

---

## 🛠️ Development Conventions

### Code Style
- **TypeScript:** Use strict mode. Prefer interfaces for object shapes and type aliases for unions/primitives.
- **Formatting:** Prettier is used for code formatting.
- **Linting:** ESLint is configured for the frontend.

### Project Structure
Follow the structure defined in `sambung-kata-PRD.md`:
- `shared/types.ts`: Define all shared interfaces and enums here (mirrored or shared between FE/BE).
- `frontend/src/stores`: Use Zustand for global state.
- `frontend/src/hooks`: Custom hooks for socket logic and data fetching.
- `backend/src/game`: Core game logic and room management.

### Key Logic: Word Validation
1. **Normalize:** `trim().toLowerCase().replace(/[^a-z]/g, "")`.
2. **Offline Check:** Check against the 112k+ words in `backend/src/data/kbbi-words.txt`.
3. **API Fallback:** If not found offline, fetch `https://kbbi.raf555.dev/api/{word}` (2s timeout).

### Real-time Events
- All gameplay events are handled via Socket.IO.
- **Timer Sync:** Server broadcasts `TIMER_SYNC` every second; clients only display the value.
- **Turn Start:** Triggered by `TURN_START` event.
- **Word Submission:** Handled via `SUBMIT_WORD` from client and `WORD_VALID`/`WORD_INVALID` from server.

---

## 📝 Implementation Progress (Fases)
Refer to `docs/implementation-phases.md` for detailed step-by-step implementation guides.
- **Fase 0:** Project Setup (Current State)
- **Fase 1:** Room & WebSocket Connection
- **Fase 2:** Core Gameplay & Timer
- **Fase 3:** KBBI Validation
- **Fase 4:** Polish, Scores & SFX
- **Fase 5:** Deployment
