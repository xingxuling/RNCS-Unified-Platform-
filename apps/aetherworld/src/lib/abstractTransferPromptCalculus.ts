// 抽象迁移化提示词计算引擎 · Abstract Transfer Prompt Calculus Engine
import { clamp } from "./math";
import { PROMPT_DOMAINS, findDomain } from "@/constants/promptDomains";
import {
  PROMPT_TEMPLATE_FAMILIES, findTemplate, type PromptTemplateFamily,
} from "@/constants/promptTemplateFamilies";
import { TEMPLATE_FAMILY_META, type TemplateFamilyType } from "@/constants/promptTemplateTypes";
import { findPattern, type TransferPattern } from "@/constants/promptTransferPatterns";
import { rulesFor } from "@/constants/promptSafetyRules";
import type { UserLanguageLevel } from "@/constants/userLanguageLevels";

export interface AbstractPromptInput {
  productName: string;
  targetUser: string;
  currentVersion: string;
  problem: string;
  goal: string;
  constraints: string;
  region: string;
  languageLevel: UserLanguageLevel;
  riskBoundary: string;
  desiredOutput: string;
  existingModules: string;
  doNotBreak: string;
  acceptanceCriteria: string;

  sourceDomainId: string;
  targetDomainId: string;
  transferPatternId?: string;
  templateFamilyId?: string; // 显式指定，否则按推荐选

  targetTool: "Lovable" | "Codex" | "Cursor" | "Claude" | "GPT" | "Other";
  // 系统状态信号（可选）
  qaIssueCount?: number;
  staleScore?: number;        // 0-100，越大越过期
  betaReady?: boolean;
  effectivenessHint?: number; // 来自回验权重 0-100
  scopeDrift?: number;        // 0-10
  cognitiveOverload?: number; // 0-10
  missingContext?: number;    // 0-10
  domainMismatch?: number;    // 0-10
}

export interface AbstractPromptResult {
  power: number;
  pattern?: TransferPattern;
  template: PromptTemplateFamily;
  alternatives: PromptTemplateFamily[];
  whyThisTemplate: string;
  scopeBoundary: string;
  safetyNotes: string[];
  finalPrompt: string;
  factors: Record<string, number>;
}

function factor(v: number) {
  return clamp(v, 0, 10);
}

function pickTemplate(input: AbstractPromptInput): { tpl: PromptTemplateFamily; reason: string; alternatives: PromptTemplateFamily[] } {
  if (input.templateFamilyId) {
    const tpl = findTemplate(input.templateFamilyId);
    if (tpl) {
      return {
        tpl,
        reason: "用户显式选择该模板族。",
        alternatives: PROMPT_TEMPLATE_FAMILIES.filter((t) => t.domainId === tpl.domainId && t.id !== tpl.id),
      };
    }
  }
  // 根据迁移模式推荐 outputPromptType
  const pattern = input.transferPatternId ? findPattern(input.transferPatternId) : undefined;
  const targetDomainId = input.targetDomainId || pattern?.targetDomain || input.sourceDomainId;
  const family: TemplateFamilyType = (pattern?.outputPromptType as TemplateFamilyType) ?? guessFamilyFromGoal(input);
  const id = `${targetDomainId}.${family}`;
  const tpl = findTemplate(id) ?? PROMPT_TEMPLATE_FAMILIES[0];
  const alternatives = PROMPT_TEMPLATE_FAMILIES.filter((t) => t.domainId === targetDomainId && t.id !== tpl.id);
  const reason = pattern
    ? `根据迁移模式「${pattern.name}」推荐 ${TEMPLATE_FAMILY_META[family].cn}（目标领域：${findDomain(targetDomainId)?.name ?? targetDomainId}）。`
    : `根据目标领域 ${findDomain(targetDomainId)?.name ?? targetDomainId} 与目标关键词，推荐 ${TEMPLATE_FAMILY_META[family].cn}。`;
  return { tpl, reason, alternatives };
}

function guessFamilyFromGoal(input: AbstractPromptInput): TemplateFamilyType {
  const g = `${input.goal} ${input.problem}`.toLowerCase();
  if (/(修|fix|bug|漂移|错位|repair)/.test(g)) return "DEBUG_REPAIR";
  if (/(重构|refactor|降级|文案|copy|ux|界面|user)/.test(g)) return "UX_USER_FACING";
  if (/(战略|定位|路径|路线|strategy|roadmap)/.test(g)) return "STRATEGY";
  if (/(回验|验证|测试|test|validate|feedback)/.test(g)) return "VALIDATION_FEEDBACK";
  if (/(扩展|新增|增量|expansion|add)/.test(g)) return "EXPANSION";
  return "FOUNDATION";
}

