// Aether Record Center · Chat 桥接：识别用户对「最近发生了什么」的查询
import { listEvents, getStats } from "./recordEventStore";
import type { RecordEvent } from "./recordCenterTypes";
import { EVENT_TYPE_LABEL } from "./recordCenterTypes";

export interface ChatRecordCenterInfo {
  kind: "recent" | "today" | "high" | "risk" | "module";
  question: string;
  summary: string;
  events: RecordEvent[];
  total: number;
  warnCount: number;
  blockCount: number;
  notes: string[];
}

const RECENT_KEYWORDS = /(最近|刚刚|刚才|刚做了|发生了什么|做了什么)/;
const TODAY_KEYWORDS = /(今天|今日|today)/i;
const HIGH_KEYWORDS = /(高重要|重要|高优先|关键事件)/;
const RISK_KEYWORDS = /(warn|block|失败|阻断|出错|风险事件|模型失败)/i;
const MODULE_KEYWORDS = /(哪些模块.*激活|哪些.*被激活|最近.*激活)/;

export function detectRecordIntent(rawInput: string): boolean {
  if (!rawInput) return false;
  return (
    RECENT_KEYWORDS.test(rawInput) ||
    TODAY_KEYWORDS.test(rawInput) ||
    HIGH_KEYWORDS.test(rawInput) ||
    RISK_KEYWORDS.test(rawInput) ||
    MODULE_KEYWORDS.test(rawInput) ||
    /记录中心|record\s*center/i.test(rawInput)
  );
}

export function buildChatRecordCenterInfo(rawInput: string): ChatRecordCenterInfo | undefined {
  if (!detectRecordIntent(rawInput)) return undefined;
  const stats = getStats();
  const notes: string[] = [];

  let kind: ChatRecordCenterInfo["kind"] = "recent";
  let events: RecordEvent[] = [];
  let summary = "";

  if (RISK_KEYWORDS.test(rawInput)) {
    kind = "risk";
    events = listEvents({ limit: 5 }).filter(
      (e) => e.status === "WARN" || e.status === "BLOCKED" || e.status === "FAILED" || e.safetyStatus !== "PASS",
    );
    summary = `最近共发现 ${events.length} 条风险记录（WARN/BLOCK/FAILED）。`;
  } else if (HIGH_KEYWORDS.test(rawInput)) {
    kind = "high";
    events = listEvents({ minImportance: 0.7, limit: 5 });
    summary = `最近共有 ${events.length} 条高重要记录（importance ≥ 0.7）。`;
  } else if (TODAY_KEYWORDS.test(rawInput)) {
    kind = "today";
    events = listEvents({ sinceMs: 24 * 60 * 60 * 1000, limit: 5 });
    summary = `今日共 ${stats.today} 条记录，展示最近 ${events.length} 条。`;
  } else if (MODULE_KEYWORDS.test(rawInput)) {
    kind = "module";
    events = listEvents({ eventType: "LEGACY_MODULE_ACTION", limit: 5 });
    summary = `最近 ${events.length} 条旧模块激活相关记录。`;
  } else {
    kind = "recent";
    events = listEvents({ limit: 5 });
    summary = `最近 ${events.length} 条记录（总计 ${stats.total} 条）。`;
  }

  if (stats.total === 0) {
    notes.push("当前记录中心尚无事件。完成一次对话或操作后会自动写入。");
  }
  if (stats.blockCount > 0) {
    notes.push(`累计阻断 ${stats.blockCount} 条；建议查看 /system/record-center。`);
  }

  return {
    kind,
    question: rawInput,
    summary,
    events,
    total: stats.total,
    warnCount: stats.warnCount,
    blockCount: stats.blockCount,
    notes,
  };
}

export { EVENT_TYPE_LABEL };
