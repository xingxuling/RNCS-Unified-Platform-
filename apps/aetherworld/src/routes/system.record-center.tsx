// 记录中心 · /system/record-center
// 入口位置：系统 → QA / 审计 / 完整导航（非一级导航）。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  EVENT_TYPE_LABEL,
  STATUS_LABEL,
  SAFETY_LABEL,
  type RecordEventType,
} from "@/lib/record-center/recordCenterTypes";
import {
  queryRecordEvents,
  getRecordCenterStats,
  subscribeRecordCenter,
} from "@/lib/record-center/recordCenterRuntime";

export const Route = createFileRoute("/system/record-center")({
  head: () => ({
    meta: [
      { title: "记录中心 — Aetherworld" },
      {
        name: "description",
        content:
          "Aetherworld 记录中心：统一事实记录层，为回验中心 / 记录权重 / 产品自进化提供原始事实来源。",
      },
      { property: "og:title", content: "记录中心 — Aetherworld" },
      {
        property: "og:description",
        content: "RecordEvent 总览、分类筛选、重要性与安全状态。",
      },
    ],
  }),
  component: RecordCenterPage,
});

const TYPES: (RecordEventType | "ALL")[] = [
  "ALL",
  "CHAT_MESSAGE",
  "MODEL_CALL",
  "FUSION_PLAN",
  "SEQUENCE_MEMORY_CREATED",
  "SEQUENCE_CURRENCY_EVENT",
  "MSL_STATE_FRAME",
  "PREDICTION_RESULT",
  "SCHEDULER_TASK",
  "WORKSPACE_OBJECT",
  "STORE_PACKAGE_USED",
  "CALENDAR_TRIGGER",
  "SOCIAL_ACTION",
  "QA_AUDIT",
  "LEGACY_MODULE_ACTION",
  "AGENT_RUN",
  "SEQUENCE_AI_RUN",
  "SYSTEM_EVENT",
];

function RecordCenterPage() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<RecordEventType | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => subscribeRecordCenter(() => setTick((t) => t + 1)), []);

  const stats = useMemo(() => getRecordCenterStats(), [tick]);
  const events = useMemo(
    () => queryRecordEvents({ eventType: filter, limit: 200 }),
    [filter, tick],
  );
  const recent10 = useMemo(() => queryRecordEvents({ limit: 10 }), [tick]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      {/* 顶部 */}
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            System / Aetherworld
          </div>
          <h1 className="text-xl font-semibold">记录中心</h1>
          <p className="text-xs text-muted-foreground mt-1">
            统一 RecordEvent 流；为回验中心 / 记录权重 / 产品自进化 / Analytics / Prediction 提供事实来源。
          </p>
        </div>
        <Link to="/system" className="text-xs text-primary hover:underline">
          ← 返回系统
        </Link>
      </header>

      {/* 总览 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="总记录数" value={stats.total} />
        <Stat label="今日记录" value={stats.today} />
        <Stat label="高重要记录" value={stats.highImportance} accent />
        <Stat label="WARN" value={stats.warnCount} accent={stats.warnCount > 0} />
        <Stat label="BLOCK" value={stats.blockCount} accent={stats.blockCount > 0} />
      </section>

      {/* 最近 10 条 */}
      <section className="rounded-lg border border-border/50 bg-card/40 p-4">
        <div className="text-sm font-medium mb-2">最近 10 条记录</div>
        {recent10.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            暂无记录。完成一次 Chat 对话或操作后会自动写入。
          </div>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {recent10.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 border-b border-border/20 pb-1.5 last:border-b-0 last:pb-0"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">[{EVENT_TYPE_LABEL[e.eventType]}]</span>{" "}
                  {e.title}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(e.createdAt).toLocaleTimeString("zh-CN")} · 重 {e.importance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 分类筛选 */}
      <section className="space-y-2">
        <div className="text-sm font-medium">分类筛选</div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {TYPES.map((t) => {
            const count = t === "ALL" ? stats.total : stats.byType[t as RecordEventType] || 0;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-1 rounded border ${
                  filter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 hover:bg-accent/20"
                }`}
              >
                {t === "ALL" ? "全部" : EVENT_TYPE_LABEL[t as RecordEventType]} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* 记录列表 */}
      <section className="space-y-2">
        <div className="text-sm font-medium">
          记录列表（{events.length}）
        </div>
        {events.length === 0 ? (
          <div className="rounded border border-border/40 bg-card/30 p-4 text-xs text-muted-foreground">
            该分类下暂无记录。
          </div>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => {
              const open = expanded === e.id;
              return (
                <li
                  key={e.id}
                  className="rounded border border-border/40 bg-card/40"
                >
                  <button
                    onClick={() => setExpanded(open ? null : e.id)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        {EVENT_TYPE_LABEL[e.eventType]}
                      </span>
                      <span className="text-xs font-medium truncate">{e.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                      <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
                      <Badge tone={safetyTone(e.safetyStatus)}>
                        安全 {SAFETY_LABEL[e.safetyStatus]}
                      </Badge>
                      <span className="text-muted-foreground">
                        重 {e.importance.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("zh-CN", {
                          hour12: false,
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </button>
                  {open && (
                    <div className="px-3 pb-3 space-y-1.5 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                      {e.summary && <div className="text-foreground/85">{e.summary}</div>}
                      <div>来源模块：{e.sourceModule}</div>
                      <div>
                        可信度 {e.confidence.toFixed(2)}
                        {e.qaStatus ? ` · QA ${e.qaStatus}` : ""}
                        {e.canVerify ? " · 可回验" : ""}
                      </div>
                      {e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {e.tags
                            .filter(Boolean)
                            .map((t, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded border border-border/40 text-[10px]"
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      )}
                      {Object.keys(e.relatedIds).length > 0 && (
                        <details className="rounded bg-muted/20 px-2 py-1">
                          <summary className="cursor-pointer">关联 ID</summary>
                          <pre className="mt-1 text-[10px] whitespace-pre-wrap">
                            {JSON.stringify(e.relatedIds, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="text-[10px] text-muted-foreground text-center pt-2">
        记录中心仅保存脱敏摘要；不保存 Key / Token / Full60 原文 / Founder-only 原文。
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/40"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "default" | "warn" | "block" | "ok"; children: React.ReactNode }) {
  const cls =
    tone === "block"
      ? "border-red-500/40 text-red-400"
      : tone === "warn"
      ? "border-amber-500/40 text-amber-400"
      : tone === "ok"
      ? "border-emerald-500/30 text-emerald-400"
      : "border-border/40 text-muted-foreground";
  return <span className={`px-1.5 py-0.5 rounded-full border ${cls}`}>{children}</span>;
}

function statusTone(s: string): "default" | "warn" | "block" | "ok" {
  if (s === "BLOCKED" || s === "FAILED") return "block";
  if (s === "WARN") return "warn";
  return "ok";
}
function safetyTone(s: string): "default" | "warn" | "block" | "ok" {
  if (s === "BLOCK") return "block";
  if (s === "WARN") return "warn";
  return "ok";
}
