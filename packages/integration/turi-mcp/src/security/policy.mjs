import fs from 'node:fs';
import path from 'node:path';

export class TuriSecurityError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'TuriSecurityError';
    this.code = code;
    this.classification = 'security';
    this.details = details;
  }
}

const SECRET_SEGMENTS = new Set(['.env', '.env.local', '.env.production', '.git', '.ssh', 'id_rsa', 'id_ed25519']);

export function isSensitivePath(value) {
  return String(value).split(/[\\/]/).some((segment) => SECRET_SEGMENTS.has(segment) || segment.endsWith('.pem') || segment.endsWith('.key') || segment.endsWith('.p12'));
}

export function confinedPath(root, requested, { allowAbsolute = false, allowSensitive = false } = {}) {
  if (typeof requested !== 'string' || !requested.trim()) throw new TuriSecurityError('PATH_REQUIRED', 'A non-empty path is required.');
  if (!allowSensitive && isSensitivePath(requested)) throw new TuriSecurityError('SENSITIVE_PATH_DENIED', 'Sensitive paths are not available through TURI.');
  const candidate = allowAbsolute && path.isAbsolute(requested) ? requested : path.resolve(root, requested);
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new TuriSecurityError('PATH_TRAVERSAL_DENIED', 'The requested path escapes the configured root.');
  if (fs.existsSync(candidate)) {
    const realRoot = fs.realpathSync.native(resolvedRoot);
    const realCandidate = fs.realpathSync.native(candidate);
    const realRelative = path.relative(realRoot, realCandidate);
    if (realRelative === '..' || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) throw new TuriSecurityError('SYMLINK_ESCAPE_DENIED', 'The requested path escapes the configured root through a symlink.');
  }
  return candidate;
}

export class ExecutionPolicy {
  constructor(config) {
    this.config = config;
  }

  authorize(manifest, input = {}) {
    const mode = manifest.executionMode;
    if (mode === 'read_only') return { allowed: true, reason: 'read-only' };
    if (mode === 'candidate') {
      if (this.config.authorityMode === 'read_only') throw new TuriSecurityError('CANDIDATE_MODE_DISABLED', 'Candidate capabilities are disabled by server policy.');
      return { allowed: true, reason: 'candidate-boundary' };
    }
    if (mode === 'authorized_write') {
      if (!this.config.authorizedWritesEnabled) throw new TuriSecurityError('AUTHORITY_REQUIRED', 'This capability requires explicit authorized-write mode.');
      this.assertToken(input);
      return { allowed: true, reason: 'authorized-write' };
    }
    if (mode === 'external_effect') {
      if (!this.config.externalEffectsEnabled) throw new TuriSecurityError('EXTERNAL_EFFECT_DISABLED', 'External effects are disabled by default.');
      this.assertToken(input);
      return { allowed: true, reason: 'external-effect-with-token' };
    }
    throw new TuriSecurityError('EXECUTION_MODE_UNKNOWN', `Unknown execution mode: ${mode}`);
  }

  assertToken(input = {}) {
    if (!this.config.authorityToken || input.confirmation_token !== this.config.authorityToken) throw new TuriSecurityError('AUTHORITY_TOKEN_REQUIRED', 'A valid confirmation_token is required for this operation.');
  }
}

export function checkHttpRequest(config, request) {
  const origin = request.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) throw new TuriSecurityError('ORIGIN_NOT_ALLOWED', 'Origin is not allow-listed.');
  const host = String(request.headers.host ?? '').split(':')[0];
  if (config.allowedHosts.length && !config.allowedHosts.includes('*') && !config.allowedHosts.includes(host) && !config.allowedHosts.includes(request.headers.host)) throw new TuriSecurityError('HOST_NOT_ALLOWED', 'Host is not allow-listed.');
  if (config.authMode === 'bearer') {
    const expected = `Bearer ${config.bearerToken}`;
    if (request.headers.authorization !== expected) throw new TuriSecurityError('AUTHENTICATION_REQUIRED', 'Bearer authentication failed.');
  }
}
