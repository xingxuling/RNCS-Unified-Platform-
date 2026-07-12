// Global Recalculation Engine · 总重新计算算法
//
// 职责：
//  - 跟踪每个派生模块的"最新计算时间"
//  - 当上游数据变化时，把下游模块标记为 stale
//  - 提供 recalculate(scope) 接口：按依赖图顺序刷新派生状态
//  - 写入重算日志，供 Recalculation Center / QA / Beta / Version 读取
//
// 安全：不删除原始数列、不删除回验、不污染 Demo / Real / Subject 之间的数据。
// 计算细节：本引擎不重写已有计算法，而是触发"刷新信号" + 让消费者订阅 / 重新读取。

import {
  RECALC_MODULES,
  SCOPE_MODULES,
  type RecalcModuleId,
  type RecalculationScopeId,
} from "@/constants/recalculationScopes";
import {
  RECALCULATION_TRIGGERS,
  type RecalculationTriggerId,
} from "@/constants/recalculationTriggers";
import type { RecalculationStatusId } from "@/constants/recalculationStatus";
import { emitDataChange } from "./store";

// ─────────────────────── types ───────────────────────

export interface ModuleRecalcState {
  moduleId: RecalcModuleId;
  status: "clean" | "stale";
  /** 上次重算完成时间（ISO） */
  lastRecalculatedAt?: string;
  /** 上次被标记 stale 的触发 */
  lastStaleTrigger?: RecalculationTriggerId;
  /** 错误信息（如果失败） */
  error?: string;
}

export interface RecalculationLog {
  id: string;
  triggeredBy: RecalculationTriggerId;
  scope: RecalculationScopeId;
  startedAt: string;
  completedAt?: string;
  affectedModules: RecalcModuleId[];
  beforeSummary: string;
  afterSummary: string;
  warnings: string[];
  errors: string[];
  status: RecalculationStatusId;
}

export interface GlobalRecalcSnapshot {
  /** 派生模块 → 状态 */
  modules: Record<RecalcModuleId, ModuleRecalcState>;
  /** 整体状态 */
  overall: RecalculationStatusId;
  /** stale 模块数 */
  staleCount: number;
  /** 总数 */
  totalCount: number;
  /** 整体完整度 0–100 */
  integrity: number;
  /** 最近一次日志 */
  latestLog?: RecalculationLog;
}

// ─────────────────────── storage ───────────────────────

const K_STATE = "aether.recalcState.v1";
const K_LOGS = "aether.recalculationLogs.v1";

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readState(): Record<RecalcModuleId, ModuleRecalcState> {
  if (!isClient()) return defaultState();
  try {
    const raw = window.localStorage.getItem(K_STATE);
    if (!raw) return defaultState();
    const obj = JSON.parse(raw);
    // 补齐缺失的模块（系统新增模块时不破坏旧存储）
    const merged = defaultState();
    for (const id of Object.keys(merged) as RecalcModuleId[]) {
      if (obj[id]) merged[id] = obj[id];
    }
    return merged;
  } catch {
    return defaultState();
  }
}

function writeState(state: Record<RecalcModuleId, ModuleRecalcState>) {
  if (!isClient()) return;
  window.localStorage.setItem(K_STATE, JSON.stringify(state));
}

function defaultState(): Record<RecalcModuleId, ModuleRecalcState> {
  const out: Partial<Record<RecalcModuleId, ModuleRecalcState>> = {};
  for (const id of Object.keys(RECALC_MODULES) as RecalcModuleId[]) {
    out[id] = { moduleId: id, status: "clean" };
  }
  return out as Record<RecalcModuleId, ModuleRecalcState>;
}

export function loadLogs(): RecalculationLog[] {
  if (!isClient()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(K_LOGS) ?? "[]");
  } catch {
    return [];
  }
}

function writeLogs(logs: RecalculationLog[]) {
  if (!isClient()) return;
  // 仅保留最近 100 条
  window.localStorage.setItem(K_LOGS, JSON.stringify(logs.slice(0, 100)));
}

// ─────────────────────── dependency math ───────────────────────

/** 给定一组"已变化"的模块，向下传播标记所有依赖它们的模块为 stale */
function transitiveDownstream(seeds: RecalcModuleId[]): RecalcModuleId[] {
  const ids = Object.keys(RECALC_MODULES) as RecalcModuleId[];
  const out = new Set<RecalcModuleId>(seeds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      const deps = RECALC_MODULES[id].dependsOn;
      if (!out.has(id) && deps.some((d) => out.has(d))) {
        out.add(id);
        changed = true;
      }
    }
  }
  return Array.from(out);
}

/** 按依赖拓扑排序（上游优先） */
function topoOrder(ids: RecalcModuleId[]): RecalcModuleId[] {
  const set = new Set(ids);
  const visited = new Set<RecalcModuleId>();
  const out: RecalcModuleId[] = [];
  function visit(id: RecalcModuleId) {
    if (visited.has(id) || !set.has(id)) return;
    visited.add(id);
    for (const d of RECALC_MODULES[id].dependsOn) visit(d);
    out.push(id);
  }
  ids.forEach(visit);
  return out;
}

// ─────────────────────── public API ───────────────────────

