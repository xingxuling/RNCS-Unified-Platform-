// Founder Password Calculus — local-only passphrase gate using Web Crypto (PBKDF2 + SHA-256).
// IMPORTANT: This is LOCAL protection only. Not a server-side auth system.

import { FOUNDER_MODE_RULES } from "@/constants/founderModeRules";

export interface FounderSecurityState {
  founderEnabled: boolean;
  passwordHash?: string;
  salt?: string;
  sessionExpiresAt?: string;
  trustedDevice?: boolean;
  lastLoginAt?: string;
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export function generateSalt(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return toHex(buf.buffer);
}

export async function hashPassphrase(passphrase: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex) as BufferSource,
      iterations: FOUNDER_MODE_RULES.PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

export function readSecurityState(): FounderSecurityState {
  if (typeof localStorage === "undefined") return { founderEnabled: false };
  try {
    const raw = localStorage.getItem(FOUNDER_MODE_RULES.STORAGE_KEY_SECURITY);
    if (!raw) return { founderEnabled: false };
    return JSON.parse(raw) as FounderSecurityState;
  } catch {
    return { founderEnabled: false };
  }
}

export function writeSecurityState(state: FounderSecurityState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(FOUNDER_MODE_RULES.STORAGE_KEY_SECURITY, JSON.stringify(state));
}

export function clearSecurityState() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(FOUNDER_MODE_RULES.STORAGE_KEY_SECURITY);
  localStorage.removeItem(FOUNDER_MODE_RULES.STORAGE_KEY_SESSION);
}

export function isFounderPasswordSet(): boolean {
  const s = readSecurityState();
  return Boolean(s.founderEnabled && s.passwordHash && s.salt);
}

export interface PassphraseValidation {
  ok: boolean;
  message?: string;
}

export function validatePassphrase(p: string): PassphraseValidation {
  if (!p || p.length < FOUNDER_MODE_RULES.MIN_PASSPHRASE_LENGTH) {
    return { ok: false, message: `口令至少 ${FOUNDER_MODE_RULES.MIN_PASSPHRASE_LENGTH} 个字符` };
  }
  if (p.length > FOUNDER_MODE_RULES.MAX_PASSPHRASE_LENGTH) {
    return { ok: false, message: "口令过长" };
  }
  return { ok: true };
}

export async function setupFounderPassword(passphrase: string): Promise<FounderSecurityState> {
  const v = validatePassphrase(passphrase);
  if (!v.ok) throw new Error(v.message);
  const salt = generateSalt();
  const passwordHash = await hashPassphrase(passphrase, salt);
  const state: FounderSecurityState = {
    founderEnabled: true,
    passwordHash,
    salt,
    lastLoginAt: new Date().toISOString(),
    trustedDevice: true,
  };
  writeSecurityState(state);
  return state;
}

export async function verifyFounderPassword(passphrase: string): Promise<boolean> {
  const s = readSecurityState();
  if (!s.founderEnabled || !s.passwordHash || !s.salt) return false;
  const hash = await hashPassphrase(passphrase, s.salt);
  return hash === s.passwordHash;
}
