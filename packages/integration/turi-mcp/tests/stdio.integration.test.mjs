import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '../../..');

test('stdio CLI completes MCP initialize and tool discovery', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turi-stdio-test-'));
  const client = new Client({ name: 'turi-stdio-test', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(packageRoot, 'src', 'cli.mjs'), 'stdio'],
    cwd: repoRoot,
    env: { ...process.env, TURI_REPO_ROOT: repoRoot, TURI_DATA_DIR: dataDir, TURI_AUTH_MODE: 'none', TURI_AUTHORITY_MODE: 'candidate' },
  });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 104);
    const info = await client.callTool({ name: 'turi_server_info', arguments: {} });
    assert.equal(info.isError, undefined);
  } finally {
    await client.close().catch(() => {});
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
