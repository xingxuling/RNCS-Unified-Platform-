#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTuriService } from './service.mjs';

const command = process.argv[2] ?? 'http';
if (!['http', 'stdio'].includes(command)) {
  console.error('Usage: turi-mcp http|stdio');
  process.exit(2);
}

try {
  const service = await createTuriService();
  if (command === 'stdio') {
    const server = service.createServer();
    await server.connect(new StdioServerTransport());
    process.once('SIGINT', async () => { await server.close(); process.exit(0); });
    process.once('SIGTERM', async () => { await server.close(); process.exit(0); });
  } else {
    await service.start();
    console.error(JSON.stringify({ status: 'ready', name: service.config.name, version: service.config.version, url: service.url, mcpUrl: service.mcpUrl, toolCount: service.exposedTools.length, authorityMode: service.config.authorityMode }));
    const shutdown = async () => { await service.stop(); process.exit(0); };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', error: { code: error.code ?? 'STARTUP_ERROR', message: error.message } }));
  process.exit(1);
}
