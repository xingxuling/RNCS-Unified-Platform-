import { SUBJECT_MODES, type SubjectModeId } from "@/constants/subject/subjectModes";
import { PRIVACY_LEVEL_BY_MODE, type PrivacyLevel } from "@/constants/subject/subjectPrivacyRules";

export interface ActiveSubjectProfile {
  subjectMode: SubjectModeId;
  subjectId: string;
  displayName: string;
  sequenceCount: number;
  hasLight20: boolean;
  hasFull60: boolean;
  isFounder: boolean;
  privacyLevel: PrivacyLevel;
  source: "DEMO" | "USER_INPUT" | "IMPORTED" | "FOUNDER_LOCKED";
  lastUpdatedAt: string;
}

const MODE_KEY = "aether_active_subject_mode";
const STATUS_KEY = "aether_subject_profile_status";
const LAST_SUBJECT_KEY = "aether_last_subject_id";
const LIGHT20_KEY = "aether_subject_light20";
const FULL60_KEY = "aether_subject_full60";
const FOUNDER_KEY = "aether_subject_founder_enabled";

interface ProfileStatus {
  hasLight20: boolean;
  hasFull60: boolean;
  isFounder: boolean;
  displayName: string;
  subjectId: string;
  source: ActiveSubjectProfile["source"];
  lastUpdatedAt: string;
}

const DEFAULT_STATUS: ProfileStatus = {
  hasLight20: false,
  hasFull60: false,
  isFounder: false,
  displayName: "Demo Persona",
  subjectId: "demo-default",
  source: "DEMO",
  lastUpdatedAt: new Date(0).toISOString(),
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getProfileStatus(): ProfileStatus {
  return { ...DEFAULT_STATUS, ...readJSON<Partial<ProfileStatus>>(STATUS_KEY, {}) };
}

export function setProfileStatus(patch: Partial<ProfileStatus>) {
  const next = { ...getProfileStatus(), ...patch, lastUpdatedAt: new Date().toISOString() };
  writeJSON(STATUS_KEY, next);
  return next;
}

export function getStoredMode(): SubjectModeId | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(MODE_KEY);
  if (raw === "DEMO" || raw === "LIGHT_20" || raw === "FULL_60" || raw === "FOUNDER") return raw;
  return null;
}

export function setStoredMode(mode: SubjectModeId) {
  if (!isBrowser()) return;
  localStorage.setItem(MODE_KEY, mode);
}

export function getLastSubjectId(): string {
  if (!isBrowser()) return "demo-default";
  return localStorage.getItem(LAST_SUBJECT_KEY) ?? "demo-default";
}

export function setLastSubjectId(id: string) {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_SUBJECT_KEY, id);
}

export function saveLight20(sequences: string[]) {
  writeJSON(LIGHT20_KEY, sequences);
  setProfileStatus({ hasLight20: sequences.length >= 20, source: "USER_INPUT", displayName: "Light20 主体" });
}

export function saveFull60(sequences: string[]) {
  writeJSON(FULL60_KEY, sequences);
  setProfileStatus({ hasFull60: sequences.length >= 60, source: "USER_INPUT", displayName: "Full60 主体" });
}

export function readLight20(): string[] {
  return readJSON<string[]>(LIGHT20_KEY, []);
}

export function readFull60(): string[] {
  return readJSON<string[]>(FULL60_KEY, []);
}

export function clearRealSubject() {
  if (!isBrowser()) return;
  localStorage.removeItem(LIGHT20_KEY);
  localStorage.removeItem(FULL60_KEY);
  localStorage.removeItem(FOUNDER_KEY);
  localStorage.removeItem(STATUS_KEY);
  localStorage.setItem(MODE_KEY, "DEMO");
}

export function setFounderEnabled(enabled: boolean) {
  if (!isBrowser()) return;
  localStorage.setItem(FOUNDER_KEY, enabled ? "1" : "0");
  setProfileStatus({ isFounder: enabled });
}

export function isFounderEnabled(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(FOUNDER_KEY) === "1";
}

export function buildProfile(mode: SubjectModeId): ActiveSubjectProfile {
  const status = getProfileStatus();
  const meta = SUBJECT_MODES[mode];
  return {
    subjectMode: mode,
    subjectId: status.subjectId || getLastSubjectId(),
    displayName: status.displayName,
    sequenceCount: meta.sequenceCount,
    hasLight20: status.hasLight20,
    hasFull60: status.hasFull60,
    isFounder: status.isFounder,
    privacyLevel: PRIVACY_LEVEL_BY_MODE[mode],
    source: mode === "DEMO" ? "DEMO" : status.source === "DEMO" ? "USER_INPUT" : status.source,
    lastUpdatedAt: status.lastUpdatedAt,
  };
}
