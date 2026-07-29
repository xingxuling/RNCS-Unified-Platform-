import app from '../server-turi.mjs';

// Vercel invokes files in /api with that prefix in some adapters. Strip it so
// the MCP service keeps its public route contract at /mcp.
export default async function vercelHandler(request, response, next) {
  const query = request?.query ?? {};
  const routedPath = typeof query.__path === 'string' ? query.__path : null;
  if (routedPath) {
    const forwarded = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key === '__path') continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== undefined && item !== null) forwarded.append(key, String(item));
      }
    }
    request.url = routedPath + (forwarded.size ? `?${forwarded}` : '');
  } else if (typeof request.url === 'string' && request.url.startsWith('/api')) {
    request.url = request.url.slice('/api'.length) || '/';
  }
  return app(request, response, next);
}
