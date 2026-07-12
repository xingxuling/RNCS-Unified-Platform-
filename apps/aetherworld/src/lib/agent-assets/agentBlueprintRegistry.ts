import { canUseSkill, getSkill, type SkillDefinition } from "./skillRegistry";
import { getSoulProfile, validateSoulProfile, type SoulProfile } from "./soulProfileRegistry";

export type BlueprintReviewStatus = "DRAFT" | "REVIEWING" | "APPROVED" | "BLOCKED" | "DEPRECATED";
export type BlueprintPreflightDecision = "PASS" | "WARN" | "BLOCK";
export type BlueprintTargetFactory =
  | "PROJECT_INTAKE"
  | "MODEL_FACTORY"
  | "MATERIAL_FACTORY"
  | "TRAINING_FACTORY"
  | "FORECAST_FACTORY"
  | "CAPABILITY_MARKET"
  | "GOVERNANCE_AUDIT"
  | "APP_FORGE"
  | "AUTONOMOUS_FACTORY";

export interface AgentBlueprint {
  id: string;
  name: string;
  description: string;
  sourceSeedIds: string[];
  skillIds: string[];
  soulProfileId: string;
  targetFactory: BlueprintTargetFactory;
  requestedActions: string[];
  permissions: string[];
  reviewStatus: BlueprintReviewStatus;
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

export interface BlueprintPreflightReport {
  decision: BlueprintPreflightDecision;
  blueprintId: string;
  skillReports: Array<{
    skillId: string;
    action: string;
    decision: "ALLOW" | "WARN" | "BLOCK";
    reasons: string[];
  }>;
  soulReport: {
    soulProfileId: string;
    exists: boolean;
    decision: "PASS" | "WARN" | "BLOCK";
    warnings: string[];
    blockedReasons: string[];
  };
  warnings: string[];
  blockedReasons: string[];
}

const KEY = "aether_agent_blueprint_registry_v1";

function read(): AgentBlueprint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgentBlueprint[]) : [];
  } catch {
    return [];
  }
}

