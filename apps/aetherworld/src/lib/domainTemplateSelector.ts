// 领域模板选择器 · Domain Template Selector
import {
  PROMPT_TEMPLATE_FAMILIES, templatesByDomain, type PromptTemplateFamily,
} from "@/constants/promptTemplateFamilies";
import type { TemplateFamilyType } from "@/constants/promptTemplateTypes";
import { findDomain } from "@/constants/promptDomains";

export interface SelectorContext {
  domainId: string;
  goal: string;
  problem?: string;
  targetTool?: string;
  region?: string;
  languageLevel?: string;
  qaIssueCount?: number;
  staleScore?: number;
  betaReady?: boolean;
  eventStage?: "SEED"|"FORMING"|"TRIGGERED"|"BLOCKED"|"REVERSED"|"ARCHIVED";
  determinationStatus?: string;
}

export interface SelectorOutput {
  recommendedDomainId: string;
  recommendedTemplateFamily: TemplateFamilyType;
  template: PromptTemplateFamily;
  confidence: number; // 0-100
  whyThisTemplate: string;
  alternativeTemplates: PromptTemplateFamily[];
}

function familyByEvent(stage?: SelectorContext["eventStage"]): TemplateFamilyType | undefined {
  switch (stage) {
    case "SEED":      return "FOUNDATION";
    case "FORMING":   return "EXPANSION";
    case "TRIGGERED": return "EXPANSION";
    case "BLOCKED":   return "DEBUG_REPAIR";
    case "REVERSED":  return "STRATEGY";
    case "ARCHIVED":  return "VALIDATION_FEEDBACK";
    default:          return undefined;
  }
}

function familyByGoal(goal: string, problem?: string): TemplateFamilyType {
  const g = `${goal} ${problem ?? ""}`.toLowerCase();
  if (/(修|fix|bug|漂移|repair|错位)/.test(g)) return "DEBUG_REPAIR";
  if (/(回验|验证|测试|test|feedback)/.test(g)) return "VALIDATION_FEEDBACK";
  if (/(战略|定位|路径|strategy|roadmap)/.test(g)) return "STRATEGY";
  if (/(文案|copy|ux|界面|降级|user)/.test(g)) return "UX_USER_FACING";
  if (/(扩展|新增|expansion|add)/.test(g)) return "EXPANSION";
  return "FOUNDATION";
}

export function recommendTemplate(ctx: SelectorContext): SelectorOutput {
  const reasons: string[] = [];
  let family: TemplateFamilyType | undefined;

  if (ctx.staleScore && ctx.staleScore > 60) {
    family = "DEBUG_REPAIR";
    reasons.push(`系统状态过期分 ${ctx.staleScore}，优先生成修复 / 同步类提示词。`);
  } else if ((ctx.qaIssueCount ?? 0) > 0) {
    family = "DEBUG_REPAIR";
    reasons.push(`检测到 QA 未解决问题 ${ctx.qaIssueCount} 项，推荐修复模板。`);
  } else {
    const evFamily = familyByEvent(ctx.eventStage);
    if (evFamily) {
      family = evFamily;
      reasons.push(`事件阶段为 ${ctx.eventStage}，匹配 ${evFamily} 模板族。`);
    }
  }
  if (!family) {
    family = familyByGoal(ctx.goal, ctx.problem);
    reasons.push(`根据目标关键词推断为 ${family}。`);
  }

  const domain = findDomain(ctx.domainId);
  const tpl =
    PROMPT_TEMPLATE_FAMILIES.find((t) => t.domainId === ctx.domainId && t.familyType === family) ??
    PROMPT_TEMPLATE_FAMILIES[0];

  if (tpl.curated) reasons.push("命中核心预置模板。");

  const alternatives = templatesByDomain(ctx.domainId).filter((t) => t.id !== tpl.id);
  const confidence =
    50 + (tpl.curated ? 20 : 0) + (ctx.eventStage ? 10 : 0) +
    ((ctx.qaIssueCount ?? 0) > 0 ? 10 : 0) + (domain ? 5 : 0);

  return {
    recommendedDomainId: ctx.domainId,
    recommendedTemplateFamily: family,
    template: tpl,
    confidence: Math.min(100, confidence),
    whyThisTemplate: reasons.join(" "),
    alternativeTemplates: alternatives,
  };
}
