import type { TerminalMode } from "@/constants/terminal/terminalModes";
import type { TerminalPermissionLevel } from "@/constants/terminal/terminalPermissionLevels";

export type SubjectMode = "DEMO" | "REAL" | "FOUNDER";

export interface TerminalSession {
  mode: TerminalMode;
  subjectMode: SubjectMode;
  permission: TerminalPermissionLevel;
  language: "zh-CN" | "zh-TW" | "en" | "ja" | "ko" | "fr";
  full60Active: boolean;
  founderUnlocked: boolean;
}

export const DEFAULT_SESSION: TerminalSession = {
  mode: "ENGINE_TERMINAL",
  subjectMode: "DEMO",
  permission: "USER_LOCAL",
  language: "zh-CN",
  full60Active: false,
  founderUnlocked: false,
};

export function deriveSession(opts: {
  founderUnlocked: boolean;
  beginner?: boolean;
  subjectMode?: SubjectMode;
  full60Active?: boolean;
  forceMode?: TerminalMode;
}): TerminalSession {
  const founder = opts.founderUnlocked;
  const subjectMode: SubjectMode = opts.subjectMode ?? (founder ? "FOUNDER" : "DEMO");
  const permission: TerminalPermissionLevel = founder
    ? "FOUNDER"
    : opts.beginner
      ? "PUBLIC_READ"
      : "ADVANCED";
  let mode: TerminalMode = "ENGINE_TERMINAL";
  if (opts.forceMode) mode = opts.forceMode;
  else if (founder) mode = "FOUNDER_TERMINAL";
  else if (opts.beginner) mode = "SAFE_READONLY_TERMINAL";

  return {
    mode,
    subjectMode,
    permission,
    language: "zh-CN",
    full60Active: !!opts.full60Active,
    founderUnlocked: founder,
  };
}

export function describeSession(s: TerminalSession): string {
  return `mode=${s.mode} subject=${s.subjectMode} permission=${s.permission} lang=${s.language} full60=${s.full60Active ? "on" : "off"} founder=${s.founderUnlocked ? "unlocked" : "locked"}`;
}
