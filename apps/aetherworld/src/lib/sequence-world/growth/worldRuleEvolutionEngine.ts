import type { WorldRuleType, WorldRuleAction } from "@/constants/sequence-world/growth/worldRuleTypes";

export interface WorldRule {
  ruleId: string;
  worldId: string;
  name: string;
  description: string;
  ruleType: WorldRuleType;
  sourceSequence?: string;
  sourceEvent?: string;
  active: boolean;
  version: string;
  constraints: string[];
  createdAt: string;
  updatedAt: string;
  founderLocked?: boolean;
}

const KEY = "aether.world.growth.rules.v1";

export function loadRules(worldId?: string): WorldRule[] {
  try {
    const v = localStorage.getItem(KEY);
    const all: WorldRule[] = v ? JSON.parse(v) : [];
    return worldId ? all.filter(r => r.worldId === worldId) : all;
  } catch { return []; }
}

function saveRules(rules: WorldRule[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rules.slice(-500))); } catch {}
}

export interface RuleEvolutionInput {
  action: WorldRuleAction;
  worldId: string;
  rule?: Partial<WorldRule>;
  ruleId?: string;
  isFounder?: boolean;
}

export interface RuleEvolutionResult {
  ok: boolean;
  rule?: WorldRule;
  message: string;
}

export function applyRuleEvolution(input: RuleEvolutionInput): RuleEvolutionResult {
  const all = loadRules();
  const now = new Date().toISOString();
  const target = input.ruleId ? all.find(r => r.ruleId === input.ruleId) : undefined;

  if (target?.founderLocked && !input.isFounder && input.action !== "CREATE_RULE") {
    return { ok: false, message: "该规则已被 Founder 锁定，普通用户不可修改。" };
  }

  switch (input.action) {
    case "CREATE_RULE": {
      const r: WorldRule = {
        ruleId: `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        worldId: input.worldId,
        name: input.rule?.name ?? "未命名规则",
        description: input.rule?.description ?? "",
        ruleType: (input.rule?.ruleType as WorldRuleType) ?? "NARRATIVE",
        sourceSequence: input.rule?.sourceSequence,
        sourceEvent: input.rule?.sourceEvent,
        active: true,
        version: "v0.1",
        constraints: input.rule?.constraints ?? [],
        createdAt: now,
        updatedAt: now,
      };
      saveRules([...all, r]);
      return { ok: true, rule: r, message: "规则已新增。" };
    }
    case "UPGRADE_RULE": {
      if (!target) return { ok: false, message: "规则不存在。" };
      const next: WorldRule = { ...target, ...input.rule, version: bumpVersion(target.version), updatedAt: now };
      saveRules(all.map(r => r.ruleId === target.ruleId ? next : r));
      return { ok: true, rule: next, message: "规则已升级。" };
    }
    case "DEPRECATE_RULE": {
      if (!target) return { ok: false, message: "规则不存在。" };
      const next = { ...target, active: false, updatedAt: now };
      saveRules(all.map(r => r.ruleId === target.ruleId ? next : r));
      return { ok: true, rule: next, message: "规则已废弃。" };
    }
    case "ARCHIVE_RULE": {
      if (!target) return { ok: false, message: "规则不存在。" };
      const next = { ...target, active: false, updatedAt: now };
      saveRules(all.map(r => r.ruleId === target.ruleId ? next : r));
      return { ok: true, rule: next, message: "规则已归档。" };
    }
    case "CONFLICT_RESOLVE_RULE": {
      if (!target) return { ok: false, message: "规则不存在。" };
      const next = { ...target, constraints: [...target.constraints, "已修复冲突"], updatedAt: now };
      saveRules(all.map(r => r.ruleId === target.ruleId ? next : r));
      return { ok: true, rule: next, message: "规则冲突已修复。" };
    }
    case "FOUNDER_LOCK_RULE": {
      if (!input.isFounder) return { ok: false, message: "仅 Founder 可锁定规则。" };
      if (!target) return { ok: false, message: "规则不存在。" };
      const next = { ...target, founderLocked: true, updatedAt: now };
      saveRules(all.map(r => r.ruleId === target.ruleId ? next : r));
      return { ok: true, rule: next, message: "规则已 Founder 锁定。" };
    }
  }
}

function bumpVersion(v: string): string {
  const m = v.match(/^v?(\d+)\.(\d+)$/);
  if (!m) return "v0.2";
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

export function suggestRulesFromState(worldId: string, signals: {
  eventSpam?: boolean; npcConflictHigh?: boolean; resourceInflated?: boolean;
}): Array<Partial<WorldRule>> {
  const out: Array<Partial<WorldRule>> = [];
  if (signals.eventSpam) out.push({ name: "事件节流规则", description: "每个 tick 最多一个主事件。", ruleType: "NARRATIVE", constraints: ["maxMainEventPerTick=1"] });
  if (signals.npcConflictHigh) out.push({ name: "关系前因规则", description: "关系冲突必须有至少一个可回验前因。", ruleType: "SOCIAL", constraints: ["requireCausalCause=true"] });
  if (signals.resourceInflated) out.push({ name: "资源记账规则", description: "世界资源必须有 inflow/outflow 记录。", ruleType: "ECONOMIC", constraints: ["requireResourceLedger=true"] });
  return out;
}
