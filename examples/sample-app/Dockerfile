FROM node:22-alpine AS build
WORKDIR /source
COPY server.mjs ./server.mjs

FROM node:22-alpine AS runtime

ARG APP_VERSION=local
ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=${APP_VERSION}
WORKDIR /app

COPY --from=build --chown=node:node /source/server.mjs ./server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
