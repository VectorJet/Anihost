FROM oven/bun:1.3.9-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY server/package.json server/bun.lock ./server/

RUN bun install --frozen-lockfile \
  && cd server \
  && bun install --frozen-lockfile --production --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV PORT=10000
ENV INTERNAL_API_PORT=4001
ENV API_BASE_URL=http://127.0.0.1:4001/api/v1
ENV NEXT_PUBLIC_API_URL=/api/v1

RUN bun run build

EXPOSE 10000

CMD ["bun", "run", "start"]