function injectVariables(skeleton: string, input: AbstractPromptInput): string {
  const vars: Record<string, string> = {
    productName: input.productName || "（未指定产品）",
    targetUser: input.targetUser || "（未指定用户）",
    currentVersion: input.currentVersion || "未知",
    problem: input.problem || "（未列出问题）",
    goal: input.goal || "（未指定目标）",
    constraints: input.constraints || "（无显式约束）",
    region: input.region || "全球",
    languageLevel: input.languageLevel,
    riskBoundary: input.riskBoundary || "遵守通用安全边界",
    desiredOutput: input.desiredOutput || "可执行提示词与文件清单",
    existingModules: input.existingModules || "（按当前仓库结构）",
    doNotBreak: input.doNotBreak || "已上线功能与安全边界",
    acceptanceCriteria: input.acceptanceCriteria || "可手动验证且不破坏既有行为",
  };
  return skeleton.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function runAbstractPromptCalculus(input: AbstractPromptInput): AbstractPromptResult {
  const { tpl, reason, alternatives } = pickTemplate(input);
  const pattern = input.transferPatternId ? findPattern(input.transferPatternId) : undefined;
  const sourceDomain = findDomain(input.sourceDomainId);
  const targetDomain = findDomain(input.targetDomainId);

  // 因子（0-10）
  const domainMatch         = factor(targetDomain ? 9 : 4);
  const structAbstraction   = factor(pattern ? 8 : 6);
  const transferDistanceFit = factor(pattern ? 8 : (sourceDomain && targetDomain && sourceDomain.id !== targetDomain.id ? 6 : 7));
  const templateFamilyFit   = factor(tpl.curated ? 9 : 7);
  const requiredCount = tpl.requiredInputs.length;
  const filled = tpl.requiredInputs.filter((k) => {
    const v = (input as unknown as Record<string, unknown>)[k];
    return typeof v === "string" && (v as string).trim().length > 0;
  }).length;
  const variableCompleteness = factor((filled / Math.max(1, requiredCount)) * 10);
  const outputClarity        = factor(input.desiredOutput ? 8 : 4);
  const userLangFit          = factor(input.languageLevel ? 8 : 5);
  const provenEffectiveness  = factor((input.effectivenessHint ?? 60) / 10);

  const domainMismatch    = factor(input.domainMismatch ?? (pattern ? 1 : 3));
  const scopeDrift        = factor(input.scopeDrift ?? 3);
  const missingContext    = factor(input.missingContext ?? (filled === requiredCount ? 1 : 4));
  const cognitiveOverload = factor(input.cognitiveOverload ?? (input.languageLevel === "RAW_SYSTEM" ? 6 : 3));
  const stalePenalty      = factor((input.staleScore ?? 0) / 10);
  const safetyRisk        = factor(tpl.safetyRules.length > 0 ? 2 : 1);

  const num = (domainMatch+1)*(structAbstraction+1)*(transferDistanceFit+1)
    *(templateFamilyFit+1)*(variableCompleteness+1)*(outputClarity+1)
    *(userLangFit+1)*(provenEffectiveness+1);
  const den = Math.max(1, domainMismatch)*Math.max(1, scopeDrift)
    *Math.max(1, missingContext)*Math.max(1, cognitiveOverload)
    *Math.max(1, safetyRisk)*Math.max(1, stalePenalty + 1);

  const power = Math.round(clamp(Math.log10(num/den + 1) * 14, 0, 100));

  const langDirective = languageDirective(input.languageLevel);
  const safetyNotes = tpl.safetyRules.length
    ? tpl.safetyRules
    : rulesFor(input.targetDomainId).map((r) => r.cn);

  const scopeBoundary = scopeDrift >= 6
    ? "强约束范围：本轮只允许处理与目标直接相关的模块。"
    : "保持范围聚焦，不引入与目标无关的新功能。";

  const compiled = injectVariables(tpl.defaultPromptSkeleton, input);

  const final = [
    `# 目标工具：${input.targetTool}`,
    `# 源领域：${sourceDomain?.name ?? input.sourceDomainId}（${sourceDomain?.en ?? ""}）`,
    `# 目标领域：${targetDomain?.name ?? input.targetDomainId}（${targetDomain?.en ?? ""}）`,
    pattern ? `# 迁移模式：${pattern.name}（${pattern.en}）` : "",
    `# 模板族：${tpl.name}（${tpl.en}） · ${TEMPLATE_FAMILY_META[tpl.familyType].cn}`,
    `# 用户语言层级：${input.languageLevel}`,
    ``,
    `## 抽象迁移步骤`,
    ...(pattern?.abstractionSteps ?? ["抽取结构","映射目标","注入变量","形成执行提示词"]).map((s, i) => `${i+1}. ${s}`),
    ``,
    `## 提示词主体`,
    compiled,
    ``,
    `## 范围`,
    `- ${scopeBoundary}`,
    `- ${langDirective}`,
    ``,
    `## 安全边界`,
    ...safetyNotes.map((s) => `- ${s}`),
    `- 保留：已上线模块 / 回验入口 / Demo·Real 隔离 / 安全边界文案。`,
    ``,
    `## 验证`,
    `请在完成后给出：可手动验证的 3 个步骤、需要回验的指标、潜在风险窗口。`,
  ].filter(Boolean).join("\n");

  return {
    power,
    pattern,
    template: tpl,
    alternatives,
    whyThisTemplate: reason,
    scopeBoundary,
    safetyNotes,
    finalPrompt: final,
    factors: {
      domainMatch, structAbstraction, transferDistanceFit,
      templateFamilyFit, variableCompleteness, outputClarity,
      userLangFit, provenEffectiveness,
      domainMismatch, scopeDrift, missingContext,
      cognitiveOverload, safetyRisk, stalePenalty,
    },
  };
}

function languageDirective(level: UserLanguageLevel): string {
  switch (level) {
    case "MICROCOPY":       return "输出以极短提示为主，避免长段落，适配移动端。";
    case "USER_FRIENDLY":   return "使用普通用户语言；高阶术语首次出现需 tooltip；禁用：分支塌缩 / 风域奇点。";
    case "ENTERPRISE_SAFE": return "使用企业安全语言，去命运化；不出现术语化预测话术。";
    case "EDUCATIONAL":     return "解释关键概念，可附定义与示例。";
    case "ACTION_ORIENTED": return "聚焦下一步行动，避免抽象描述。";
    case "RAW_SYSTEM":      return "可使用系统原名术语，面向研究 / Admin。";
    case "PROFESSIONAL":
    default:                return "使用专业产品语言，保持收敛与可执行。";
  }
}

export const TARGET_TOOLS = ["Lovable","Codex","Cursor","Claude","GPT","Other"] as const;
export const DOMAINS_FOR_SELECT = PROMPT_DOMAINS;
