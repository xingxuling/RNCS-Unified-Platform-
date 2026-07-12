import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ensureEd25519KeyPair, sealObject, verifySealedObject, signRequest, verifyRequest } from '../src/shared/crypto.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'dml-crypto-test-')); }

test('Ed25519 sealed envelopes reject tampering', () => {
  const root = temp();
  try {
    const keys = ensureEd25519KeyPair(root, 'test');
    const sealed = sealObject({ hello: 'world', amount: 2 }, keys.privateKeyPem);
    assert.equal(verifySealedObject(sealed, keys.publicKeyPem), true);
    assert.equal(verifySealedObject({ ...sealed, amount: 3 }, keys.publicKeyPem), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('signed host requests bind method path timestamp nonce and body', () => {
  const root = temp();
  try {
    const keys = ensureEd25519KeyPair(root, 'host');
    const request = { method: 'POST', pathWithQuery: '/x?a=1', timestamp: '100', nonce: 'nonce-1234567890', body: '{"a":1}' };
    const signature = signRequest(keys.privateKeyPem, request);
    assert.equal(verifyRequest(keys.publicKeyPem, request, signature), true);
    assert.equal(verifyRequest(keys.publicKeyPem, { ...request, body: '{"a":2}' }, signature), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
