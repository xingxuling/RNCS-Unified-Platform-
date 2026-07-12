// Text Weight Impact Analyzer — see spec §4
import type { TextTriggerType } from "@/constants/text-dynamic/textTriggerTypes";
import { TEXT_REGISTRY } from "./textRegistry";

export interface TextWeightImpactInput {
  triggerType: TextTriggerType;
  affectedModuleIds?: string[];
  changedWeights?: Record<string, number>;
  changedConstants?: string[];
  changedConstitutionArticles?: string[];
  changedRoutes?: string[];
  changedUserModes?: string[];
}

export interface TextWeightImpactResult {
  affectedTextIds: string[];
  affectedScopes: string[];
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  recommendedUpdateStrategy: string;
}

const TRIGGER_SCOPES: Record<TextTriggerType, string[]> = {
  ENGINE_ADDED: ["sidebar.labels", "home.quickstart", "quickstart.public", "quickstart.advanced", "learningDocs.summaries"],
  ENGINE_UPDATED: ["sidebar.labels", "quickstart.public", "learningDocs.summaries"],
  ROUTE_ADDED: ["sidebar.labels", "home.quickstart"],
  ROUTE_CHANGED: ["sidebar.labels"],
  UI_LAYOUT_CHANGED: ["home.hero", "home.quickstart", "sidebar.labels", "emptyStates.core"],
  QUICK_START_CHANGED: ["home.quickstart", "quickstart.public", "quickstart.advanced", "quickstart.founder", "emptyStates.core", "tooltip.core"],
  SUBJECT_MODE_CHANGED: ["subjectMode.badges", "sequenceAi.headers", "safetyNotes.core", "permission.notes"],
  CONSTANT_UPDATED: ["constantUniverse.descriptions", "safetyNotes.core"],
  CONSTITUTION_UPDATED: ["constitution.descriptions", "safetyNotes.core", "permission.notes"],
  SAFETY_RULE_UPDATED: ["safetyNotes.core", "permission.notes"],
  PERMISSION_RULE_UPDATED: ["permission.notes", "sidebar.labels"],
  WORLD_ENGINE_VERSION_UPDATED: ["worldEngine.descriptions", "quickstart.public", "learningDocs.summaries", "export.descriptions", "safetyNotes.core"],
  WEIGHT_CHANGED: ["quickstart.public", "quickstart.advanced", "home.quickstart"],
  MODULE_PRIORITY_CHANGED: ["sidebar.labels", "home.quickstart"],
  USAGE_EXAMPLE_UPDATED: ["quickstart.public", "emptyStates.core", "learningDocs.summaries"],
  DOCS_UPDATED: ["learningDocs.summaries", "tooltip.core"],
  AUDIT_RESULT_CHANGED: ["audit.explanations"],
  LOCALIZATION_CHANGED: [],
};

const TRIGGER_LEVELS: Record<TextTriggerType, TextWeightImpactResult["impactLevel"]> = {
  ENGINE_ADDED: "HIGH", ENGINE_UPDATED: "MEDIUM",
  ROUTE_ADDED: "MEDIUM", ROUTE_CHANGED: "MEDIUM",
  UI_LAYOUT_CHANGED: "HIGH", QUICK_START_CHANGED: "HIGH",
  SUBJECT_MODE_CHANGED: "CRITICAL", CONSTANT_UPDATED: "HIGH",
  CONSTITUTION_UPDATED: "CRITICAL", SAFETY_RULE_UPDATED: "CRITICAL",
  PERMISSION_RULE_UPDATED: "HIGH", WORLD_ENGINE_VERSION_UPDATED: "HIGH",
  WEIGHT_CHANGED: "MEDIUM", MODULE_PRIORITY_CHANGED: "MEDIUM",
  USAGE_EXAMPLE_UPDATED: "MEDIUM", DOCS_UPDATED: "LOW",
  AUDIT_RESULT_CHANGED: "LOW", LOCALIZATION_CHANGED: "MEDIUM",
};

export function analyzeImpact(input: TextWeightImpactInput): TextWeightImpactResult {
  const scopes = TRIGGER_SCOPES[input.triggerType] ?? [];
  const affectedTextIds = new Set<string>();

  for (const entry of TEXT_REGISTRY) {
    if (scopes.includes(entry.scope)) affectedTextIds.add(entry.textId);
    if (input.affectedModuleIds?.includes(entry.moduleId)) affectedTextIds.add(entry.textId);
    if (input.changedRoutes && entry.route && input.changedRoutes.includes(entry.route)) affectedTextIds.add(entry.textId);
    if (input.changedConstants?.some((c) => entry.relatedConstants.includes(c))) affectedTextIds.add(entry.textId);
    if (input.changedConstitutionArticles?.some((a) => entry.relatedArticles.includes(a))) affectedTextIds.add(entry.textId);
  }

  const level = TRIGGER_LEVELS[input.triggerType] ?? "MEDIUM";
  return {
    affectedTextIds: Array.from(affectedTextIds),
    affectedScopes: scopes,
    impactLevel: level,
    reason: `触发器 ${input.triggerType} 影响 ${scopes.length} 个 scope，共 ${affectedTextIds.size} 条文本。`,
    recommendedUpdateStrategy:
      level === "CRITICAL" ? "立即进入 Review 队列，Founder 审核后发布。"
      : level === "HIGH" ? "生成候选文案并标记 stale，等待 Review。"
      : "标记 stale 即可，可自动生成候选。",
  };
}
