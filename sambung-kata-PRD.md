# 🎮 Sambung Kata — Product Requirements Document

> **Real-time Bomb Timer Word Chain Game**
> Mata Kuliah Pemrograman Web · 2024/2025

---

## Daftar Isi

1. [Overview Proyek](#1-overview-proyek)
2. [Tech Stack & Library](#2-tech-stack--library)
3. [Struktur Folder](#3-struktur-folder)
4. [Routes & Endpoints](#4-routes--endpoints)
5. [WebSocket Event Contract](#5-websocket-event-contract)
6. [Strategi Kamus & Validasi KBBI](#6-strategi-kamus--validasi-kbbi)
7. [State Machine Game](#7-state-machine-game)
8. [PRD per Fase Pengembangan](#8-prd-per-fase-pengembangan)
   - [Fase 0 — Project Setup](#fase-0--project-setup-30-menit)
   - [Fase 1 — Room & Koneksi WebSocket](#fase-1--room--koneksi-websocket-3-4-jam)
   - [Fase 2 — Core Gameplay & Timer](#fase-2--core-gameplay--timer-4-5-jam)
   - [Fase 3 — Validasi KBBI Hybrid](#fase-3--validasi-kbbi-hybrid-3-4-jam)
   - [Fase 4 — Polish, Skor & SFX](#fase-4--polish-skor--sfx-3-4-jam)
   - [Fase 5 — Deploy](#fase-5--deploy-1-2-jam)
9. [Prompt Siap Pakai per Fase](#9-prompt-siap-pakai-per-fase)
10. [Checklist Final](#10-checklist-final)

---

## 1. Overview Proyek

**Sambung Kata** adalah game real-time dua pemain berbasis WebSocket. Setiap pemain harus menyambung kata — huruf pertama kata baru harus sama dengan huruf terakhir kata sebelumnya. Terdapat bom timer 15 detik yang berpindah antar pemain setiap kali kata valid dikirim. Pemain yang kehabisan waktu dinyatakan kalah.

| Atribut | Detail |
|---|---|
| **Tipe** | Turn-based real-time, 2 pemain per room |
| **Transport** | WebSocket (Socket.IO) |
| **Validasi Kata** | Hybrid: offline dataset KBBI + REST API fallback |
| **State** | In-memory (tanpa database), reset per session |
| **Target** | Dapat dimainkan dari URL publik setelah deploy |

---

## 2. Tech Stack & Library

### Frontend

| Library | Versi | Fungsi |
|---|---|---|
| `react` + `vite` | ^18 / ^5 | UI framework + dev server |
| `tailwindcss` | ^3 | Utility-first styling |
| `shadcn/ui` | latest | Komponen UI siap pakai (Button, Input, Badge, Dialog, Card) |
| `@tanstack/react-query` | ^5 | Server state, loading/error handling untuk REST calls |
| `zustand` | ^4 | Client state global (gameState, room, scores, timer) |
| `socket.io-client` | ^4 | WebSocket client |
| `howler` | ^2 | Audio SFX (detak timer, bom, kata valid) |
| `uuid` | ^9 | Generate UUID untuk player ID di client |

### Backend

| Library | Versi | Fungsi |
|---|---|---|
| `hono` | ^4 | HTTP framework ringan (REST routes + middleware) |
| `@hono/node-server` | ^1 | Adapter Node.js untuk Hono |
| `socket.io` | ^4 | WebSocket server dengan room support |
| `uuid` | ^9 | Generate room code dan session ID |
| `nodemon` | ^3 | Auto-restart saat development |
| `typescript` | ^5 | Type safety |

### Setup Commands

```bash
# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss @tailwindcss/vite
npm install @tanstack/react-query zustand socket.io-client howler uuid
npm install @types/uuid @types/howler
npx shadcn@latest init

# Backend
mkdir backend && cd backend
npm init -y
npm install hono @hono/node-server socket.io uuid
npm install -D typescript nodemon ts-node @types/node @types/uuid
```

---

## 3. Struktur Folder

```
sambung-kata/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn generated components
│   │   │   ├── room/
│   │   │   │   ├── CreateRoomForm.tsx
│   │   │   │   ├── JoinRoomForm.tsx
│   │   │   │   └── WaitingLobby.tsx
│   │   │   └── game/
│   │   │       ├── GameBoard.tsx      # Container utama game
│   │   │       ├── BombTimer.tsx      # Visual countdown + animasi
│   │   │       ├── WordInput.tsx      # Input + tombol kirim
│   │   │       ├── WordHistory.tsx    # Daftar kata yang sudah dipakai
│   │   │       ├── PlayerCard.tsx     # Nama, skor, status giliran
│   │   │       └── GameOverDialog.tsx # Popup hasil game
│   │   ├── hooks/
│   │   │   ├── useSocket.ts           # Socket.IO client instance
│   │   │   └── useGameSocket.ts       # Handler semua game events
│   │   ├── stores/
│   │   │   ├── gameStore.ts           # Zustand: game state
│   │   │   └── roomStore.ts           # Zustand: room + players
│   │   ├── lib/
│   │   │   ├── sfx.ts                 # Howler.js audio manager
│   │   │   └── queryClient.ts         # TanStack Query instance
│   │   ├── types/
│   │   │   └── index.ts               # Shared types (mirrored dari backend)
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   └── GamePage.tsx
│   │   └── App.tsx
│   ├── public/
│   │   └── sounds/                    # Audio assets (opsional, atau generate via Howler)
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── kbbi-words.txt         # ~112k kata KBBI (download terpisah)
│   │   ├── game/
│   │   │   ├── roomManager.ts         # CRUD room, broadcast helper
│   │   │   ├── gameLogic.ts           # Validasi turn, kata, skor
│   │   │   └── timerManager.ts        # Server-side bomb timer
│   │   ├── dictionary/
│   │   │   └── words.ts               # Load KBBI dataset + validateWord()
│   │   ├── socket/
│   │   │   └── gameHandler.ts         # Semua socket.io event handlers
│   │   ├── routes/
│   │   │   ├── health.ts              # GET /api/health
│   │   │   ├── room.ts                # GET /api/room/:code
│   │   │   └── dictionary.ts          # GET /api/dictionary/check/:word
│   │   └── index.ts                   # Entry point: Hono + Socket.IO
│   ├── nodemon.json
│   └── tsconfig.json
│
└── shared/
    └── types.ts                       # Event types dipakai FE & BE
```

---

## 4. Routes & Endpoints

### REST API (Hono)

| Method | Route | Handler | Deskripsi |
|---|---|---|---|
| `GET` | `/api/health` | `routes/health.ts` | Status server + wordSet.size + uptime |
| `GET` | `/api/room/:code` | `routes/room.ts` | Cek apakah room ada + jumlah pemain |
| `GET` | `/api/dictionary/check/:word` | `routes/dictionary.ts` | Cek satu kata ke KBBI (untuk debugging/testing) |

#### Response Contoh

```ts
// GET /api/health
{
  status: "ok",
  wordCount: 112453,
  uptime: 3600.42,
  timestamp: "2025-01-01T10:00:00Z"
}

// GET /api/room/ABC12
{
  exists: true,
  playerCount: 2,
  status: "waiting" | "playing" | "finished"
}

// GET /api/dictionary/check/kucing
{
  word: "kucing",
  valid: true,
  source: "offline" | "api" | "not_found"
}
```

---

### Socket.IO Events

Semua gameplay berjalan via Socket.IO. Lihat [Bagian 5](#5-websocket-event-contract) untuk detail lengkap.

| Namespace | Event Arah | Jumlah Event |
|---|---|---|
| `/` (default) | Client → Server | 4 events |
| `/` (default) | Server → Client | 8 events |

---

## 5. WebSocket Event Contract

### Client → Server

```ts
// Tipe union untuk semua event yang dikirim client
type ClientEvent =
  | { type: "CREATE_ROOM";  payload: { playerName: string } }
  | { type: "JOIN_ROOM";    payload: { roomCode: string; playerName: string } }
  | { type: "START_GAME";   payload: {} }
  | { type: "SUBMIT_WORD";  payload: { word: string } }
```

| Event | Payload | Kapan Dikirim |
|---|---|---|
| `CREATE_ROOM` | `{ playerName }` | Host klik "Buat Room" |
| `JOIN_ROOM` | `{ roomCode, playerName }` | Player 2 submit form join |
| `START_GAME` | `{}` | Host klik "Mulai Game" (hanya boleh jika 2 pemain) |
| `SUBMIT_WORD` | `{ word }` | Player kirim jawaban kata |

---

### Server → Client

```ts
type ServerEvent =
  | { type: "ROOM_CREATED";   payload: { roomCode: string; playerId: string } }
  | { type: "PLAYER_JOINED";  payload: { players: Player[] } }
  | { type: "PLAYER_LEFT";    payload: { playerName: string } }
  | { type: "TURN_START";     payload: { currentPlayerId: string; timeLeft: number; requiredLetter: string } }
  | { type: "WORD_VALID";     payload: { word: string; playerId: string; scores: Record<string, number>; nextLetter: string } }
  | { type: "WORD_INVALID";   payload: { reason: WordInvalidReason; word: string } }
  | { type: "TIMER_SYNC";     payload: { timeLeft: number } }
  | { type: "GAME_OVER";      payload: { winnerId: string; loserId: string; reason: GameOverReason; scores: Record<string, number>; wordHistory: string[] } }
```

| Event | Dikirim Ke | Trigger |
|---|---|---|
| `ROOM_CREATED` | Host saja | Setelah `CREATE_ROOM` sukses |
| `PLAYER_JOINED` | Semua di room | Setiap ada pemain baru join |
| `PLAYER_LEFT` | Semua di room | Koneksi WS putus |
| `TURN_START` | Semua di room | Game mulai / kata valid diterima |
| `WORD_VALID` | Semua di room | Kata lolos semua validasi |
| `WORD_INVALID` | Pengirim saja | Kata gagal validasi |
| `TIMER_SYNC` | Semua di room | Setiap 1 detik selama giliran aktif |
| `GAME_OVER` | Semua di room | Timer habis / pemain disconnect |

---

### Enum Types

```ts
type WordInvalidReason =
  | "wrong_start_letter"   // huruf pertama ≠ huruf terakhir kata sebelumnya
  | "duplicate_word"       // kata sudah dipakai di game ini
  | "too_short"            // kata < 3 huruf
  | "not_in_dictionary"    // tidak ada di KBBI (setelah cek offline + API)
  | "not_your_turn"        // bukan giliran pemain ini

type GameOverReason =
  | "timeout"              // timer habis
  | "disconnect"           // lawan disconnect
```

---

## 6. Strategi Kamus & Validasi KBBI

### Dataset yang Digunakan

| Sumber | Kata | Format | Link |
|---|---|---|---|
| `damzaky/kumpulan-kata-bahasa-indonesia-KBBI` | ~112.000 | TXT (1 kata/baris) | Primary — offline |
| `dyazincahya/KBBI-SQL-database` | 115.978 | JSON/SQL/CSV | Alternatif offline |
| `kbbi.raf555.dev` | Live | REST API | Fallback API (mirror Android) |
| `services.x-labs.my.id/kbbi` | Live | REST API | Fallback API alternatif |

> **Rekomendasi**: Gunakan `damzaky` untuk offline set (ringan, hanya daftar kata), dan `kbbi.raf555.dev` sebagai fallback API karena tanpa web scraping dan latency rendah.

---

### Implementasi Hybrid Validation

```
Kata diterima dari client
        │
        ▼
┌───────────────────┐
│  Normalisasi kata │  → trim() + toLowerCase() + hapus non-[a-z]
└────────┬──────────┘
         │
         ▼
┌───────────────────┐         ✅ Ada
│  wordSet.has(w)?  │──────────────────► return { valid: true, source: "offline" }
└────────┬──────────┘
         │ ❌ Tidak ada
         ▼
┌───────────────────────────────┐
│  fetch kbbi.raf555.dev/api/w  │ timeout: 2000ms
└────────┬──────────────────────┘
         │
    ┌────┴────┐
    │         │
  OK 200    Error/Timeout
    │         │
    ▼         ▼
  wordSet   return { valid: false, source: "timeout" }
  .add(w)
  return { valid: true, source: "api" }
```

### Kode Implementasi

```ts
// backend/src/dictionary/words.ts
import { readFileSync } from "fs";
import { join } from "path";

const raw = readFileSync(join(__dirname, "../data/kbbi-words.txt"), "utf-8");
export const wordSet = new Set<string>(
  raw.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean)
);

export type ValidationResult = {
  valid: boolean;
  source: "offline" | "api" | "timeout" | "not_found";
};

export async function validateWord(word: string): Promise<ValidationResult> {
  const w = word.trim().toLowerCase().replace(/[^a-z]/g, "");

  // Layer 1: offline check (O(1))
  if (wordSet.has(w)) return { valid: true, source: "offline" };

  // Layer 2: API fallback
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`https://kbbi.raf555.dev/api/${w}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      wordSet.add(w); // warm cache
      return { valid: true, source: "api" };
    }
    return { valid: false, source: "not_found" };
  } catch {
    return { valid: false, source: "timeout" };
  }
}

export function getRandomStartWord(): string {
  const candidates = [...wordSet].filter(
    (w) => w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w)
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

---

## 7. State Machine Game

```
┌──────────┐   CREATE_ROOM    ┌──────────────┐
│  IDLE    │─────────────────►│   WAITING    │
│ (landing)│                  │ (lobby room) │
└──────────┘                  └──────┬───────┘
                                     │ START_GAME (2 pemain)
                                     ▼
                              ┌──────────────┐
                         ┌───►│ TURN_ACTIVE  │◄──────────────┐
                         │    │(timer jalan) │               │
                         │    └──────┬───────┘               │
                         │           │                        │
                         │    SUBMIT_WORD                     │
                         │           │                        │
                         │    ┌──────▼───────┐               │
                         │    │  VALIDATING  │               │
                         │    │ (async KBBI) │               │
                         │    └──────┬───────┘               │
                         │           │                        │
                         │     ┌─────┴──────┐                │
                         │   Valid        Invalid             │
                         │     │              │               │
                         │     ▼              ▼               │
                         │  WORD_VALID   WORD_INVALID         │
                         │  (bom pindah) (error msg)          │
                         └─────────────────────┘             │
                                                             │
                              ┌──────────────┐               │
                              │  GAME_OVER   │               │
                              │  (popup)     │               │
                              └──────┬───────┘               │
                                     │ Main Lagi             │
                                     └───────────────────────┘
```

### Zustand Store Structure

```ts
// stores/gameStore.ts
interface GameState {
  // Room
  roomCode: string | null;
  myPlayerId: string;
  players: Player[];
  isHost: boolean;

  // Game
  gameStatus: "idle" | "waiting" | "playing" | "finished";
  currentPlayerId: string | null;
  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  scores: Record<string, number>;

  // Timer
  timeLeft: number;
  isMyTurn: boolean;

  // UI
  errorMessage: string | null;
  isValidating: boolean;

  // Actions
  setRoom: (code: string) => void;
  addWord: (word: string, playerId: string) => void;
  updateScores: (scores: Record<string, number>) => void;
  setTimeLeft: (t: number) => void;
  setError: (msg: string | null) => void;
  resetGame: () => void;
}
```

---

## 8. PRD per Fase Pengembangan

> **Aturan penting**: Setiap fase harus menghasilkan sesuatu yang bisa dijalankan dan ditest sebelum lanjut ke fase berikutnya. Kerjakan backend dan frontend **secara paralel** dalam satu fase.

---

### Fase 0 — Project Setup (30 menit)

**Tujuan**: Semua dependencies terinstall, TypeScript bisa compile, dev server berjalan.

#### Checklist Backend

- [ ] `npm init` + install semua dependencies backend
- [ ] Buat `tsconfig.json` dengan `strict: true`
- [ ] Buat `nodemon.json` untuk watch `src/**/*.ts`
- [ ] Buat `index.ts` — Hono app + `@hono/node-server` jalan di port 3001
- [ ] Tambah route dummy `GET /api/health` → `{ status: "ok" }`
- [ ] Buat `shared/types.ts` dengan semua interface dan enum

#### Checklist Frontend

- [ ] `npm create vite` + install semua dependencies frontend
- [ ] Setup Tailwind CSS + `tailwind.config.ts`
- [ ] Jalankan `npx shadcn@latest init` + install komponen: `button`, `input`, `card`, `badge`, `dialog`
- [ ] Setup TanStack Query `QueryClient` di `lib/queryClient.ts`
- [ ] Buat Zustand store kosong di `stores/gameStore.ts`
- [ ] Verifikasi hot reload berjalan

#### Test Selesai

```bash
# Backend
curl http://localhost:3001/api/health
# → { "status": "ok" }

# Frontend
# → Browser menampilkan Vite default page di localhost:5173
```

---

### Fase 1 — Room & Koneksi WebSocket (3–4 jam)

**Tujuan**: Dua browser bisa terhubung ke server yang sama. Room bisa dibuat dan di-join. Belum ada gameplay.

#### Backend Tasks

- [ ] Setup Socket.IO server + attach ke Hono's `createServer`
- [ ] Buat `roomManager.ts`:
  - `createRoom(socket, playerName)` → generate room code 5 karakter, simpan ke `Map<string, Room>`
  - `joinRoom(socket, roomCode, playerName)` → validasi room ada & belum penuh
  - `getRoomBySocketId(socketId)` → helper untuk cleanup
  - `removePlayer(socketId)` → hapus dari room
- [ ] Buat `gameHandler.ts` — daftarkan semua socket event listeners
- [ ] Handle event `CREATE_ROOM` → emit `ROOM_CREATED` ke socket
- [ ] Handle event `JOIN_ROOM` → broadcast `PLAYER_JOINED` ke room
- [ ] Handle `disconnect` → broadcast `PLAYER_LEFT`, cleanup room
- [ ] Buat route `GET /api/room/:code`

#### Frontend Tasks

- [ ] Buat `hooks/useSocket.ts` — singleton Socket.IO client instance
- [ ] Buat `hooks/useGameSocket.ts` — register semua event listeners, update Zustand store
- [ ] Buat `LandingPage.tsx` dengan dua form:
  - Form **Buat Room**: input nama → emit `CREATE_ROOM` → redirect ke lobby
  - Form **Join Room**: input nama + kode → emit `JOIN_ROOM` → redirect ke lobby
- [ ] Buat `WaitingLobby.tsx`:
  - Tampilkan room code (bisa di-copy)
  - Tampilkan daftar pemain yang sudah join
  - Tombol "Mulai Game" hanya untuk host, hanya aktif jika 2 pemain sudah ada
  - Tampilkan status pemain (connected/waiting)

#### Data Structures

```ts
// shared/types.ts
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

interface Room {
  code: string;
  players: Map<string, Player>; // socketId → Player
  hostSocketId: string;
  status: "waiting" | "playing" | "finished";
  gameState?: GameState;
}
```

#### Test Selesai

- [ ] Buka 2 tab browser, buat room di tab 1 → muncul room code
- [ ] Join dari tab 2 dengan kode tersebut → kedua tab tampilkan 2 nama pemain
- [ ] Tutup tab 2 → tab 1 tampilkan notifikasi pemain meninggalkan room
- [ ] Tombol "Mulai Game" hanya muncul di tab host

---

### Fase 2 — Core Gameplay & Timer (4–5 jam)

**Tujuan**: Game bisa dimainkan end-to-end. Timer berjalan di server. Validasi kata masih menggunakan aturan lokal (huruf sambung + panjang). KBBI belum diintegrasikan.

#### Backend Tasks

- [ ] Buat `timerManager.ts`:
  - `startTurn(room, playerId, onTimeout)` → `setTimeout` 15 detik, `setInterval` broadcast `TIMER_SYNC` setiap 1 detik
  - `stopTurn(room)` → `clearTimeout` + `clearInterval`
- [ ] Buat `gameLogic.ts`:
  - `validateTurnRules(word, gameState)` → cek huruf sambung + panjang min 3 + belum dipakai
  - `getNextPlayer(room)` → return socket ID lawan
  - `calculateScores(room)` → return skor terbaru
- [ ] Handle event `START_GAME`:
  - Pilih kata awal random (hardcode beberapa kata untuk Fase 2, KBBI di Fase 3)
  - Tentukan giliran pertama secara random
  - Broadcast `TURN_START` ke semua di room
  - Start timer di server
- [ ] Handle event `SUBMIT_WORD`:
  - Jalankan `validateTurnRules()` (Fase 2: tanpa cek KBBI)
  - Jika valid: stop timer → update gameState → broadcast `WORD_VALID` → start timer untuk lawan
  - Jika invalid: emit `WORD_INVALID` ke pengirim saja
- [ ] Saat timer habis: broadcast `GAME_OVER`
- [ ] Handle `Main Lagi` → reset gameState, kembali ke status `waiting`

#### Frontend Tasks

- [ ] Buat `GamePage.tsx` sebagai wrapper utama
- [ ] Buat `BombTimer.tsx`:
  - Angka countdown besar (dari `timeLeft` di Zustand)
  - Ring/circle progress bar mengecil
  - Warna berubah: hijau `>8s` → kuning `4-8s` → merah + pulse `<4s`
  - **Client hanya display — sumber waktu dari `TIMER_SYNC` server**
- [ ] Buat `WordInput.tsx`:
  - Input text + tombol kirim
  - `disabled` jika bukan giliran pemain
  - Hint: "Harus diawali huruf **[X]**"
  - Loading state saat validasi
- [ ] Buat `WordHistory.tsx`:
  - List scrollable semua kata yang sudah dipakai
  - Kata terbaru di atas, huruf terakhirnya di-highlight sebagai badge
- [ ] Buat `PlayerCard.tsx`:
  - Nama pemain + skor
  - Indikator aktif (bom animasi) jika sedang giliran
- [ ] Buat `GameOverDialog.tsx`:
  - Nama pemenang + nama yang kalah
  - Tampilkan semua kata yang sudah dipakai
  - Tombol "Main Lagi"
- [ ] Update `useGameSocket.ts` — handle semua server events dan update store

#### Test Selesai

- [ ] Klik "Mulai Game" → kedua tab tampilkan board game dan timer berjalan
- [ ] Ketik kata dengan huruf awal benar → kata masuk ke history, timer pindah ke lawan
- [ ] Ketik kata dengan huruf awal salah → muncul pesan error, giliran tidak berpindah
- [ ] Biarkan timer habis → popup game over muncul di kedua tab
- [ ] Klik "Main Lagi" → kembali ke lobby, bisa mulai game baru

---

### Fase 3 — Validasi KBBI Hybrid (3–4 jam)

**Tujuan**: Integrasi validasi kata KBBI yang sesungguhnya. Kata harus ada di KBBI untuk diterima. Kata awal game dipilih dari dataset.

#### Persiapan Dataset

```bash
# Download dari GitHub
# https://github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI
# File: list_3.2.0.txt — satu kata per baris, ~112k entri

# Simpan ke:
cp list_3.2.0.txt backend/src/data/kbbi-words.txt

# Verifikasi
wc -l backend/src/data/kbbi-words.txt
# → sekitar 112000
```

#### Backend Tasks

- [ ] Buat `dictionary/words.ts` — load TXT ke `Set<string>` saat module di-import
- [ ] Implementasi `validateWord(word)` dengan 2-layer (lihat [Bagian 6](#6-strategi-kamus--validasi-kbbi))
- [ ] Implementasi `getRandomStartWord()` — filter 4-8 huruf, random pick
- [ ] Integrasi `validateWord()` ke handler `SUBMIT_WORD`:
  - Tambah state `isValidating: boolean` di room untuk mencegah double submit
  - Jika `source === "timeout"` → emit `WORD_INVALID` dengan reason khusus
- [ ] Update `START_GAME` handler → gunakan `getRandomStartWord()` dari dataset
- [ ] Update route `GET /api/health` → tambahkan `wordCount: wordSet.size`
- [ ] Buat route `GET /api/dictionary/check/:word` untuk testing

#### Frontend Tasks

- [ ] Tambah pesan error spesifik untuk `not_in_dictionary`:
  > "Kata '**xyz**' tidak ditemukan di KBBI"
- [ ] Tampilkan loading spinner di `WordInput` saat `isValidating` true
- [ ] Nonaktifkan input saat validasi berlangsung (cegah double submit)
- [ ] Tambah tooltip di hint letter: "Kata harus diawali huruf ini"

#### Edge Cases yang Harus Ditangani

| Skenario | Penanganan |
|---|---|
| API KBBI timeout (>2s) | Tolak kata, pesan: "Koneksi lambat, coba lagi" |
| Kata dengan tanda hubung (mis. `tahu-tahuan`) | `replace(/[^a-z]/g, "")` sebelum validasi |
| Input huruf kapital | `toLowerCase()` sebelum semua validasi |
| Spasi di tengah kata | Tolak sebelum validasi (`/\s/.test(word)`) |
| Double submit cepat | State `isValidating` di room blokir SUBMIT_WORD kedua |
| Kata satu huruf | Cek `word.length >= 3` sebelum ke KBBI |

#### Test Selesai

- [ ] `curl http://localhost:3001/api/dictionary/check/kucing` → `valid: true`
- [ ] `curl http://localhost:3001/api/dictionary/check/xyzabc` → `valid: false`
- [ ] `curl http://localhost:3001/api/health` → `wordCount > 100000`
- [ ] Ketik "kucing" di game → valid (ada di KBBI)
- [ ] Ketik "asdfgh" di game → invalid dengan pesan tidak ditemukan di KBBI
- [ ] Kata awal game selalu berbeda setiap game baru dimulai

---

### Fase 4 — Polish, Skor & SFX (3–4 jam)

**Tujuan**: Game terasa polished dan menyenangkan. Sistem skor real-time, efek suara, dan animasi halus.

#### Backend Tasks

- [ ] Tambahkan `scores: Record<string, number>` ke `GameState`
- [ ] Increment skor di `WORD_VALID` handler: `scores[playerId]++`
- [ ] Sertakan `scores` di payload `WORD_VALID` dan `GAME_OVER`

#### Frontend Tasks — Skor

- [ ] Update `PlayerCard.tsx` — tampilkan skor real-time
- [ ] Animasi skor naik: highlight sebentar saat bertambah (framer-motion opsional, atau CSS transition)
- [ ] Tampilkan skor akhir di `GameOverDialog.tsx`

#### Frontend Tasks — SFX dengan Howler.js

```ts
// lib/sfx.ts
import { Howl } from "howler";

// Gunakan Web Audio API via Howler untuk generate suara procedurally
// atau gunakan file audio pendek (.mp3/.webm)

export const sfx = {
  // Suara ping positif saat kata valid
  ping: new Howl({
    src: ["/sounds/ping.mp3"],
    volume: 0.5,
  }),
  // Suara bom meledak saat game over
  boom: new Howl({
    src: ["/sounds/boom.mp3"],
    volume: 0.7,
  }),
  // Detak jantung saat timer < 4 detik
  tick: new Howl({
    src: ["/sounds/tick.mp3"],
    volume: 0.4,
  }),
};

// Trigger dari useGameSocket.ts:
// WORD_VALID → sfx.ping.play()
// GAME_OVER → sfx.boom.play()
// TIMER_SYNC timeLeft < 4 → sfx.tick.play() setiap detik
```

> **Alternatif tanpa file audio**: Generate suara via Web Audio API langsung (lihat `sfx-webaudio.ts` di bawah). Tidak perlu file `.mp3`.

```ts
// lib/sfx-webaudio.ts — zero file dependencies
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playPing() {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

export function playTick() {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 440;
  osc.type = "square";
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playBoom() {
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.6;
  source.start();
}
```

#### Frontend Tasks — Animasi & UX

- [ ] `BombTimer.tsx` — highlight huruf yang harus dipakai (badge menonjol)
- [ ] `WordHistory.tsx` — badge huruf terakhir di setiap kata
- [ ] Animasi masuk kata baru di history (CSS `@keyframes slideIn`)
- [ ] Shake animation di input saat kata ditolak
- [ ] Glow/pulse pada `PlayerCard` pemain yang sedang giliran
- [ ] Favicon berubah saat giliran kita (tab notification opsional)

#### Test Selesai

- [ ] Skor bertambah di kedua browser setiap kata valid
- [ ] Suara ping terdengar saat kata diterima
- [ ] Detak terdengar saat 3 detik terakhir
- [ ] Suara boom saat game over
- [ ] Tidak ada error di console browser

---

### Fase 5 — Deploy (1–2 jam)

**Tujuan**: Game bisa dimainkan dari URL publik.

#### Backend — Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Di folder backend
railway init
railway up
```

```json
// backend/railway.json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

```ts
// backend/src/index.ts — baca PORT dari environment
const PORT = parseInt(process.env.PORT || "3001");
```

#### Frontend — Vercel

```bash
# Install Vercel CLI
npm install -g vercel
vercel login

# Di folder frontend
vercel
```

```ts
// frontend/.env.production
VITE_WS_URL=wss://your-app.railway.app

// frontend/src/hooks/useSocket.ts
const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";
```

#### Test Selesai

- [ ] `curl https://your-app.railway.app/api/health` → `{ status: "ok" }`
- [ ] Buka Vercel URL di 2 device berbeda → game bisa dimainkan
- [ ] Socket.IO connection menggunakan `wss://` (bukan `ws://`)

---

## 9. Prompt Siap Pakai per Fase

---

### 🟢 Prompt Fase 0 — Project Setup

```
Buatkan konfigurasi project lengkap untuk game real-time "Sambung Kata" 
dengan struktur monorepo berikut:

BACKEND (folder: backend/):
- Hono + @hono/node-server + Socket.IO + TypeScript
- nodemon.json untuk watch src/**/*.ts dengan ts-node
- tsconfig.json dengan strict: true, target: ES2020
- index.ts: Hono app di port 3001, Socket.IO attached, route GET /api/health

FRONTEND (folder: frontend/):
- React + Vite + TypeScript
- Tailwind CSS sudah terkonfigurasi
- shadcn/ui sudah di-init dengan style "default"
- TanStack Query QueryClient di lib/queryClient.ts
- Zustand store kosong di stores/gameStore.ts dan stores/roomStore.ts
- hooks/useSocket.ts: singleton Socket.IO client yang connect ke VITE_WS_URL

SHARED (folder: shared/):
- types.ts berisi semua interface: Player, Room, GameState
- Union types untuk ClientEvent dan ServerEvent
- Enum: WordInvalidReason, GameOverReason

Gunakan TypeScript strict di semua file. Berikan package.json lengkap 
untuk masing-masing folder beserta script dev, build, dan start.
```

---

### 🟢 Prompt Fase 1 — Room & Koneksi

```
Implementasikan sistem manajemen room WebSocket untuk game Sambung Kata.
Stack: Hono + Socket.IO + TypeScript (backend), React + Zustand + Socket.IO-client (frontend).

BACKEND — buat file berikut:

1. backend/src/game/roomManager.ts
   - Map<string, Room> sebagai in-memory store
   - createRoom(socket, playerName): generate room code 5 karakter (A-Z2-9, 
     hindari 0/O/1/I), simpan room, return roomCode
   - joinRoom(socket, roomCode, playerName): validasi room exists & 
     players.size < 2, tambahkan player, return Room | Error
   - removePlayer(socketId): hapus dari room, return room (untuk broadcast)
   - getRoomBySocketId(socketId): lookup helper
   - broadcastToRoom(roomCode, event, data): kirim ke semua socket di room

2. backend/src/socket/gameHandler.ts
   - Handler CREATE_ROOM: emit ROOM_CREATED({ roomCode, playerId }) ke socket
   - Handler JOIN_ROOM: broadcast PLAYER_JOINED({ players }) ke room
   - Handler disconnect: panggil removePlayer, broadcast PLAYER_LEFT

3. backend/src/routes/room.ts (Hono route)
   - GET /api/room/:code → { exists, playerCount, status }

FRONTEND — buat file berikut:

1. frontend/src/hooks/useSocket.ts
   - Singleton Socket.IO client
   - Connect ke VITE_WS_URL
   - Export socket instance

2. frontend/src/hooks/useGameSocket.ts
   - useEffect yang register listeners: ROOM_CREATED, PLAYER_JOINED, PLAYER_LEFT
   - Update Zustand store sesuai event

3. frontend/src/components/room/CreateRoomForm.tsx
   - Input nama + tombol "Buat Room"
   - Emit CREATE_ROOM, navigate ke /lobby/{roomCode}

4. frontend/src/components/room/JoinRoomForm.tsx
   - Input nama + input kode room + tombol "Gabung"
   - Emit JOIN_ROOM, navigate ke /lobby/{roomCode}

5. frontend/src/components/room/WaitingLobby.tsx
   - Tampilkan room code dengan tombol copy
   - List pemain (pakai PlayerCard sederhana)
   - Tombol "Mulai Game" hanya untuk host, disabled jika < 2 pemain
   - Emit START_GAME saat diklik

Gunakan tipe dari shared/types.ts. Semua state disimpan di Zustand gameStore.
```

---

### 🔵 Prompt Fase 2 — Turn System & Timer

```
Tambahkan sistem turn-based dengan bomb timer ke game Sambung Kata yang sudah ada.
CRITICAL: semua timer harus dikelola di SERVER. Client hanya menampilkan nilai 
dari TIMER_SYNC event.

BACKEND:

1. backend/src/game/timerManager.ts
   - Interface TurnTimer { timeout: NodeJS.Timeout; interval: NodeJS.Timeout; timeLeft: number }
   - startTurn(room, playerId, onTimeout): 
     * clearTurn() dulu jika ada
     * timeLeft = 15
     * interval: setiap 1000ms timeLeft--, broadcast TIMER_SYNC({ timeLeft }) ke room
     * timeout: setTimeout 15s, panggil onTimeout()
   - stopTurn(room): clearTimeout + clearInterval

2. backend/src/game/gameLogic.ts
   - validateTurnRules(word, gameState): return { valid: false, reason } | { valid: true }
     * Cek: not_your_turn, too_short (<3), wrong_start_letter, duplicate_word
   - getNextPlayerId(room, currentPlayerId): return socketId lawan
   - initGameState(players, startWord): return GameState awal

3. Update gameHandler.ts:
   Handler START_GAME:
   - Validasi hanya host yang bisa mulai, harus ada 2 pemain
   - startWord = kata hardcode random (Fase 2, belum KBBI)
   - firstPlayer = random dari players
   - Broadcast TURN_START({ currentPlayerId, timeLeft: 15, requiredLetter })
   - Panggil startTurn()
   
   Handler SUBMIT_WORD:
   - Cek isValidating (blokir double submit)
   - Jalankan validateTurnRules()
   - Jika invalid: emit WORD_INVALID({ reason, word }) ke pengirim saja
   - Jika valid: stopTurn() → update gameState → broadcast WORD_VALID({ word, 
     playerId, scores, nextLetter }) → startTurn untuk lawan

   onTimeout callback:
   - stopTurn()
   - Broadcast GAME_OVER({ winnerId, loserId, reason: "timeout", scores, wordHistory })

FRONTEND:

1. frontend/src/components/game/BombTimer.tsx
   - Tampilkan timeLeft dari Zustand (update dari TIMER_SYNC)
   - SVG circle progress bar, stroke-dashoffset berkurang
   - Warna: className conditional — green >8, yellow 4-8, red+animate-pulse <4
   - Animasi pulse saat merah

2. frontend/src/components/game/WordInput.tsx
   - Input + tombol kirim
   - disabled jika !isMyTurn || isValidating
   - Hint: "Awali dengan huruf [requiredLetter]"
   - Emit SUBMIT_WORD({ word }) saat submit
   - Clear input setelah submit

3. frontend/src/components/game/WordHistory.tsx
   - Map wordHistory dari store → list item
   - Badge huruf terakhir setiap kata
   - auto-scroll ke atas saat kata baru masuk

4. frontend/src/components/game/PlayerCard.tsx
   - Nama + skor
   - Border/glow saat isCurrentPlayer

5. frontend/src/components/game/GameOverDialog.tsx
   - shadcn Dialog, open saat gameStatus === "finished"
   - Tampilkan winner/loser + wordHistory
   - Tombol "Main Lagi" → emit PLAY_AGAIN atau navigate ke lobby

6. Update useGameSocket.ts — handle TURN_START, WORD_VALID, WORD_INVALID, 
   TIMER_SYNC, GAME_OVER → update Zustand store

Semua tipe dari shared/types.ts. Store: stores/gameStore.ts.
```

---

### 🟣 Prompt Fase 3 — Validasi KBBI

```
Integrasikan validasi kata KBBI ke backend Sambung Kata yang sudah ada.
File dataset offline sudah ada di backend/src/data/kbbi-words.txt 
(~112k kata, satu per baris, dari github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI).

BACKEND:

1. backend/src/dictionary/words.ts
   - Load kbbi-words.txt ke Set<string> satu kali saat module di-import (bukan per request)
   - Normalisasi semua: trim() + toLowerCase()
   - Export wordSet, validateWord, getRandomStartWord

2. validateWord(word: string): Promise<ValidationResult>
   - Normalisasi input: trim() + toLowerCase() + replace(/[^a-z]/g, "")
   - Layer 1: wordSet.has(w) → return { valid: true, source: "offline" }
   - Layer 2: fetch https://kbbi.raf555.dev/api/{w} dengan AbortController timeout 2000ms
   - Jika API ok: wordSet.add(w) + return { valid: true, source: "api" }
   - Jika API error/timeout: return { valid: false, source: "timeout" | "not_found" }

3. getRandomStartWord(): string
   - Filter wordSet: length 4-8, /^[a-z]+$/.test(w) (no hyphens/special chars)
   - Return random element dari filtered array

4. Update SUBMIT_WORD handler di gameHandler.ts:
   - Set room.isValidating = true sebelum await validateWord()
   - Setelah selesai: room.isValidating = false
   - Jika source === "timeout": emit WORD_INVALID({ reason: "not_in_dictionary" })
   - Ganti kata awal hardcode di START_GAME dengan getRandomStartWord()

5. Update backend/src/routes/dictionary.ts:
   - GET /api/dictionary/check/:word → panggil validateWord(), return hasil lengkap
   
6. Update GET /api/health → tambahkan wordCount: wordSet.size

FRONTEND — update pesan error:
- reason "not_in_dictionary" → "Kata '[word]' tidak ditemukan di KBBI"
- Tambah loading spinner di WordInput saat isValidating === true (dari store)
- Disable input saat isValidating

Gunakan tipe ValidationResult yang sudah ada di shared/types.ts.
Jangan lupa tambahkan isValidating: boolean ke Room interface.
```

---

### 🟠 Prompt Fase 4 — Polish, Skor & SFX

```
Tambahkan sistem skor real-time dan efek suara ke Sambung Kata yang sudah ada.
Untuk SFX: gunakan Howler.js jika tersedia file audio, atau Web Audio API procedural 
jika tidak ada file audio.

BACKEND:
- Tambah scores: Record<string, number> ke GameState, init semua ke 0
- Di handler WORD_VALID: scores[playerId]++
- Sertakan scores terbaru di payload WORD_VALID dan GAME_OVER

FRONTEND:

1. frontend/src/lib/sfx.ts — audio manager dengan Howler.js
   Implementasikan 3 fungsi:
   - playPing(): suara positif saat WORD_VALID (880Hz sine, 0.3s fade) 
   - playTick(): detak pendek saat timeLeft < 4 (440Hz square, 0.08s)
   - playBoom(): ledakan saat GAME_OVER (noise burst 0.5s)
   
   Jika tidak ada file audio, generate procedurally via Web Audio API.
   Tambahkan muteAll() dan unmuteAll() untuk tombol mute.

2. Update useGameSocket.ts — trigger SFX:
   - WORD_VALID → sfx.playPing()
   - GAME_OVER → sfx.playBoom()
   - TIMER_SYNC timeLeft < 4 && isMyTurn → sfx.playTick()

3. Update PlayerCard.tsx:
   - Tampilkan scores[playerId] di badge
   - CSS transition pada skor saat berubah (scale 1.2 → 1)

4. Update GameOverDialog.tsx:
   - Tampilkan skor akhir kedua pemain
   - Highlight pemenang

5. Tambah tombol mute/unmute di GameBoard.tsx (ikon speaker shadcn)

6. Update BombTimer.tsx:
   - Tambah hint "[HURUF] →" yang lebih menonjol
   
7. WordHistory.tsx — animasi kata baru masuk:
   - CSS @keyframes slideInFromTop, applied via Tailwind animate-*
   
8. WordInput.tsx — shake animation saat WORD_INVALID:
   - CSS @keyframes shake (translate X bolak-balik 3x)
   - Apply via className conditional setelah error

Pastikan sfx.ts handle kasus AudioContext suspended (mobile browser 
butuh user interaction sebelum bisa play audio — resume di event pertama).
```

---

## 10. Checklist Final

### Fitur Inti (Wajib — 20 Fitur)

#### Manajemen Room
- [ ] **F01** Buat room dengan kode unik 5 karakter
- [ ] **F02** Gabung room dengan kode
- [ ] **F03** UI menampilkan nama + status kedua pemain
- [ ] **F04** Tombol mulai hanya untuk host, aktif jika 2 pemain

#### Gameplay
- [ ] **F05** Kata awal random dari dataset KBBI
- [ ] **F06** Giliran bergantian otomatis
- [ ] **F07** Input kata + tombol kirim
- [ ] **F08** Validasi huruf sambung
- [ ] **F09** Validasi kata unik (tidak boleh dipakai dua kali)
- [ ] **F10** Validasi minimal 3 huruf
- [ ] **F11** Riwayat kata scrollable

#### Timer & Bom
- [ ] **F12** Timer 15 detik per giliran (server-side)
- [ ] **F13** Visual countdown 15 → 0
- [ ] **F14** Timer berpindah setelah jawab benar
- [ ] **F15** Hanya satu timer aktif pada satu waktu
- [ ] **F16** Game over jika timer habis

#### Validasi Kata
- [ ] **F17** Validasi KBBI (offline dataset + API fallback)
- [ ] **F18** Pesan error spesifik per jenis kesalahan

#### Akhir Game
- [ ] **F19** Popup winner + skor akhir
- [ ] **F20** Tombol Main Lagi (tanpa buat room baru)

### Fitur Tambahan (Nilai Plus)
- [ ] **F21** Sistem skor real-time
- [ ] **F22** SFX: detak, bom, kata valid

---

### Timeline Estimasi

| Fase | Deliverable | Estimasi |
|---|---|---|
| Fase 0 | Project setup & konfigurasi | 30 menit |
| Fase 1 | Room + WS connection berjalan | 3–4 jam |
| Fase 2 | Game playable (tanpa KBBI) | 4–5 jam |
| Fase 3 | Validasi KBBI aktif | 3–4 jam |
| Fase 4 | Skor + suara + animasi | 3–4 jam |
| Fase 5 | Deploy ke Railway + Vercel | 1–2 jam |
| **Total** | **Project siap presentasi** | **~15–19 jam** |

---

### Referensi

| Resource | Link |
|---|---|
| Dataset KBBI offline (TXT) | [damzaky/kumpulan-kata-bahasa-indonesia-KBBI](https://github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI) |
| Dataset KBBI (JSON/SQL) | [dyazincahya/KBBI-SQL-database](https://github.com/dyazincahya/KBBI-SQL-database) |
| KBBI REST API (primary fallback) | [kbbi.raf555.dev/swagger](https://kbbi.raf555.dev/swagger/index.html) |
| KBBI REST API (alternatif) | [services.x-labs.my.id/kbbi](https://services.x-labs.my.id/kbbi/search?word=test) |
| Socket.IO docs | [socket.io/docs](https://socket.io/docs/v4/) |
| Hono docs | [hono.dev](https://hono.dev) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |
| TanStack Query | [tanstack.com/query](https://tanstack.com/query/latest) |
| Zustand | [zustand-demo.pmnd.rs](https://zustand-demo.pmnd.rs) |
| Railway deploy | [railway.app](https://railway.app) |
