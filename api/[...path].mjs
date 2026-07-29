import app from '../server-turi.mjs';

// Catch-all entry for Vercel paths such as /mcp and /.well-known/*.
export default function vercelHandler(request, response, next) {
  if (typeof request.url === 'string' && request.url.startsWith('/api')) {
    request.url = request.url.slice('/api'.length) || '/';
  }
  return app(request, response, next);
}
