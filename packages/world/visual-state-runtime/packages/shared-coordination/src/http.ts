import { createServer } from 'node:http';
import type { VSRSharedCommitCandidate, VSRSharedCursor, VSRSharedRevocationRequest, VSRSharedRealityCoordinator, VSRSharedRealityEvent } from './index.js';

interface HttpServerLike {
  listen(port: number, host: string, callback: () => void): void;
  close(callback?: (error?: Error) => void): void;
  address(): { port: number } | string | null;
}

function sendJson(response: any, status: number, value: unknown): void {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength ? Buffer.byteLength(body) : new TextEncoder().encode(body).length,
    'access-control-allow-origin': '*',
  });
  response.end(body);
}

function readJson(request: any, limit = 2_000_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    let size = 0;
    request.on('data', (chunk: any) => {
      size += chunk.length ?? 0;
      if (size > limit) {
        reject(new Error('Request body exceeds shared coordination limit.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function sseEvent(event: VSRSharedRealityEvent): string {
  return `id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export class VSRSharedRealityHttpServer {
  readonly coordinator: VSRSharedRealityCoordinator;
  private server: HttpServerLike;
  private streams = new Set<any>();
  private unsubscribe: () => void;

  constructor(coordinator: VSRSharedRealityCoordinator) {
    this.coordinator = coordinator;
    this.server = createServer((request: any, response: any) => { void this.route(request, response); }) as unknown as HttpServerLike;
    this.unsubscribe = coordinator.subscribe(event => {
      const frame = sseEvent(event);
      for (const stream of this.streams) {
        try { stream.write(frame); } catch { this.streams.delete(stream); }
      }
    });
  }

  private async route(request: any, response: any): Promise<void> {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method === 'OPTIONS') {
        response.writeHead(204, {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type',
        });
        response.end();
        return;
      }
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(response, 200, { ok: true, protocol: 'vsr.shared-reality-http.v0.1', cursor: this.coordinator.cursor() });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/snapshot') {
        sendJson(response, 200, this.coordinator.snapshot());
        return;
      }
      if (request.method === 'GET' && url.pathname === '/events') {
        const cursor: VSRSharedCursor = {
          format: 'vsr.shared-reality-cursor.v0.1',
          sessionId: this.coordinator.sessionId,
          sequence: Number(url.searchParams.get('after') ?? 0),
          eventRoot: url.searchParams.get('root') ?? '',
        };
        sendJson(response, 200, this.coordinator.eventsAfter(cursor));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/stream') {
        const cursor: VSRSharedCursor = {
          format: 'vsr.shared-reality-cursor.v0.1',
          sessionId: this.coordinator.sessionId,
          sequence: Number(url.searchParams.get('after') ?? 0),
          eventRoot: url.searchParams.get('root') ?? '',
        };
        const backlog = this.coordinator.eventsAfter(cursor);
        response.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
        });
        response.write(`event: ready\ndata: ${JSON.stringify({ sessionId: this.coordinator.sessionId, cursor: this.coordinator.cursor() })}\n\n`);
        for (const event of backlog.events) response.write(sseEvent(event));
        this.streams.add(response);
        request.on('close', () => this.streams.delete(response));
        return;
      }
      if (request.method === 'POST' && url.pathname === '/commit') {
        const candidate = await readJson(request) as VSRSharedCommitCandidate;
        const result = this.coordinator.submit(candidate);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/revoke') {
        const revocation = await readJson(request) as VSRSharedRevocationRequest;
        const event = this.coordinator.revoke(revocation);
        sendJson(response, 200, { ok: true, event, snapshot: this.coordinator.snapshot() });
        return;
      }
      sendJson(response, 404, { ok: false, error: 'not-found' });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  start(port = 0, host = '127.0.0.1'): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(port, host, () => {
          const address = this.server.address();
          if (!address || typeof address === 'string') reject(new Error('Shared coordination server address unavailable.'));
          else resolve(address.port);
        });
      } catch (error) { reject(error); }
    });
  }

  close(): Promise<void> {
    this.unsubscribe();
    for (const stream of this.streams) {
      try { stream.end(); } catch { /* ignore */ }
    }
    this.streams.clear();
    return new Promise((resolve, reject) => this.server.close(error => error ? reject(error) : resolve()));
  }
}
