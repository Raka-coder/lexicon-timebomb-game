FROM oven/bun:1.1.34

WORKDIR /app

COPY backend/package.json ./backend/package.json

WORKDIR /app/backend

RUN bun install

COPY backend/ ./

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
