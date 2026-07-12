// 社交发布审计：每次 CREATE / UPDATE / BLOCK / PUBLISH / UNPUBLISH 写入本地审计
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";

export interface SocialPublishAudit {
  auditId: string;
  userId: string;
  postId?: string;
  linkedObjectId?: string;
  visibility: SocialVisibility;
  action: "CREATE" | "UPDATE" | "PUBLISH" | "UNPUBLISH" | "BLOCK";
  qaStatus: string;
  safetyStatus: "PASS" | "WARN" | "BLOCK";
  blockedReasons: string[];
  createdAt: string;
}

const KEY = "aether.social.publishAudits.v1";
const MAX = 200;

function read(): SocialPublishAudit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SocialPublishAudit[]) : [];
  } catch {
    return [];
  }
}

function write(list: SocialPublishAudit[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("aether-social:audit"));
  } catch {}
}

export function appendPublishAudit(entry: Omit<SocialPublishAudit, "auditId" | "createdAt">): SocialPublishAudit {
  const full: SocialPublishAudit = {
    ...entry,
    auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  write([full, ...read()]);
  return full;
}

export function listPublishAudits(userId?: string): SocialPublishAudit[] {
  const all = read();
  return userId ? all.filter((a) => a.userId === userId) : all;
}

export function listPublishAuditsForFounder(): SocialPublishAudit[] {
  return read();
}

export function clearPublishAudits() {
  write([]);
}