/** 标记一组模块过期。常被业务代码调用。 */
export function markStale(trigger: RecalculationTriggerId, seeds: RecalcModuleId[]) {
  const state = readState();
  const all = transitiveDownstream(seeds);
  const now = new Date().toISOString();
  for (const id of all) {
    state[id] = {
      ...state[id],
      status: "stale",
      lastStaleTrigger: trigger,
      lastStaleAt: now,
    } as ModuleRecalcState & { lastStaleAt?: string };
  }
  writeState(state);
  emitDataChange();
}

/** 根据 trigger 自动推导受影响的模块并标记 stale */
export function recordTrigger(trigger: RecalculationTriggerId) {
  const scope = RECALCULATION_TRIGGERS[trigger].defaultScope;
  markStale(trigger, SCOPE_MODULES[scope]);
}

/** 取整体快照 */
export function getSnapshot(): GlobalRecalcSnapshot {
  const state = readState();
  const ids = Object.keys(state) as RecalcModuleId[];
  const stale = ids.filter((id) => state[id].status === "stale").length;
  const total = ids.length;
  const integrity = total === 0 ? 100 : Math.round(((total - stale) / total) * 100);

  let overall: RecalculationStatusId;
  if (stale === 0) overall = "CLEAN";
  else if (stale === total) overall = "STALE";
  else overall = "PARTIALLY_STALE";

  const logs = loadLogs();
  const latest = logs[0];
  if (latest && latest.status === "RECALCULATING") overall = "RECALCULATING";
  if (latest && latest.status === "FAILED" && stale > 0) overall = "FAILED";

  return {
    modules: state,
    overall,
    staleCount: stale,
    totalCount: total,
    integrity,
    latestLog: latest,
  };
}

/**
 * 执行重算。
 * 不真正重写计算 — 通过清理 stale 标记 + emitDataChange 触发所有 useAetherData 订阅者重读。
 */
export async function recalculate(
  trigger: RecalculationTriggerId,
  scope: RecalculationScopeId,
  options?: {
    beforeSummary?: string;
    afterSummary?: string;
    warnings?: string[];
    /** 高风险（隔离冲突 / 删除主体后仍残留旧预测） */
    needsReview?: boolean;
  },
): Promise<RecalculationLog> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const seeds = SCOPE_MODULES[scope];
  const affected = topoOrder(transitiveDownstream(seeds));

  const startingLog: RecalculationLog = {
    id,
    triggeredBy: trigger,
    scope,
    startedAt,
    affectedModules: affected,
    beforeSummary: options?.beforeSummary ?? "重算开始：清理旧派生状态。",
    afterSummary: "",
    warnings: options?.warnings ?? [],
    errors: [],
    status: "RECALCULATING",
  };
  writeLogs([startingLog, ...loadLogs()]);
  emitDataChange();

  try {
    const state = readState();
    const now = new Date().toISOString();
    for (const m of affected) {
      state[m] = {
        moduleId: m,
        status: "clean",
        lastRecalculatedAt: now,
      };
    }
    writeState(state);

    const completedAt = new Date().toISOString();
    const final: RecalculationLog = {
      ...startingLog,
      completedAt,
      afterSummary:
        options?.afterSummary ??
        `已刷新 ${affected.length} 个派生模块（范围：${scope}）。`,
      status: options?.needsReview ? "NEEDS_REVIEW" : "COMPLETED",
    };
    const logs = loadLogs();
    logs[0] = final;
    writeLogs(logs);
    emitDataChange();
    return final;
  } catch (e) {
    const final: RecalculationLog = {
      ...startingLog,
      completedAt: new Date().toISOString(),
      afterSummary: "重算失败，已保留旧状态。",
      errors: [String((e as Error)?.message ?? e)],
      status: "FAILED",
    };
    const logs = loadLogs();
    logs[0] = final;
    writeLogs(logs);
    emitDataChange();
    return final;
  }
}

/** 重置整个重算追踪（仅清理重算元数据，不动用户数据） */
export function resetRecalcTracking() {
  if (!isClient()) return;
  window.localStorage.removeItem(K_STATE);
  window.localStorage.removeItem(K_LOGS);
  emitDataChange();
}

/** 是否处于"应阻断 v1.0 标记"的状态 — 供 Version Iteration 调用 */
export function recalcBlocksV1(): { blocked: boolean; reason?: string } {
  const snap = getSnapshot();
  if (snap.overall === "STALE" || snap.overall === "PARTIALLY_STALE") {
    return { blocked: true, reason: `存在 ${snap.staleCount} 个过期模块。` };
  }
  if (snap.overall === "FAILED") {
    return { blocked: true, reason: "最近一次重算失败，需先解决后再标记 v1.0。" };
  }
  return { blocked: false };
}

/** QA：是否存在状态漂移 issue（Prediction Detail 模块过期等） */
export function recalcQAIssues(): { driftCritical: boolean; missingLogs: boolean } {
  const snap = getSnapshot();
  return {
    driftCritical: snap.modules.prediction_detail.status === "stale",
    missingLogs: loadLogs().length === 0,
  };
}

/** Beta：估计 stale 对 Beta 的影响 */
export function recalcBetaImpact(): {
  staleHurtsFeedbackLoop: boolean;
  isolationStateClean: boolean;
} {
  const snap = getSnapshot();
  return {
    staleHurtsFeedbackLoop: snap.modules.feedback_weight.status === "stale",
    isolationStateClean: snap.modules.isolation_state.status === "clean",
  };
}
