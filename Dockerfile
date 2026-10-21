
FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

# Install exactly the dependencies recorded in pnpm-lock.yaml.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "start"]
