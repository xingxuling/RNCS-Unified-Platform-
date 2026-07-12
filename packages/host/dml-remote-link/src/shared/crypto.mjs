import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { canonical, sha256 } from './canonical.mjs';

export function ensureEd25519KeyPair(directory, prefix) {
  fs.mkdirSync(directory, { recursive: true });
  const privatePath = path.join(directory, `${prefix}-private.pem`);
  const publicPath = path.join(directory, `${prefix}-public.pem`);
  if (!fs.existsSync(privatePath) || !fs.existsSync(publicPath)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    fs.writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o644 });
  }
  return {
    privatePath,
    publicPath,
    privateKeyPem: fs.readFileSync(privatePath, 'utf8'),
    publicKeyPem: fs.readFileSync(publicPath, 'utf8'),
  };
}

export function signRoot(privateKeyPem, root) {
  return crypto.sign(null, Buffer.from(root, 'utf8'), privateKeyPem).toString('base64');
}

export function verifyRoot(publicKeyPem, root, signatureB64) {
  try {
    return crypto.verify(null, Buffer.from(root, 'utf8'), publicKeyPem, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}

export function sealObject(value, privateKeyPem, rootField = 'root', signatureField = 'signature_b64') {
  const base = structuredClone(value);
  delete base[rootField];
  delete base[signatureField];
  const root = sha256(canonical(base));
  return { ...base, [rootField]: root, [signatureField]: signRoot(privateKeyPem, root) };
}

export function verifySealedObject(value, publicKeyPem, rootField = 'root', signatureField = 'signature_b64') {
  const base = structuredClone(value);
  const root = base[rootField];
  const signature = base[signatureField];
  delete base[rootField];
  delete base[signatureField];
  return typeof root === 'string'
    && sha256(canonical(base)) === root
    && verifyRoot(publicKeyPem, root, signature);
}

export function requestSigningText({ method, pathWithQuery, timestamp, nonce, body }) {
  return [method.toUpperCase(), pathWithQuery, String(timestamp), String(nonce), sha256(body || '')].join('\n');
}

export function signRequest(privateKeyPem, request) {
  const text = requestSigningText(request);
  return crypto.sign(null, Buffer.from(text), privateKeyPem).toString('base64');
}

export function verifyRequest(publicKeyPem, request, signatureB64) {
  try {
    const text = requestSigningText(request);
    return crypto.verify(null, Buffer.from(text), publicKeyPem, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}


export function verifyBrowserRequest(publicKeyJwk, request, signatureB64Url) {
  try {
    const text = requestSigningText(request);
    const key = crypto.createPublicKey({ key: publicKeyJwk, format: 'jwk' });
    return crypto.verify(
      'sha256',
      Buffer.from(text, 'utf8'),
      { key, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signatureB64Url, 'base64url'),
    );
  } catch {
    return false;
  }
}
