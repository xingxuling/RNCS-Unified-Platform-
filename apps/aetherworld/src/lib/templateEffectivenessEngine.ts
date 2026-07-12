// 模板有效性回验引擎 · Template Effectiveness Engine
import { PROMPT_TEMPLATE_FAMILIES } from "@/constants/promptTemplateFamilies";

export interface PromptTemplateUsage {
  id: string;
  templateFamilyId: string;
  domainId: string;
  generatedAt: string;
  targetTool: string;
  wasUsed: boolean;
  resultQuality: number;        // 0-100
  requiredManualFix: boolean;
  scopeDriftScore: number;      // 0-10
  outputMatchedGoal: boolean;
  userNotes?: string;
}

const KEY = "aether.promptTemplateUsage.v1";

export function loadUsage(): PromptTemplateUsage[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
export function saveUsage(items: PromptTemplateUsage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(-500)));
}
export function appendUsage(item: PromptTemplateUsage) {
  const all = loadUsage();
  all.push(item);
  saveUsage(all);
  return all;
}

export interface TemplateEffectivenessStats {
  templateFamilyId: string;
  domainId: string;
  uses: number;
  avgQuality: number;
  driftRate: number;       // 0-1
  manualFixRate: number;   // 0-1
  matchRate: number;       // 0-1
  effectivenessScore: number; // 0-100
}

export function computeEffectiveness(usage: PromptTemplateUsage[] = loadUsage()): TemplateEffectivenessStats[] {
  const map = new Map<string, PromptTemplateUsage[]>();
  usage.forEach((u) => {
    if (!u.wasUsed) return;
    if (!map.has(u.templateFamilyId)) map.set(u.templateFamilyId, []);
    map.get(u.templateFamilyId)!.push(u);
  });
  const out: TemplateEffectivenessStats[] = [];
  for (const tpl of PROMPT_TEMPLATE_FAMILIES) {
    const arr = map.get(tpl.id) ?? [];
    if (!arr.length) continue;
    const uses = arr.length;
    const avgQuality = arr.reduce((s, u) => s + u.resultQuality, 0) / uses;
    const driftRate = arr.reduce((s, u) => s + u.scopeDriftScore, 0) / (uses * 10);
    const manualFixRate = arr.filter((u) => u.requiredManualFix).length / uses;
    const matchRate = arr.filter((u) => u.outputMatchedGoal).length / uses;
    const effectivenessScore = Math.round(
      Math.max(0, Math.min(100,
        avgQuality * 0.6
        + matchRate * 30
        - driftRate * 100 * 0.2
        - manualFixRate * 30,
      ))
    );
    out.push({
      templateFamilyId: tpl.id, domainId: tpl.domainId,
      uses, avgQuality, driftRate, manualFixRate, matchRate, effectivenessScore,
    });
  }
  return out.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
}

export function effectivenessHintFor(templateFamilyId: string): number | undefined {
  const stats = computeEffectiveness();
  return stats.find((s) => s.templateFamilyId === templateFamilyId)?.effectivenessScore;
}
