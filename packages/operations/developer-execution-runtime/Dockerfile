FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates curl python3 python3-pip openjdk-17-jdk-headless zip unzip \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY . /workspace
RUN npm ci --ignore-scripts

ENV NODE_ENV=production \
    TAOWIND_EXECUTION_WORKER_HOST=0.0.0.0 \
    TAOWIND_EXECUTION_WORKER_PORT=8790 \
    TAOWIND_EXECUTION_PROVIDER=local \
    TAOWIND_EXECUTION_WORKSPACE_ROOT=/workspace \
    TAOWIND_EXECUTION_MODE=founder

EXPOSE 8790
CMD ["node","packages/operations/developer-execution-runtime/src/cli.mjs","worker"]
