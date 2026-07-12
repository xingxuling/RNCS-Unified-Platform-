import { APP_SAFETY_RULES, APP_SAFETY_FOOTER } from "@/constants/app-runtime/appSafetyRules";
import type { AppProjectObject } from "./appProjectObjectEngine";

export interface AppSafetyVerdict {
  ok: boolean;
  notes: string[];
  blocking: string[];
}

export function checkAppRuntimeSafety(project: AppProjectObject): AppSafetyVerdict {
  const notes: string[] = [APP_SAFETY_FOOTER];
  const blocking: string[] = [];
  for (const f of project.codeFiles) {
    if (/\beval\s*\(|new Function\s*\(/.test(f.content)) blocking.push(`${f.path} 含 eval / new Function`);
    if (/(password|api[_-]?key|access[_-]?token|secret)\s*[:=]/i.test(f.content))
      blocking.push(`${f.path} 似含敏感字段`);
  }
  for (const rule of APP_SAFETY_RULES) notes.push(`[${rule.severity}] ${rule.rule}`);
  return { ok: blocking.length === 0, notes, blocking };
}

export const APP_RUNTIME_SAFETY_FOOTER = APP_SAFETY_FOOTER;
