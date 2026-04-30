# Fase 2: Core Gameplay & Timer - Walkthrough

## Status: ✅ COMPLETE

## Files Created

### Backend
| File | Deskripsi |
|------|-----------|
| `backend/src/game/timerManager.ts` | Class: 15 detik countdown per giliran |
| `backend/src/game/gameLogic.ts` | Validasi kata + next player |
| `backend/index.ts` | Updated: START_GAME, SUBMIT_WORD handlers |

### Frontend (Game Components)
| File | Deskripsi |
|------|-----------|
| `frontend/src/components/game/BombTimer.tsx` | Visual countdown circle |
| `frontend/src/components/game/WordInput.tsx` | Input kata + disabled non-turn |
| `frontend/src/components/game/WordHistory.tsx` | Riwayat kata |
| `frontend/src/components/game/PlayerCard.tsx` | Player info + skor |
| `frontend/src/pages/GamePage.tsx` | Halaman game utama |
| `frontend/src/App.tsx` | Added route `/game` |

## Socket Events - Game

### Client → Server
| Event | Payload |
|-------|---------|
| `START_GAME` | `{}` (hanya host) |
| `SUBMIT_WORD` | `{ word: string }` |

### Server → Client
| Event | Payload |
|-------|---------|
| `GAME_STARTED` | `{ players, currentWord, requiredLetter, currentPlayerId, scores }` |
| `TURN_START` | `{ currentPlayerId, currentWord, requiredLetter, scores }` |
| `WORD_VALID` | `{ word, playerId, playerName, scores, nextLetter }` |
| `WORD_INVALID` | `{ word, reason }` |
| `TIMER_SYNC` | `{ timeLeft }` |
| `GAME_OVER` | `{ winnerId, loserId, reason, scores, wordHistory }` |

## Kata Hardcoded
```ts
["rumah", "kucing", "pantai", "musik", "buku", "anjing", "uang", "makan", "jalan", "belajar"]
```

## Validasi Kata (Phase 2 - Tanpa KBBI)
1. ✅ **Panjang min 3 huruf** → `reason: "too_short"`
2. ✅ **Huruf pertama = huruf terakhir kata sebelumnya** → `reason: "wrong_start_letter"`
3. ✅ **Belum dipakai di game ini** → `reason: "duplicate_word"`
4. ✅ **Sudah giliran player** → `reason: "not_your_turn"`

## Timer Logic
- Durasi: 15 detik per giliran
- Broadcast `TIMER_SYNC` setiap 1 detik
- Saat timeout: emit `GAME_OVER` dengan `reason: "timeout"`
- Timer reset saat kata valid + giliran pindah

## Pengujian

### 1. Start Servers
```bash
# Terminal 1: Backend
cd backend && bun run index.ts

# Terminal 2: Frontend
cd frontend && bun run dev
```

### 2. Test Game Flow
1. **Buat Room** - Tab 1 buat room, dapat kode (misal: "XK2P9")
2. **Join Room** - Tab 2 join dengan kode tersebut
3. **Start Game** - Tab host klik "Mulai Game"
4. **Redirect** - Kedua tab auto-redirect ke `/game`

### 3. Test Turn System
- Input disabled untuk player yang tidak mendapat giliran
- Border glow + "Giliranmu!" indicator untuk player aktif
- Saat giliran bergantian, input enable untuk player baru

### 4. Test Valid Kata
- Kirim kata yang benar (huruf pertama = huruf terakhir kata sebelumnya)
- Kata masuk ke history
- Giliran pindah ke opponent
- Timer reset ke 15 detik

### 5. Test Invalid Kata
| Input | Error Message |
|-------|---------------|
| Kata pendek (<3) | "Kata minimal 3 huruf" |
| Huruf pertama salah | "Kata harus dimulai dengan huruf X" |
| Kata sudah dipakai | "Kata sudah digunakan" |
| Kirim di luar giliran | "Belum giliranmu!" |

### 6. Test Timer
- Countdown terlihat di BombTimer
- Warna berubah: hijau >8s → kuning 4-8s → merah <4s
- Saat timeout, popup GAME_OVER muncul

### 7. Test Disconnect Saat Main
- Jika player disconnect saat game berlangsung
- GAME_OVER emit ke remaining player
- reason: "disconnect"

## UI Components

### BombTimer
- Circle progress SVG
- Angka countdown besar di tengah
- Pulse animation saat <4 detik + giliranmu

### WordInput
- Input + tombol Kirim
- Disabled jika bukan giliran
- Hint: "Awali dengan huruf X"
- Shake animation saat error

### WordHistory
- List scrollable kata
- Badge huruf terakhir
- Latest word di-top dengan highlight

### PlayerCard
- Nama + skor
- Glow border jika aktif
- Label "Giliran", "Host", "Kamu"

## Route Protection
- Jika akses `/game` tanpa room → redirect ke `/`
- Setelah GAME_OVER → auto redirect ke `/` setelah 5 detik

## CSS Animations
```css
.animate-shake   /* Input error */
.custom-scrollbar /* WordHistory */
.glow-purple     /* Active player */
```

## Notes
- Timer selalu di-server (client hanya display)
- Skor increment +1 per kata valid
- Game state in-memory (reset saat server restart)
- Disconnect handling: opponent automatically wins