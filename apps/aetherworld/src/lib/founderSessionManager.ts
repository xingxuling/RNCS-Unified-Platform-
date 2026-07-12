// Founder Session Manager — creates, validates, and clears local Founder sessions.

import { FOUNDER_MODE_RULES } from "@/constants/founderModeRules";

export interface FounderSession {
  active: boolean;
  accessLevel: "OWNER";
  startedAt: string;
  expiresAt: string;
}

export function readSession(): FounderSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(FOUNDER_MODE_RULES.STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as FounderSession;
  } catch {
    return null;
  }
}

export function isSessionActive(): boolean {
  const s = readSession();
  if (!s || !s.active) return false;
  return new Date(s.expiresAt).getTime() > Date.now();
}

export function startSession(hours: number): FounderSession {
  const now = new Date();
  const expires = new Date(now.getTime() + Math.max(hours, 0.0001) * 60 * 60 * 1000);
  const session: FounderSession = {
    active: true,
    accessLevel: "OWNER",
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(FOUNDER_MODE_RULES.STORAGE_KEY_SESSION, JSON.stringify(session));
  }
  return session;
}

export function endSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(FOUNDER_MODE_RULES.STORAGE_KEY_SESSION);
}

export function getRemainingMinutes(): number {
  const s = readSession();
  if (!s) return 0;
  return Math.max(0, Math.round((new Date(s.expiresAt).getTime() - Date.now()) / 60000));
}
