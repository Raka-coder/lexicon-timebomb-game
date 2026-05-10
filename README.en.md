# Sambung Kata - Real-Time Word Chain Game

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Hono-FF5C01?style=for-the-badge&logo=hono&logoColor=white" alt="Hono">
</p>

<!-- README-I18N:START -->

**English** | [Bahasa Indonesia](./README.md)

<!-- README-I18N:END -->

Sambung Kata is a real-time multiplayer word chain game where two players compete to submit words that start with the last letter of the previous word. This game uses KBBI (Kamus Besar Bahasa Indonesia) validation to ensure all words are valid in Indonesian language.

## Key Features

- **Real-Time Multiplayer** - Two players can play together via WebSocket
- **KBBI Validation** - Every word is validated using the Official Indonesian Dictionary
- **Interactive Timer** - Bomb countdown timer with engaging visual effects
- **Scoring System** - Real-time scores updated for each valid word
- **Sound Effects** - Procedural audio without external files (Web Audio API)
- **Responsive** - Optimal display on various screen sizes

## Tech Stack

### Backend
- **Hono** - Modern and fast web framework
- **Socket.IO** - Real-time communication
- **TypeScript** - Type-safe programming language
- **Bun** - Fast JavaScript runtime

### Frontend
- **React** - Modern UI library
- **Vite** - Fast build tool
- **TypeScript** - Type safety for code quality
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Customizable UI components
- **Zustand** - Simple state management
- **TanStack Query** - Data fetching and caching

## How to Run

### Prerequisites
- Node.js (v18+) or Bun
- npm or bun as package manager

### Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd root

# Install dependencies
cd backend && bun install
cd ../frontend && npm install
```

### Running Backend

```bash
cd backend
bun run index.ts
```

Backend will run at `http://localhost:3001`

### Running Frontend

```bash
cd frontend
npm run dev
```

Frontend will run at `http://localhost:5173`

## How to Play

1. **Create Room** - Click "Buat Room", enter your name, you'll get a room code
2. **Share Code** - Share the room code with your friend
3. **Join Room** - Friend enters room code and name to join
4. **Start Game** - If there are 2 players, host can start the game
5. **Submit Words** - Players take turns submitting words starting with the last letter of the previous word
6. **Time Limit** - Each turn has a 15-second timer
7. **Game Over** - If a player cannot submit a word within the time limit, the game ends

### Game Rules

- Minimum word length is 3 characters
- Words must be valid in KBBI
- Words cannot be repeated (already used)
- Words must start with the last letter of the previous word

## Project Structure

```
root/
├── backend/                 # Backend server
│   ├── src/
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── game/          # Game logic & timer
│   │   ├── routes/        # API routes
│   │   ├── dictionary/    # KBBI validation
│   │   └── data/          # KBBI word list
│   └── package.json
├── frontend/              # Frontend client
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # Utilities
│   └── package.json
├── docs/                  # Documentation
└── README.md              # This file
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
- `CREATE_ROOM` - Create new room
- `JOIN_ROOM` - Join existing room
- `START_GAME` - Start the game
- `SUBMIT_WORD` - Submit a word

### Server → Client
- `ROOM_CREATED` - Room successfully created
- `PLAYER_JOINED` - New player joined
- `TURN_START` - Turn started
- `WORD_VALID` - Word is valid
- `WORD_INVALID` - Word is invalid
- `TIMER_SYNC` - Timer synchronization
- `GAME_OVER` - Game ended

## Deployment

### Backend to Railway
```bash
cd backend
railway init
railway up
```

### Frontend to Vercel
```bash
cd frontend
vercel
```

## Contributing

Please create a pull request if you'd like to contribute to this project.

## License

This project was created for UAS Web Programming assignment.

---

<p align="center">
  Made with ❤️ for UAS assignment
</p>