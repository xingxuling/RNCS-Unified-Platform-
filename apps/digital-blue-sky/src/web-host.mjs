#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CognitiveDMLRuntime } from './cognitive-runtime-wrapper.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = process.argv.slice(2);
const get = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const port = Number(get('--port', process.env.PORT || 17801));
const stateDir = path.resolve(get('--state', process.env.DML_STATE_DIR || path.join(root, 'state')));
const webDir = path.resolve(get('--web', process.env.DML_WEB_DIR || path.join(root, 'web')));
const runtime = new CognitiveDMLRuntime({ stateDir, projectPath: process.env.DML_DEFAULT_PROJECT_PATH || process.cwd() });
const clients = new Set();

function sendJson(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function broadcast(projection) {
  const frame = `event: projection\ndata: ${JSON.stringify(projection)}\n\n`;
  for (const client of clients) client.write(frame);
}

runtime.subscribe((projection) => broadcast(projection));

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  })[ext] || 'application/octet-stream';
}

function serveFile(response, file) {
  const isAsset = file.includes(`${path.sep}assets${path.sep}`);
  response.writeHead(200, {
    'content-type': mime(file),
    'cache-control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
  });
  fs.createReadStream(file).pipe(response);
}


async function readJsonBody(request, maxBytes = 2_000_000) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > maxBytes) throw Object.assign(new Error('Request body too large'), { code: 'REQUEST_TOO_LARGE' });
  }
  return JSON.parse(body || '{}');
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      return sendJson(response, 200, {
        ...runtime.health(),
        host: '127.0.0.1',
        port,
        workbench: fs.existsSync(path.join(webDir, 'index.html')) ? 'ready' : 'missing',
      });
    }
    if (request.method === 'GET' && url.pathname === '/projection') {
      return sendJson(response, 200, runtime.project());
    }
    if (request.method === 'GET' && url.pathname === '/capabilities') {
      return sendJson(response, 200, runtime.capability.registry || { format: 'dml.capability-registry.v0.4', capabilities: [] });
    }
    if (request.method === 'GET' && url.pathname === '/cognitive/config') {
      return sendJson(response, 200, { config: runtime.cognitiveConfig(), status: runtime.cognitive.snapshot() });
    }
    if (request.method === 'POST' && url.pathname === '/cognitive/config') {
      const body = await readJsonBody(request, 256_000);
      const config = runtime.saveCognitiveConfig(body);
      const status = await runtime.cognitive.status();
      broadcast(runtime.project());
      return sendJson(response, 200, { config, status });
    }
    if (request.method === 'POST' && url.pathname === '/cognitive/test') {
      const result = await runtime.testCognitiveProvider();
      broadcast(runtime.project());
      return sendJson(response, 200, result);
    }
    if (request.method === 'GET' && url.pathname === '/task') {
      return sendJson(response, 200, runtime.activeTask || { status: 'idle' });
    }
    if (request.method === 'GET' && url.pathname === '/tasks') {
      return sendJson(response, 200, { active: runtime.activeTask || null, history: runtime.taskHistory || [] });
    }
    if (request.method === 'GET' && url.pathname === '/events') {
      response.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      });
      response.write(`event: projection\ndata: ${JSON.stringify(runtime.project())}\n\n`);
      clients.add(response);
      const heartbeat = setInterval(() => response.write(': keepalive\n\n'), 20_000);
      request.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(response);
      });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/intent') {
      const parsed = await readJsonBody(request);
      const action = parsed.action || parsed;
      if (['dml.development.run', 'dml.capability.scan', 'dml.task.execute', 'dml.goal.create', 'dml.message.send'].includes(action?.type) && !action?.payload?.project_path) {
        action.payload = { ...(action.payload || {}), project_path: process.env.DML_DEFAULT_PROJECT_PATH || '' };
      }
      const result = await runtime.executeAsync(action, parsed.options || {});
      broadcast(result.projection || runtime.project());
      return sendJson(response, 200, result);
    }
    if (request.method === 'POST' && url.pathname === '/demo') {
      const result = runtime.demo({ reset: false });
      broadcast(result);
      return sendJson(response, 200, result);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'method not allowed' } });
    }

    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const candidate = path.resolve(webDir, `.${requested}`);
    const insideWeb = candidate === webDir || candidate.startsWith(`${webDir}${path.sep}`);
    if (insideWeb && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      if (request.method === 'HEAD') {
        response.writeHead(200, { 'content-type': mime(candidate) });
        return response.end();
      }
      return serveFile(response, candidate);
    }

    // BrowserRouter SPA fallback for every extensionless application route,
    // including /model and /tongpin. Some Windows browser navigations send */*.
    const indexFile = path.join(webDir, 'index.html');
    const acceptsHtml = String(request.headers.accept || '').includes('text/html');
    const extensionlessRoute = !path.extname(url.pathname);
    if (fs.existsSync(indexFile) && (acceptsHtml || extensionlessRoute)) {
      return serveFile(response, indexFile);
    }
    return sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'not found' } });
  } catch (error) {
    const projection = runtime.project();
    broadcast(projection);
    const status = error.code === 'REQUEST_TOO_LARGE' ? 413
      : String(error.code || '').startsWith('CAPABILITY_GAP') ? 409
      : ['BLOCKED_ACTION_NOT_FOUND', 'TASK_ALREADY_RUNNING', 'TASK_APPROVAL_REQUIRED', 'TASK_NEEDS_CLARIFICATION', 'CODE_PROVIDER_REQUIRED'].includes(error.code) ? 409
      : 500;
    sendJson(response, status, {
      error: { code: error.code || 'ERROR', message: error.message },
      projection,
    });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    process.stderr.write(`PORT_IN_USE: 127.0.0.1:${port}\n`);
    process.exitCode = 2;
    return;
  }
  process.stderr.write(`${error.code || 'SERVER_ERROR'}: ${error.message}\n`);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`数字蓝天机本机工作台：http://127.0.0.1:${port}\n`);
  process.stdout.write(`状态目录：${stateDir}\n`);
  process.stdout.write(`界面目录：${webDir}\n`);
  setTimeout(() => {
    runtime.resumePendingWork().catch((error) => {
      process.stderr.write(`LEGACY_TASK_MIGRATION_FAILED: ${error.code || 'ERROR'} ${error.message}\n`);
    });
  }, 300).unref();
});

function shutdown() {
  for (const client of clients) client.end();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
