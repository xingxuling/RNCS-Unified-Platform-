FROM node:20-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

ENV NODE_ENV=production \
    TURI_HOST=0.0.0.0 \
    TURI_PORT=8797 \
    TURI_MCP_PATH=/mcp \
    TURI_AUTH_MODE=bearer \
    TURI_AUTHORITY_MODE=candidate \
    TURI_ENABLE_AUTHORIZED_WRITES=false \
    TURI_ENABLE_EXTERNAL_EFFECTS=false

EXPOSE 8797
CMD ["node", "packages/integration/turi-mcp/src/cli.mjs", "http"]
