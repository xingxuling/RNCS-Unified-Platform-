FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git python3 python3-pip zip unzip xz-utils \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && curl -fsSL https://services.gradle.org/distributions/gradle-8.10.2-bin.zip -o /tmp/gradle.zip \
 && unzip -q /tmp/gradle.zip -d /opt \
 && ln -s /opt/gradle-8.10.2/bin/gradle /usr/local/bin/gradle \
 && rm -rf /var/lib/apt/lists/* /tmp/gradle.zip

WORKDIR /app
COPY . /app

ENV NODE_ENV=production \
    TAOWIND_EXECUTION_WORKER_HOST=0.0.0.0 \
    TAOWIND_EXECUTION_WORKER_PORT=8790 \
    TAOWIND_EXECUTION_WORKSPACE_ROOT=/workspace \
    TAOWIND_EXECUTION_MODE=founder

RUN mkdir -p /workspace /var/lib/taowind/receipts /var/lib/taowind/artifacts

EXPOSE 8790
CMD ["node", "server.mjs"]
