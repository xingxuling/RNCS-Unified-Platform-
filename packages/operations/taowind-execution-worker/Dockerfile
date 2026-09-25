FROM eclipse-temurin:21-jdk-jammy

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git python3 python3-pip zip unzip xz-utils \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY src ./src

RUN mkdir -p /data/workspace /data/receipts /data/artifacts \
 && useradd --create-home --uid 10001 taowind \
 && chown -R taowind:taowind /app /data
USER taowind

ENV NODE_ENV=production \
    PORT=8790 \
    TAOWIND_EXECUTION_WORKER_HOST=0.0.0.0 \
    TAOWIND_EXECUTION_WORKSPACE_ROOT=/data/workspace \
    TAOWIND_EXECUTION_RECEIPT_DIR=/data/receipts \
    TAOWIND_EXECUTION_EXPORT_DIR=/data/artifacts \
    TAOWIND_EXECUTION_MODE=founder \
    TAOWIND_EXECUTION_MAX_CONCURRENCY=2 \
    TAOWIND_EXECUTION_MAX_REQUEST_BYTES=16777216 \
    TAOWIND_EXECUTION_TIMEOUT_MS=120000 \
    TAOWIND_EXECUTION_MAX_OUTPUT_BYTES=1000000

EXPOSE 8790
CMD ["node","src/cli.mjs"]
