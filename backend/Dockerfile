FROM oven/bun:1.1.34 AS base

WORKDIR /app

# Development stage
FROM base AS development
COPY package.json bun.lock* ./
RUN bun install
COPY . .
EXPOSE 3001
CMD ["bun", "run", "--watch", "src/index.ts"]

# Production stage
FROM base AS production
COPY package.json bun.lock* ./
RUN bun install --production
COPY . .
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
