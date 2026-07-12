FROM node:22-bookworm-slim
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
ENV NODE_ENV=production TAOWIND_MCP_HOST=0.0.0.0 TAOWIND_MCP_PORT=8787
EXPOSE 8787
CMD ["node","packages/integration/taowind-reality-mcp/src/cli.mjs","serve"]
