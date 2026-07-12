import type { ChatMessage } from "./chatMessageEngine";
import type { ChatSessionStatus } from "@/constants/chat/chatSessionStatuses";

export interface ChatSession {
  sessionId: string;
  title: string;
  status: ChatSessionStatus;
  workspaceId?: string;
  messages: ChatMessage[];
  linkedObjectIds: string[];
  linkedRunIds: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "aether.chat.sessions.v1";
let STATE: Record<string, ChatSession> | null = null;
const listeners = new Set<() => void>();

function load(): Record<string, ChatSession> {
  if (STATE) return STATE;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) STATE = JSON.parse(raw);
    } catch {}
  }
  if (!STATE) STATE = {};
  return STATE;
}

function persist() {
  if (typeof window === "undefined" || !STATE) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch {}
  listeners.forEach((l) => l());
}

export function subscribeSessions(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function createSession(title = "新对话"): ChatSession {
  const s = load();
  const id = `CHAT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const session: ChatSession = {
    sessionId: id, title, status: "ACTIVE",
    messages: [], linkedObjectIds: [], linkedRunIds: [],
    createdAt: now, updatedAt: now,
  };
  s[id] = session;
  persist();
  return session;
}

export function getSession(sessionId: string): ChatSession | undefined {
  return load()[sessionId];
}

export function listSessions(): ChatSession[] {
  return Object.values(load()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function appendMessage(sessionId: string, msg: ChatMessage) {
  const s = load();
  const sess = s[sessionId];
  if (!sess) return;
  sess.messages.push(msg);
  sess.updatedAt = new Date().toISOString();
  if (sess.title === "新对话" && msg.role === "user" && msg.text) {
    sess.title = msg.text.slice(0, 24);
  }
  persist();
}

export function linkObject(sessionId: string, objectId: string) {
  const s = load(); const sess = s[sessionId];
  if (!sess) return;
  if (!sess.linkedObjectIds.includes(objectId)) sess.linkedObjectIds.push(objectId);
  persist();
}

export function linkRun(sessionId: string, runId: string) {
  const s = load(); const sess = s[sessionId];
  if (!sess) return;
  if (!sess.linkedRunIds.includes(runId)) sess.linkedRunIds.push(runId);
  persist();
}

export function updateMessage(sessionId: string, messageId: string, patch: Partial<ChatMessage>) {
  const s = load();
  const sess = s[sessionId];
  if (!sess) return;
  const idx = sess.messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return;
  sess.messages[idx] = { ...sess.messages[idx], ...patch };
  sess.updatedAt = new Date().toISOString();
  persist();
}


export function renameSession(sessionId: string, title: string) {
  const s = load(); if (s[sessionId]) { s[sessionId].title = title; persist(); }
}

export function deleteSession(sessionId: string) {
  const s = load(); delete s[sessionId]; persist();
}

export function clearSessions() {
  STATE = {}; persist();
}