function write(list: AgentBlueprint[]) {
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

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function resolveSkills(skillIds: string[]): { skills: SkillDefinition[]; missing: string[] } {
  const skills: SkillDefinition[] = [];
  const missing: string[] = [];
  for (const id of unique(skillIds)) {
    const skill = getSkill(id);
    if (skill) skills.push(skill);
    else missing.push(id);
  }
  return { skills, missing };
}

function resolveSoulProfile(id: string): SoulProfile | null {
  return getSoulProfile(id);
}

export function listAgentBlueprints(): AgentBlueprint[] {
  return read();
}

export function getAgentBlueprint(id: string): AgentBlueprint | null {
  return read().find((blueprint) => blueprint.id === id) ?? null;
}

export function saveAgentBlueprint(
  input: Omit<AgentBlueprint, "createdAt" | "updatedAt"> & Partial<Pick<AgentBlueprint, "createdAt" | "updatedAt">>,
): AgentBlueprint {
  const list = read();
  const existingIndex = list.findIndex((blueprint) => blueprint.id === input.id);
  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const entry: AgentBlueprint = {
    ...input,
    sourceSeedIds: unique(input.sourceSeedIds),
    skillIds: unique(input.skillIds),
    requestedActions: unique(input.requestedActions),
    permissions: unique(input.permissions),
    createdAt: input.createdAt ?? existing?.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existingIndex >= 0) list[existingIndex] = entry;
  else list.unshift(entry);

  write(list);
  return entry;
}

export function deleteAgentBlueprint(id: string) {
  write(read().filter((blueprint) => blueprint.id !== id));
}

export function updateAgentBlueprintReviewStatus(id: string, reviewStatus: BlueprintReviewStatus) {
  const list = read();
  const item = list.find((blueprint) => blueprint.id === id);
  if (!item) return null;
  item.reviewStatus = reviewStatus;
  item.updatedAt = now();
  write(list);
  return item;
}

export function runBlueprintPreflight(blueprint: AgentBlueprint): BlueprintPreflightReport {
  const warnings: string[] = [];
  const blockedReasons: string[] = [];
  const skillReports: BlueprintPreflightReport["skillReports"] = [];

  if (!blueprint.id.trim()) blockedReasons.push("Blueprint id is required.");
  if (!blueprint.name.trim()) blockedReasons.push("Blueprint name is required.");
  if (!blueprint.skillIds.length) blockedReasons.push("Blueprint must link at least one skill.");
  if (!blueprint.soulProfileId.trim()) blockedReasons.push("Blueprint must link one SoulProfile.");
  if (!blueprint.requestedActions.length) warnings.push("Blueprint has no requestedActions; it can only be previewed.");

  if (blueprint.reviewStatus === "BLOCKED" || blueprint.reviewStatus === "DEPRECATED") {
    blockedReasons.push(`Blueprint is ${blueprint.reviewStatus}.`);
  }

  const { skills, missing } = resolveSkills(blueprint.skillIds);
  if (missing.length) {
    blockedReasons.push(`Missing linked skills: ${missing.join(", ")}.`);
  }

  for (const action of blueprint.requestedActions) {
    let anyAllowed = false;
    for (const skill of skills) {
      const decision = canUseSkill(skill, action);
      skillReports.push({
        skillId: skill.id,
        action,
        decision: decision.decision,
        reasons: decision.reasons,
      });
      if (decision.decision === "ALLOW" || decision.decision === "WARN") anyAllowed = true;
      if (decision.decision === "BLOCK") {
        warnings.push(`Skill ${skill.id} blocked or warned for action ${action}: ${decision.reasons.join("; ")}`);
      }
    }
    if (!anyAllowed) blockedReasons.push(`No linked skill can perform requested action: ${action}.`);
  }

  const soul = resolveSoulProfile(blueprint.soulProfileId);
  const soulValidation = soul
    ? validateSoulProfile(soul)
    : { decision: "BLOCK" as const, warnings: [], blockedReasons: ["Linked SoulProfile not found."] };

  if (soulValidation.decision === "BLOCK") {
    blockedReasons.push(...soulValidation.blockedReasons);
  } else if (soulValidation.decision === "WARN") {
    warnings.push(...soulValidation.warnings);
  }

  if (blueprint.permissions.some((permission) => permission.trim() === "*" || permission.toLowerCase().includes("unrestricted"))) {
    blockedReasons.push("Blueprint cannot request unrestricted permissions.");
  }

  const decision: BlueprintPreflightDecision = blockedReasons.length ? "BLOCK" : warnings.length ? "WARN" : "PASS";

  return {
    decision,
    blueprintId: blueprint.id,
    skillReports,
    soulReport: {
      soulProfileId: blueprint.soulProfileId,
      exists: Boolean(soul),
      decision: soulValidation.decision,
      warnings: soulValidation.warnings,
      blockedReasons: soulValidation.blockedReasons,
    },
    warnings,
    blockedReasons,
  };
}

export function seedDefaultAgentBlueprints() {
  const existing = read();
  if (existing.some((blueprint) => blueprint.id === "blueprint_project_intake_operator_v1")) return existing;

  const createdAt = now();
  const defaults: AgentBlueprint[] = [
    {
      id: "blueprint_project_intake_operator_v1",
      name: "Project Intake Operator Blueprint",
      description: "A read-only agent blueprint for classifying project seeds and producing missing-layer plans.",
      sourceSeedIds: [],
      skillIds: ["skill_project_intake_v1", "skill_safety_audit_v1"],
      soulProfileId: "soul_aetherworld_operator_v1",
      targetFactory: "PROJECT_INTAKE",
      requestedActions: ["classify_seed", "suggest_missing_layers", "suggest_next_actions"],
      permissions: ["read_input", "write_local_preview"],
      reviewStatus: "DRAFT",
      version: "1.0.0",
      createdAt,
      updatedAt: createdAt,
      tags: ["default", "intake", "blueprint"],
      source: { sourceType: "SYSTEM", sourceName: "Aetherworld default blueprint pack" },
    },
  ];

  const next = [...defaults, ...existing];
  write(next);
  return next;
}
