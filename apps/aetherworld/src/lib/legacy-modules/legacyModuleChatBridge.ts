// Legacy Module → Chat Bridge：识别用户对旧模块的查询意图，并构造结果卡数据。
import { LEGACY_MODULE_REGISTRY } from "./legacyModuleRegistry";
import { scanLegacyModules } from "./legacyModuleScanner";
import { topActivationCandidates } from "./legacyModulePriorityScorer";
import { getOrBuildBridgePlan } from "./legacyModuleBridgePlanner";
import type { LegacyModule, LegacyBridgePlan } from "./legacyModuleTypes";

export interface ChatLegacyModuleHit {
  module: LegacyModule;
  bridgePlan: LegacyBridgePlan;
}

export interface ChatLegacyInfo {
  /** 命中类型：list = 列举旧模块；module = 命中具体模块；priority = 优先激活建议；none = 无 */
  kind: "list" | "module" | "priority" | "duplicate" | "none";
  question: string;
  hits: ChatLegacyModuleHit[];
  summary: string;
  notes: string[];
}

const LIST_KEYWORDS = /(旧模块|老模块|历史模块|legacy|没接入|还有哪些模块|哪些模块没)/i;
const PRIORITY_KEYWORDS = /(优先激活|优先接入|先接哪些|优先级|哪些模块优先|下一步.*激活|缺.*层)/i;
const DUPLICATE_KEYWORDS = /(重复|合并|去重)/i;
const BRIDGE_KEYWORDS = /(怎么接|如何接|接到哪|怎样接|接入计划|bridge|桥接)/i;

export function detectLegacyIntent(rawInput: string): boolean {
  const t = rawInput || "";
  if (LIST_KEYWORDS.test(t) || PRIORITY_KEYWORDS.test(t) || DUPLICATE_KEYWORDS.test(t)) return true;
  // 命中具体模块名
  return LEGACY_MODULE_REGISTRY.some((m) =>
    t.includes(m.cnName) || t.toLowerCase().includes(m.name.toLowerCase()),
  );
}

function matchSpecificModules(rawInput: string): LegacyModule[] {
  const t = rawInput || "";
  const hits: LegacyModule[] = [];
  for (const m of LEGACY_MODULE_REGISTRY) {
    if (t.includes(m.cnName) || t.toLowerCase().includes(m.name.toLowerCase())) {
      hits.push(m);
    }
  }
  return hits;
}

export function buildChatLegacyInfo(rawInput: string): ChatLegacyInfo | undefined {
  if (!rawInput) return undefined;
  if (!detectLegacyIntent(rawInput)) return undefined;

  const notes: string[] = [];
  const specific = matchSpecificModules(rawInput);

  // 命中具体模块
  if (specific.length > 0) {
    const isBridgeQuery = BRIDGE_KEYWORDS.test(rawInput);
    const hits = specific.map((m) => ({ module: m, bridgePlan: getOrBuildBridgePlan(m) }));
    return {
      kind: "module",
      question: rawInput,
      hits,
      summary: isBridgeQuery
        ? `已为 ${specific.length} 个旧模块生成 Bridge Plan 草案。`
        : `识别到 ${specific.length} 个旧模块，已附接入建议。`,
      notes: ["仅为结构化建议，未自动激活；接入前请在「旧模块激活图谱」复核。"],
    };
  }

  // 优先激活查询
  if (PRIORITY_KEYWORDS.test(rawInput)) {
    const top = topActivationCandidates(5).map((s) => ({
      module: s.module,
      bridgePlan: getOrBuildBridgePlan(s.module),
    }));
    return {
      kind: "priority",
      question: rawInput,
      hits: top,
      summary: `按当前评分，建议先激活以下 ${top.length} 个旧模块。`,
      notes: ["评分依据：优先级 + 可接系统数 + 推荐动作；不构成自动执行命令。"],
    };
  }

  // 重复 / 合并查询
  if (DUPLICATE_KEYWORDS.test(rawInput)) {
    const dup = LEGACY_MODULE_REGISTRY.filter((m) => m.recommendedAction === "MERGE" || m.currentStatus === "DUPLICATE");
    const hits = dup.map((m) => ({ module: m, bridgePlan: getOrBuildBridgePlan(m) }));
    return {
      kind: "duplicate",
      question: rawInput,
      hits,
      summary: dup.length > 0 ? `识别到 ${dup.length} 个可能重复 / 可合并模块。` : "目前未识别到重复模块。",
      notes: ["合并需人工复核，避免破坏已有页面。"],
    };
  }

  // 列举所有未接入 / 部分接入
  const scan = scanLegacyModules();
  const pending = LEGACY_MODULE_REGISTRY
    .filter((m) => m.currentStatus !== "ACTIVE")
    .slice(0, 12);
  notes.push(
    `共 ${scan.total} 个旧模块；ACTIVE ${scan.byStatus.ACTIVE || 0}，PARTIAL ${scan.byStatus.PARTIAL || 0}，PLACEHOLDER ${scan.byStatus.PLACEHOLDER || 0}。`,
  );
  return {
    kind: "list",
    question: rawInput,
    hits: pending.map((m) => ({ module: m, bridgePlan: getOrBuildBridgePlan(m) })),
    summary: `当前共 ${scan.total} 个旧模块，未完全激活 ${pending.length} 个。`,
    notes,
  };
}
