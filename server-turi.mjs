import { createTuriService } from './packages/integration/turi-mcp/src/service.mjs';

const env = {
  ...process.env,
  TURI_HOST: process.env.TURI_HOST ?? '0.0.0.0',
  TURI_PORT: process.env.TURI_PORT ?? process.env.PORT ?? '3000',
  TURI_MCP_PATH: process.env.TURI_MCP_PATH ?? '/mcp',
  TURI_AUTH_MODE: process.env.TURI_AUTH_MODE ?? 'none',
  TURI_ALLOW_PUBLIC_NO_AUTH: process.env.TURI_ALLOW_PUBLIC_NO_AUTH ?? 'true',
  TURI_ALLOWED_HOSTS: process.env.TURI_ALLOWED_HOSTS ?? '*',
  TURI_ALLOWED_ORIGINS: process.env.TURI_ALLOWED_ORIGINS ?? 'https://chatgpt.com,https://chat.openai.com',
  TURI_AUTHORITY_MODE: process.env.TURI_AUTHORITY_MODE ?? 'candidate',
  TURI_ENABLE_AUTHORIZED_WRITES: process.env.TURI_ENABLE_AUTHORIZED_WRITES ?? 'false',
  TURI_ENABLE_EXTERNAL_EFFECTS: process.env.TURI_ENABLE_EXTERNAL_EFFECTS ?? 'false',
  TURI_DATA_DIR: process.env.TURI_DATA_DIR ?? '/tmp/turi-mcp',
};

const service = await createTuriService({ env });
export default service.app;
