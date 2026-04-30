
Saya akan bantu pisahkan **PRD per Fase Pengembangan** dari dokumen tersebut ke dalam bagian yang lebih terstruktur dan mudah diikuti.

---

## 📋 PRD PER FASE PENGEMBANGAN (Dipisahkan)

---

## Fase 0 — Project Setup (30 menit)

### Tujuan
Semua dependencies terinstall, TypeScript bisa compile, dev server berjalan.

### Checklist Backend

- [ ] `npm init` + install semua dependencies backend
- [ ] Buat `tsconfig.json` dengan `strict: true`
- [ ] Buat `nodemon.json` untuk watch `src/**/*.ts`
- [ ] Buat `index.ts` — Hono app + `@hono/node-server` jalan di port 3001
- [ ] Tambah route dummy `GET /api/health` → `{ status: "ok" }`
- [ ] Buat `shared/types.ts` dengan semua interface dan enum

### Checklist Frontend

- [ ] `npm create vite` + install semua dependencies frontend
- [ ] Setup Tailwind CSS + `tailwind.config.ts`
- [ ] Jalankan `npx shadcn@latest init` + install komponen: `button`, `input`, `card`, `badge`, `dialog`
- [ ] Setup TanStack Query `QueryClient` di `lib/queryClient.ts`
- [ ] Buat Zustand store kosong di `stores/gameStore.ts`
- [ ] Verifikasi hot reload berjalan

### Test Selesai

```bash
# Backend
curl http://localhost:3001/api/health
# → { "status": "ok" }

# Frontend
# → Browser menampilkan Vite default page di localhost:5173
```

### Prompt Siap Pakai

> Buatkan konfigurasi project lengkap untuk game real-time "Sambung Kata" dengan struktur monorepo: BACKEND (Hono + @hono/node-server + Socket.IO + TypeScript) dengan nodemon.json, tsconfig.json strict, index.ts dengan route GET /api/health. FRONTEND (React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Zustand) dengan hooks/useSocket.ts singleton. SHARED (types.ts) berisi interface Player, Room, GameState, union types ClientEvent/ServerEvent, enum WordInvalidReason dan GameOverReason.

---

## Fase 1 — Room & Koneksi WebSocket (3-4 jam)

### Tujuan
Dua browser bisa terhubung ke server yang sama. Room bisa dibuat dan di-join. Belum ada gameplay.

### Backend Tasks

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

### Frontend Tasks

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

