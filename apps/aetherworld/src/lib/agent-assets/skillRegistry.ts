export type SkillReviewStatus = "DRAFT" | "REVIEWING" | "APPROVED" | "BLOCKED" | "DEPRECATED";
export type SkillSafetyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SkillFactory =
  | "PROJECT_INTAKE"
  | "MODEL_FACTORY"
  | "MATERIAL_FACTORY"
  | "TRAINING_FACTORY"
  | "FORECAST_FACTORY"
  | "CAPABILITY_MARKET"
  | "GOVERNANCE_AUDIT"
  | "APP_FORGE";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  factory: SkillFactory;
  requiredInputs: string[];
  outputs: string[];
  safetyLevel: SkillSafetyLevel;
  allowedActions: string[];
  forbiddenActions: string[];
  reviewStatus: SkillReviewStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  source?: {
    sourceType: "LOCAL" | "IMPORTED" | "SYSTEM";
    sourceName?: string;
    sourceUrl?: string;
    importedAt?: string;
    sourceSnapshotHash?: string;
  };
}

export interface SkillUseDecision {
  decision: "ALLOW" | "WARN" | "BLOCK";
  reasons: string[];
}

const KEY = "aether_agent_skill_registry_v1";

function read(): SkillDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SkillDefinition[]) : [];
  } catch {
    return [];
  }
}

function write(list: SkillDefinition[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function now() {
  return new Date().toISOString();
}

function normalizeAction(action: string) {
  return action.trim().toLowerCase();
}

function actionMatches(action: string, patterns: string[]) {
  const normalized = normalizeAction(action);
  return patterns.some((pattern) => {
    const p = normalizeAction(pattern);
    return p === "*" || normalized === p || normalized.includes(p);
  });
}

export function listSkills(): SkillDefinition[] {
  return read();
}

export function getSkill(id: string): SkillDefinition | null {
  return read().find((skill) => skill.id === id) ?? null;
}

export function saveSkill(input: Omit<SkillDefinition, "createdAt" | "updatedAt"> & Partial<Pick<SkillDefinition, "createdAt" | "updatedAt">>): SkillDefinition {
  const list = read();
  const existingIndex = list.findIndex((skill) => skill.id === input.id);
  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const entry: SkillDefinition = {
    ...input,
    createdAt: input.createdAt ?? existing?.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existingIndex >= 0) list[existingIndex] = entry;
  else list.unshift(entry);

  write(list);
  return entry;
}

export function deleteSkill(id: string) {
  write(read().filter((skill) => skill.id !== id));
}

export function updateSkillReviewStatus(id: string, reviewStatus: SkillReviewStatus) {
  const list = read();
  const item = list.find((skill) => skill.id === id);
  if (!item) return null;
  item.reviewStatus = reviewStatus;
  item.updatedAt = now();
  write(list);
  return item;
}

export function validateSkill(skill: SkillDefinition): string[] {
  const issues: string[] = [];
  if (!skill.id.trim()) issues.push("Skill id is required.");
  if (!skill.name.trim()) issues.push("Skill name is required.");
  if (!skill.description.trim()) issues.push("Skill description is required.");
  if (!skill.requiredInputs.length) issues.push("Skill must declare requiredInputs.");
  if (!skill.outputs.length) issues.push("Skill must declare outputs.");
  if (!skill.allowedActions.length) issues.push("Skill must declare allowedActions.");
  if (actionMatches("unrestricted", skill.allowedActions) || skill.allowedActions.includes("*")) {
    issues.push("Skill cannot request unrestricted allowedActions.");
  }
  if (skill.safetyLevel === "CRITICAL" && skill.reviewStatus === "APPROVED") {
    issues.push("CRITICAL skills require manual governance review before approval.");
  }
  return issues;
}

export function canUseSkill(skill: SkillDefinition, requestedAction: string): SkillUseDecision {
  const reasons: string[] = [];

  const validationIssues = validateSkill(skill);
  if (validationIssues.length) {
    return { decision: "BLOCK", reasons: validationIssues };
  }

  if (skill.reviewStatus === "BLOCKED" || skill.reviewStatus === "DEPRECATED") {
    return { decision: "BLOCK", reasons: [`Skill is ${skill.reviewStatus}.`] };
  }

  if ((skill.safetyLevel === "HIGH" || skill.safetyLevel === "CRITICAL") && skill.reviewStatus !== "APPROVED") {
    reasons.push(`${skill.safetyLevel} skill must be APPROVED before use.`);
  }

  if (actionMatches(requestedAction, skill.forbiddenActions)) {
    reasons.push(`Requested action is forbidden: ${requestedAction}`);
  }

  if (!actionMatches(requestedAction, skill.allowedActions)) {
    reasons.push(`Requested action is not explicitly allowed: ${requestedAction}`);
  }

  if (reasons.length) return { decision: "BLOCK", reasons };
  if (skill.reviewStatus !== "APPROVED") {
    return { decision: "WARN", reasons: [`Skill is ${skill.reviewStatus}, not APPROVED.`] };
  }

  return { decision: "ALLOW", reasons: ["Skill is approved and action is allowed."] };
}

export function seedDefaultSkills() {
  const existing = read();
  if (existing.some((skill) => skill.id === "skill_project_intake_v1")) return existing;

  const createdAt = now();
  const defaults: SkillDefinition[] = [
    {
      id: "skill_project_intake_v1",
      name: "Project Intake Skill",
      description: "Classify a project seed and map it to Aetherworld factories and missing layers.",
      factory: "PROJECT_INTAKE",
      requiredInputs: ["seedText"],
      outputs: ["seedType", "targetFactory", "growthStage", "missingLayers", "nextActions"],
      safetyLevel: "LOW",
      allowedActions: ["classify_seed", "suggest_missing_layers", "suggest_next_actions"],
      forbiddenActions: ["execute_code", "mutate_external_repo", "publish_market_package"],
      reviewStatus: "APPROVED",
      version: "1.0.0",
      createdAt,
      updatedAt: createdAt,
      tags: ["default", "intake", "planning"],
      source: { sourceType: "SYSTEM", sourceName: "Aetherworld default skill pack" },
    },
    {
      id: "skill_safety_audit_v1",
      name: "Safety Audit Skill",
      description: "Inspect Skill, Soul and Blueprint assets for unsafe actions and missing review gates.",
      factory: "GOVERNANCE_AUDIT",
      requiredInputs: ["asset"],
      outputs: ["decision", "warnings", "blockedReasons"],
      safetyLevel: "MEDIUM",
      allowedActions: ["audit_asset", "explain_risk", "block_unsafe_asset"],
      forbiddenActions: ["approve_critical_skill", "execute_code", "modify_permissions"],
      reviewStatus: "APPROVED",
      version: "1.0.0",
      createdAt,
      updatedAt: createdAt,
      tags: ["default", "safety", "audit"],
      source: { sourceType: "SYSTEM", sourceName: "Aetherworld default skill pack" },
    },
  ];

  const next = [...defaults, ...existing];
  write(next);
  return next;
}
