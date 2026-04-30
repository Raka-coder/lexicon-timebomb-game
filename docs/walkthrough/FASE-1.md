# Fase 1: Room & Koneksi WebSocket - Walkthrough

## Status: ✅ COMPLETE

## Files Created

### Backend
| File | Deskripsi |
|------|-----------|
| `backend/index.ts` | Entry point: Hono + Socket.IO server |
| `backend/src/game/roomManager.ts` | Room CRUD operations |
| `backend/src/socket/gameHandler.ts` | Socket event handlers |
| `backend/src/routes/room.ts` | REST API `/api/room/:code` |

### Frontend
| File | Deskripsi |
|------|-----------|
| `frontend/src/hooks/useSocket.ts` | Socket.IO client singleton |
| `frontend/src/hooks/useGameSocket.ts` | Game event listeners |
| `frontend/src/stores/gameStore.ts` | Zustand store |
| `frontend/src/components/room/CreateRoomForm.tsx` | Form buat room |
| `frontend/src/components/room/JoinRoomForm.tsx` | Form gabung room |
| `frontend/src/components/room/WaitingLobby.tsx` | Lobby sambil menunggu |
| `frontend/src/pages/LandingPage.tsx` | Halaman utama |

## Socket Events

### Client → Server
| Event | Payload |
|-------|---------|
| `CREATE_ROOM` | `{ playerName: string }` |
| `JOIN_ROOM` | `{ roomCode: string; playerName: string }` |

### Server → Client
| Event | Payload |
|-------|---------|
| `ROOM_CREATED` | `{ roomCode: string; playerId: string; isHost: boolean }` |
| `ROOM_JOINED` | `{ roomCode: string; playerId: string; isHost: boolean }` |
| `PLAYER_JOINED` | `{ players: Player[] }` |
| `PLAYER_LEFT` | `{ players: Player[]; message?: string }` |
| `ROOM_ERROR` | `{ message: string }` |

## Pengujian

### 1. Start Backend
```bash
cd backend
bun run index.ts
# Output: Server running on http://localhost:3001
```

### 2. Start Frontend
```bash
cd frontend
bun run dev
# Output: Available at http://localhost:517x
```

### 3. Test Room Creation
1. Buka http://localhost:517x di browser
2. Masukkan nama (misal: "Raka")
3. Klik "Buat Room"
4. Akan di-redirect ke lobby dan melihat kode room (misal: "XK2P9")

### 4. Test Room Joining
1. Buka tab baru browser
2. Masukkan nama berbeda (misal: "Tony")
3. Masukkan kode room dari tab pertama
4. Klik "Gabung"
5. Kedua tab akan melihat 2 pemain di lobby

### 5. Test Disconnect
1. Tutup salah satu tab
2. Tab lain akan melihat notifikasi "Pemain lain meninggalkan room"

### 6. Test Start Game
1. Di tab host, klik "Mulai Game"
2. Akan masuk ke halaman game (/game)

## API Endpoints

### GET /api/health
```bash
curl http://localhost:3001/api/health
# Response: { "status": "ok", "timestamp": "..." }
```

### GET /api/room/:code
```bash
curl http://localhost:3001/api/room/ABC12
# Response: { "exists": true/false, "playerCount": 0-2, "status": "waiting/playing/finished/not_found" }
```

## Error Handling
- Room tidak ditemukan → "Room tidak ditemukan atau penuh"
- Room penuh (>2 pemain) → "Room tidak ditemukan atau penuh"
- Bukan host tapi klik Mulai → tombol tidak aktif (disabled)

## Notes
- Room code: 5 karakter (A-Z, 2-9, avoid 0/O/1/I)
- Status room: "waiting" → "playing" → "finished"
- In-memory storage (reset saat server restart)