### Data Structures

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
  players: Map<string, Player>;
  hostSocketId: string;
  status: "waiting" | "playing" | "finished";
  gameState?: GameState;
}
```

### Test Selesai

- [ ] Buka 2 tab browser, buat room di tab 1 → muncul room code
- [ ] Join dari tab 2 dengan kode tersebut → kedua tab tampilkan 2 nama pemain
- [ ] Tutup tab 2 → tab 1 tampilkan notifikasi pemain meninggalkan room
- [ ] Tombol "Mulai Game" hanya muncul di tab host

### Prompt Siap Pakai

> Implementasikan sistem manajemen room WebSocket untuk game Sambung Kata. BACKEND: roomManager.ts dengan Map in-memory store, fungsi createRoom/joinRoom/removePlayer/broadcastToRoom. gameHandler.ts dengan handler CREATE_ROOM, JOIN_ROOM, disconnect. route GET /api/room/:code. FRONTEND: useSocket.ts singleton, useGameSocket.ts listener, CreateRoomForm.tsx, JoinRoomForm.tsx, WaitingLobby.tsx dengan tombol copy room code. Semua state di Zustand.

---

## Fase 2 — Core Gameplay & Timer (4-5 jam)

### Tujuan
Game bisa dimainkan end-to-end. Timer berjalan di server. Validasi kata masih menggunakan aturan lokal (huruf sambung + panjang). KBBI belum diintegrasikan.

### Backend Tasks

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

### Frontend Tasks

- [ ] Buat `GamePage.tsx` sebagai wrapper utama
- [ ] Buat `BombTimer.tsx`:
  - Angka countdown besar (dari `timeLeft` di Zustand)
  - Ring/circle progress bar mengecil
  - Warna berubah: hijau >8s → kuning 4-8s → merah + pulse <4s
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

### Test Selesai

- [ ] Klik "Mulai Game" → kedua tab tampilkan board game dan timer berjalan
- [ ] Ketik kata dengan huruf awal benar → kata masuk ke history, timer pindah ke lawan
- [ ] Ketik kata dengan huruf awal salah → muncul pesan error, giliran tidak berpindah
- [ ] Biarkan timer habis → popup game over muncul di kedua tab
- [ ] Klik "Main Lagi" → kembali ke lobby, bisa mulai game baru

### Prompt Siap Pakai

> Tambahkan sistem turn-based dengan bomb timer ke game Sambung Kata. CRITICAL: semua timer dikelola di SERVER. BACKEND: timerManager.ts dengan startTurn/stopTurn. gameLogic.ts dengan validateTurnRules (wrong_start_letter, duplicate_word, too_short, not_your_turn). Handler START_GAME dan SUBMIT_WORD lengkap dengan timer. FRONTEND: BombTimer.tsx (circle progress + warna dinamis + pulse), WordInput.tsx (disabled jika bukan giliran + hint huruf), WordHistory.tsx (scrollable + badge huruf terakhir), PlayerCard.tsx (glow saat giliran), GameOverDialog.tsx (popup hasil + tombol main lagi). Client hanya display TIMER_SYNC dari server.

---

## Fase 3 — Validasi KBBI Hybrid (3-4 jam)

### Tujuan
Integrasi validasi kata KBBI yang sesungguhnya. Kata harus ada di KBBI untuk diterima. Kata awal game dipilih dari dataset.

### Persiapan Dataset

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

### Backend Tasks

- [ ] Buat `dictionary/words.ts` — load TXT ke `Set<string>` saat module di-import
- [ ] Implementasi `validateWord(word)` dengan 2-layer (lihat strategi di dokumen)
- [ ] Implementasi `getRandomStartWord()` — filter 4-8 huruf, random pick
- [ ] Integrasi `validateWord()` ke handler `SUBMIT_WORD`:
  - Tambah state `isValidating: boolean` di room untuk mencegah double submit
  - Jika `source === "timeout"` → emit `WORD_INVALID` dengan reason khusus
- [ ] Update `START_GAME` handler → gunakan `getRandomStartWord()` dari dataset
- [ ] Update route `GET /api/health` → tambahkan `wordCount: wordSet.size`
- [ ] Buat route `GET /api/dictionary/check/:word` untuk testing

### Frontend Tasks

- [ ] Tambah pesan error spesifik untuk `not_in_dictionary`:
  > "Kata '**xyz**' tidak ditemukan di KBBI"
- [ ] Tampilkan loading spinner di `WordInput` saat `isValidating` true
- [ ] Nonaktifkan input saat validasi berlangsung (cegah double submit)
- [ ] Tambah tooltip di hint letter: "Kata harus diawali huruf ini"

### Edge Cases yang Harus Ditangani

| Skenario | Penanganan |
|---|---|
| API KBBI timeout (>2s) | Tolak kata, pesan: "Koneksi lambat, coba lagi" |
| Kata dengan tanda hubung (misal `tahu-tahuan`) | `replace(/[^a-z]/g, "")` sebelum validasi |
| Input huruf kapital | `toLowerCase()` sebelum semua validasi |
| Spasi di tengah kata | Tolak sebelum validasi (`/\s/.test(word)`) |
| Double submit cepat | State `isValidating` di room blokir SUBMIT_WORD kedua |
| Kata satu huruf | Cek `word.length >= 3` sebelum ke KBBI |

### Test Selesai

- [ ] `curl http://localhost:3001/api/dictionary/check/kucing` → `valid: true`
- [ ] `curl http://localhost:3001/api/dictionary/check/xyzabc` → `valid: false`
- [ ] `curl http://localhost:3001/api/health` → `wordCount > 100000`
- [ ] Ketik "kucing" di game → valid (ada di KBBI)
- [ ] Ketik "asdfgh" di game → invalid dengan pesan tidak ditemukan di KBBI
- [ ] Kata awal game selalu berbeda setiap game baru dimulai

### Prompt Siap Pakai

