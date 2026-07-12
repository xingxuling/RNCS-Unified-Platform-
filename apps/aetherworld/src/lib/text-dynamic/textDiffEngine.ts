// Text Diff Engine — see spec §8
import { getText, TEXT_REGISTRY } from "./textRegistry";
import { generateTextCandidate } from "./textGenerationEngine";

export interface TextDiff {
  textId: string;
  oldText: string;
  newText: string;
  changedParts: string[];
  changeReason: string;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresReview: boolean;
}

function tokenDiff(a: string, b: string): string[] {
  if (a === b) return [];
  const aw = new Set(a.split(/\s+|，|。|、|；|;|,|\./));
  const bw = b.split(/\s+|，|。|、|；|;|,|\./);
  return bw.filter((w) => w && !aw.has(w));
}

export function buildDiff(textId: string): TextDiff | null {
  const entry = getText(textId);
  if (!entry) return null;
  const gen = generateTextCandidate({ textId });
  const changedParts = tokenDiff(gen.oldText, gen.newText);
  const requiresReview =
    entry.priority === "CRITICAL"
    || entry.subjectModeSensitivity === "FULL60_AWARE"
    || entry.moduleId === "sequence-currency"
    || entry.moduleId === "system-constitution";

  return {
    textId,
    oldText: gen.oldText,
    newText: gen.newText,
    changedParts,
    changeReason: gen.reason,
    impactLevel: entry.priority,
    requiresReview,
  };
}

export function buildDiffsForStale(): TextDiff[] {
  const ids = TEXT_REGISTRY.filter((x) => x.stale).map((x) => x.textId);
  return ids.map((id) => buildDiff(id)).filter((d): d is TextDiff => d !== null);
}
