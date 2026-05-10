# Sambung Kata - Game Kata Rantai Real-Time

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Hono-FF5C01?style=for-the-badge&logo=hono&logoColor=white" alt="Hono">
</p>

<!-- README-I18N:START -->

**Bahasa Indonesia** | [English](./README.en.md)

<!-- README-I18N:END -->

Sambung Kata adalah game kata rantai multiplayer real-time di mana dua pemain bersaing menyubmit kata yang dimulai dengan huruf terakhir kata sebelumnya. Game ini menggunakan validasi KBBI untuk memastikan kata yang digunakan valid dalam bahasa Indonesia.

## Fitur Utama

- **Multiplayer Real-Time** - Dua pemain dapat bermain bersama secara bersamaan melalui WebSocket
- **Validasi KBBI** - Setiap kata divalidasi menggunakan Kamus Besar Bahasa Indonesia (KBBI)
- **Timer Interaktif** - Timer bom countdown dengan efek visual menarik
- **Sistem Skor** - Skor real-time yang diperbarui setiap kata valid
- **Efek Suara** - Suara procedural tanpa file eksternal (Web Audio API)
- **Responsif** - Tampilan yang optimal di berbagai ukuran layar

## Teknologi yang Digunakan

### Backend
- **Hono** - Framework web modern dan cepat
- **Socket.IO** - Untuk komunikasi real-time
- **TypeScript** - Bahasa pemrograman dengan type safety
- **Bun** - JavaScript runtime yang cepat

### Frontend
- **React** - Library UI modern
- **Vite** - Build tool yang cepat
- **TypeScript** - Type safety untuk kualitas kode
- **Tailwind CSS** - Styling utility-first
- **shadcn/ui** - Komponen UI yang dapat dikustomisasi
- **Zustand** - State management yang sederhana
- **TanStack Query** - Data fetching dan caching

## Cara Menjalankan

### Prerequisites
- Node.js (v18+) atau Bun
- npm atau bun sebagai package manager

### Clone dan Install

```bash
# Clone repository
git clone <repository-url>
cd root

# Install dependencies
cd backend && bun install
cd ../frontend && npm install
```

### Menjalankan Backend

```bash
cd backend
bun run index.ts
```

Backend akan berjalan di `http://localhost:3001`

### Menjalankan Frontend

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Cara Bermain

1. **Buat Room** - Klik tombol "Buat Room", masukkan nama, lalu akan mendapatkan kode room
2. **Bagikan Kode** - Bagikan kode room kepada teman
3. **Join Room** - Teman masukkan kode room dan nama untuk bergabung
4. **Mulai Game** - Jika sudah ada 2 pemain, host dapat memulai game
5. **Main Kata** - Pemain bergantian menyubmit kata yang dimulai dengan huruf terakhir kata sebelumnya
6. **Batas Waktu** - Setiap giliran memiliki waktu 15 detik
7. **Game Over** - Jika pemain tidak dapat menyubmit kata dalam waktu yang ditentukan, game selesai

### Aturan Game

- Panjang kata minimal 3 karakter
- Kata harus valid dalam KBBI
- Kata tidak boleh重复 (sudah digunakan sebelumnya)
- Kata harus dimulai dengan huruf terakhir kata sebelumnya

## Struktur Proyek

```
root/
├── backend/                 # Server backend
│   ├── src/
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── game/          # Game logic & timer
│   │   ├── routes/        # API routes
│   │   ├── dictionary/    # KBBI validation
│   │   └── data/          # KBBI word list
│   └── package.json
├── frontend/              # Client frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # Utilities
│   └── package.json
├── docs/                  # Dokumentasi
└── README.md              # File ini
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Check Room
```
GET /api/room/:code
```

### Validate Word
```
GET /api/dictionary/check/:word
```

## Socket Events

### Client → Server
- `CREATE_ROOM` - Membuat room baru
- `JOIN_ROOM` - Bergabung ke room
- `START_GAME` - Memulai game
- `SUBMIT_WORD` - Mengirim kata

### Server → Client
- `ROOM_CREATED` - Room berhasil dibuat
- `PLAYER_JOINED` - Pemain baru bergabung
- `TURN_START` - Giliran dimulai
- `WORD_VALID` - Kata valid
- `WORD_INVALID` - Kata tidak valid
- `TIMER_SYNC` - Sinkronisasi timer
- `GAME_OVER` - Game selesai


## Deployment

### Backend ke Railway
```bash
cd backend
railway init
railway up
```

### Frontend ke Vercel
```bash
cd frontend
vercel
```

## Kontribusi

Silakan buat pull request jika ingin berkontribusi pada proyek ini.

## Lisensi

Proyek ini dibuat untuk tugas UAS Web Programming.

---

<p align="center">
  Dibuat dengan ❤️ untuk tugas UAS
</p>