> Integrasikan validasi kata KBBI ke backend. BACKEND: dictionary/words.ts load kbbi-words.txt ke Set<string>. validateWord() dengan 2 layer: offline Set.has() + fetch fallback ke https://kbbi.raf555.dev/api/{word} timeout 2000ms. getRandomStartWord() filter length 4-8. Update SUBMIT_WORD handler dengan isValidating state. Update START_GAME pakai getRandomStartWord(). Route GET /api/dictionary/check/:word. FRONTEND: pesan error not_in_dictionary spesifik + loading spinner di WordInput.

---

## Fase 4 — Polish, Skor & SFX (3-4 jam)

### Tujuan
Game terasa polished dan menyenangkan. Sistem skor real-time, efek suara, dan animasi halus.

### Backend Tasks

- [ ] Tambahkan `scores: Record<string, number>` ke `GameState`
- [ ] Increment skor di `WORD_VALID` handler: `scores[playerId]++`
- [ ] Sertakan `scores` di payload `WORD_VALID` dan `GAME_OVER`

### Frontend Tasks — Skor

- [ ] Update `PlayerCard.tsx` — tampilkan skor real-time
- [ ] Animasi skor naik: highlight sebentar saat bertambah
- [ ] Tampilkan skor akhir di `GameOverDialog.tsx`

### Frontend Tasks — SFX dengan Web Audio API (Zero File Dependencies)

```ts
// lib/sfx.ts — procedural audio
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

### Frontend Tasks — Trigger SFX

- [ ] Update `useGameSocket.ts`:
  - `WORD_VALID` → `sfx.playPing()`
  - `GAME_OVER` → `sfx.playBoom()`
  - `TIMER_SYNC` dengan `timeLeft < 4 && isMyTurn` → `sfx.playTick()`
- [ ] Tambah tombol mute/unmute di `GameBoard.tsx`

### Frontend Tasks — Animasi & UX

- [ ] `BombTimer.tsx` — highlight huruf yang harus dipakai (badge menonjol)
- [ ] `WordHistory.tsx` — badge huruf terakhir di setiap kata
- [ ] Animasi masuk kata baru di history (CSS `@keyframes slideIn`)
- [ ] Shake animation di input saat kata ditolak
- [ ] Glow/pulse pada `PlayerCard` pemain yang sedang giliran

### Test Selesai

- [ ] Skor bertambah di kedua browser setiap kata valid
- [ ] Suara ping terdengar saat kata diterima
- [ ] Detak terdengar saat 3 detik terakhir
- [ ] Suara boom saat game over
- [ ] Tidak ada error di console browser

### Prompt Siap Pakai

> Tambahkan sistem skor real-time dan efek suara. BACKEND: tambah scores ke GameState, increment di WORD_VALID, sertakan di payload. FRONTEND: PlayerCard tampilkan skor + animasi. SFX procedural via Web Audio API (playPing, playTick, playBoom) tanpa file eksternal. Trigger di useGameSocket sesuai event. Animasi: slideIn untuk history, shake untuk input error, glow untuk giliran aktif. Tombol mute/unmute.

---

## Fase 5 — Deploy (1-2 jam)

### Tujuan
Game bisa dimainkan dari URL publik.

### Backend — Railway.app

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

### Frontend — Vercel

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

### Test Selesai

- [ ] `curl https://your-app.railway.app/api/health` → `{ status: "ok" }`
- [ ] Buka Vercel URL di 2 device berbeda → game bisa dimainkan
- [ ] Socket.IO connection menggunakan `wss://` (bukan `ws://`)

### Prompt Siap Pakai

> Deploy backend ke Railway.app dan frontend ke Vercel. Backend: tambahkan railway.json, baca PORT dari environment, startCommand "npm run start", healthcheckPath "/api/health". Frontend: buat .env.production dengan VITE_WS_URL=wss://railway-app-url, update useSocket.ts baca dari import.meta.env. Verifikasi koneksi WebSocket menggunakan wss://.

---

## 📊 Ringkasan Timeline

| Fase | Deliverable | Estimasi |
|---|---|---|
| Fase 0 | Project setup & konfigurasi | 30 menit |
| Fase 1 | Room + WS connection berjalan | 3-4 jam |
| Fase 2 | Game playable (tanpa KBBI) | 4-5 jam |
| Fase 3 | Validasi KBBI aktif | 3-4 jam |
| Fase 4 | Skor + suara + animasi | 3-4 jam |
| Fase 5 | Deploy ke Railway + Vercel | 1-2 jam |
| **Total** | **Project siap presentasi** | **~15-19 jam** |



