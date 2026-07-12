import fs from 'node:fs';
import path from 'node:path';
import { hash, id, now } from './canonical.mjs';

const MAX_SOURCE_BYTES = 1_500_000;

function stripHtml(value) {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromHtml(html, fallback) {
  const match = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]).slice(0, 240) : fallback;
}

export function sourceRecordFromText({ title, uri, sourceType = 'text', text, trustScore = 0.5, notes = '', metadata = {} }) {
  const normalized = String(text || '').replace(/\r\n/g, '\n');
  const contentHash = hash({ text: normalized });
  return {
    source_id: id('source', { uri, contentHash }),
    title: String(title || uri || '未命名来源'),
    uri: String(uri || 'memory:source'),
    source_type: sourceType,
    fetched_at: now(),
    content_hash: contentHash,
    trust_score: Math.max(0, Math.min(1, Number(trustScore))),
    notes: String(notes || ''),
    excerpt: normalized.slice(0, 4000),
    byte_length: Buffer.byteLength(normalized),
    metadata,
  };
}

export function ingestLocalSource(file, options = {}) {
  const resolved = path.resolve(file);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw Object.assign(new Error(`不是文件：${resolved}`), { code: 'SOURCE_NOT_FILE' });
  if (stat.size > (options.maxBytes || MAX_SOURCE_BYTES)) throw Object.assign(new Error(`来源文件过大：${stat.size}`), { code: 'SOURCE_TOO_LARGE' });
  const text = fs.readFileSync(resolved, 'utf8');
  return sourceRecordFromText({
    title: options.title || path.basename(resolved),
    uri: `file://${resolved.replace(/\\/g, '/')}`,
    sourceType: options.sourceType || 'local-file',
    text,
    trustScore: options.trustScore ?? 0.8,
    notes: options.notes || '',
    metadata: { path: resolved, mtime_ms: stat.mtimeMs },
  });
}

export async function ingestWebSource(uri, options = {}) {
  const url = new URL(uri);
  if (url.protocol !== 'https:') throw Object.assign(new Error('只允许 HTTPS 学习来源'), { code: 'SOURCE_PROTOCOL_DENIED' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(options.timeoutMs || 12_000));
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Digital-Blue-Sky-DML/0.2 (+local-learning-runtime)' },
    });
    if (!response.ok) throw Object.assign(new Error(`来源请求失败：${response.status}`), { code: 'SOURCE_FETCH_FAILED' });
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > (options.maxBytes || MAX_SOURCE_BYTES)) throw Object.assign(new Error('来源内容过大'), { code: 'SOURCE_TOO_LARGE' });
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > (options.maxBytes || MAX_SOURCE_BYTES)) throw Object.assign(new Error('来源内容过大'), { code: 'SOURCE_TOO_LARGE' });
    const raw = new TextDecoder().decode(buffer);
    const contentType = response.headers.get('content-type') || '';
    const text = contentType.includes('html') ? stripHtml(raw) : raw;
    return sourceRecordFromText({
      title: options.title || (contentType.includes('html') ? titleFromHtml(raw, url.hostname) : url.pathname.split('/').pop() || url.hostname),
      uri: response.url,
      sourceType: options.sourceType || 'web',
      text,
      trustScore: options.trustScore ?? 0.65,
      notes: options.notes || '',
      metadata: { content_type: contentType, status: response.status },
    });
  } finally {
    clearTimeout(timer);
  }
}
