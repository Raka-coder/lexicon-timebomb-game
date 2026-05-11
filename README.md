# Lexicon Timebomb (Game Sambung Kata)

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

Lexicon Timebomb adalah game sambung kata multiplayer real-time. Dua pemain bersaing untuk menyusun kata yang dimulai dari huruf terakhir kata sebelumnya. Jika waktu habis, pemain kalah!

## Fitur Utama

- **Multiplayer Real-Time** — Dua pemain bermain bersamaan via WebSocket
- **Validasi KBBI** — Setiap kata divalidasi dengan Kamus Besar Bahasa Indonesia
- **Timer Bom** — Countdown 15 detik dengan efek visual dinamis
- **Sistem Skor** — Skor real-time untuk setiap kata valid
- **Efek Suara** — Procedural sound via Web Audio API (tanpa file eksternal)
- **Responsif** — Optimal di desktop dan mobile

## Teknologi

### Backend
- **Hono** — Framework web modern dan cepat
- **Socket.IO** — Komunikasi real-time
- **TypeScript** — Type safety
- **Bun** — JavaScript runtime

### Frontend
- **React** — Library UI
- **Vite** — Build tool
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Komponen UI siap pakai
- **Zustand** — State management

## Cara Menjalankan

### Prasyarat
- Node.js v18+ atau Bun
- npm atau bun

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd root

# Install dependencies
cd backend && bun install
cd ../frontend && npm install
```

### Jalankan Backend

```bash
cd backend
bun run index.ts
```

Backend berjalan di `http://localhost:3001`

### Jalankan Frontend

```bash
cd frontend
npm run dev
```

Frontend berjalan di `http://localhost:5173`

## Cara Bermain

1. **Buat Room** — Klik "Host", masukkan nama, dapatkan kode room
2. **Bagikan Kode** — Sebarkan kode room ke teman
3. **Gabung Room** — Teman masukkan kode dan nama untuk bergabung
4. **Mulai Game** — Host memulai jika sudah ada 2 pemain
5. **Sambung Kata** — Pemain bergantian menulis kata berawalan huruf terakhir kata sebelumnya
6. **Batas Waktu** — Setiap giliran terbatas 15 detik
7. **Game Over** — Pemain yang tidak bisa menjawab dalam waktu yang ditentukan kalah

### Aturan

- Kata minimal 3 karakter
- Kata harus valid menurut KBBI
- Kata tidak boleh dipakai dua kali
- Kata harus diawali dengan huruf terakhir kata sebelumnya

## Struktur Proyek

```
root/
├── backend/                 # Server backend
│   ├── src/
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── game/          # Game logic & timer
│   │   ├── routes/        # API routes
│   │   ├── dictionary/    # Validasi KBBI
│   │   └── data/          # Daftar kata KBBI
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

## API Endpoint

### Health Check
```
GET /api/health
```

### Cek Room
```
GET /api/room/:code
```

### Validasi Kata
```
GET /api/dictionary/check/:word
```

## Socket Events

### Client → Server
- `CREATE_ROOM` — Buat room baru
- `JOIN_ROOM` — Gabung room
- `START_GAME` — Mulai game
- `SUBMIT_WORD` — Kirim kata

### Server → Client
- `ROOM_CREATED` — Room berhasil dibuat
- `PLAYER_JOINED` — Pemain baru bergabung
- `TURN_START` — Giliran dimulai
- `WORD_VALID` — Kata valid
- `WORD_INVALID` — Kata tidak valid
- `TIMER_SYNC` — Sinkronisasi timer
- `GAME_OVER` — Game selesai

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

Pull request diterima untuk perbaikan dan peningkatan.

## Lisensi

Proyek ini dibuat untuk tugas UAS Web Programming.

---

<p align="center">
  Dibuat dengan ❤️
</p>