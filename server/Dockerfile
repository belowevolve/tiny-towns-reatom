FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY index.ts ./

ENV PORT=3001
EXPOSE 3001

CMD ["bun", "run", "index.ts"]
