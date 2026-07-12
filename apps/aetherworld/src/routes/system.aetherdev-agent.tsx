// AetherDev AGI · 自进化开发总脑 · 页面
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  dryRunTypecheck,
  markRecorded,
  observeAndPlan,
  summarizeRun,
} from "@/lib/aetherdev-agent/aetherDevRuntime";
import {
  listDevRuns,
  saveDevRun,
  subscribeDevRuns,
} from "@/lib/aetherdev-agent/aetherDevStore";
import { describeLevel } from "@/lib/aetherdev-agent/aetherDevSafetyPolicy";
import type {
  DevAgentRun,
  DevAutomationLevel,
  DevPriority,
  DevTask,
  DevToolRecommendation,
} from "@/lib/aetherdev-agent/aetherDevTypes";

export const Route = createFileRoute("/system/aetherdev-agent")({
  head: () => ({
    meta: [
      { title: "自进化开发总脑 · Aetherworld" },
      {
        name: "description",
        content:
          "AetherDev AGI：观察项目状态、生成开发任务、桥接 Codex / Cursor / VSCode、调用本地网关只读检查、写入记录与训练样本。",
      },
    ],
  }),
  component: AetherDevPage,
});

const PRIORITY_STYLE: Record<DevPriority, string> = {
  P0: "bg-red-500/15 text-red-500 border-red-500/30",
  P1: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  P2: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

const TOOL_LABEL: Record<DevToolRecommendation, string> = {
  CODEX: "Codex",
  CURSOR: "Cursor",
  VSCODE_MANUAL: "VSCode 手动",
  LOVABLE: "Lovable",
  CLOUD_AGI_ONLY: "云端 AGI",
  DEFER: "延后",
};

const TOOL_STYLE: Record<DevToolRecommendation, string> = {
  CODEX: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  CURSOR: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  VSCODE_MANUAL: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  LOVABLE: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30",
  CLOUD_AGI_ONLY: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  DEFER: "bg-muted text-muted-foreground border-border",
};

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-display mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function copy(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  }
}

function AetherDevPage() {
  const [runs, setRuns] = useState<DevAgentRun[]>(() => listDevRuns());
  const [selectedId, setSelectedId] = useState<string | null>(runs[0]?.id ?? null);
  const [level, setLevel] = useState<DevAutomationLevel>(runs[0]?.automationLevel ?? "L3");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeDevRuns(() => setRuns(listDevRuns())), []);

  const selected = useMemo(
    () => runs.find((r) => r.id === selectedId) ?? runs[0],
    [runs, selectedId],
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTask: DevTask | undefined = useMemo(() => {
    if (!selected) return undefined;
    return selected.tasks.find((t) => t.id === activeTaskId) ?? selected.tasks[0];
  }, [selected, activeTaskId]);

  async function handleScan() {
    setBusy(true);
    const run = observeAndPlan({ level });
    setSelectedId(run.id);
    setActiveTaskId(run.tasks[0]?.id ?? null);
    setBusy(false);
  }

  async function handleTypecheck() {
    if (!selected) return;
    setBusy(true);
    await dryRunTypecheck(selected);
    setBusy(false);
  }

  function handleRecord() {
    if (!selected) return;
    markRecorded(selected, {
      bugAudit: true,
      recordCenter: true,
      trainingSampleId: `AETHERDEV-${selected.id}`,
    });
  }

  function handleLevelChange(next: DevAutomationLevel) {
    setLevel(next);
    if (selected) saveDevRun({ ...selected, automationLevel: next });
  }

  const summary = selected ? summarizeRun(selected) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            System · AetherDev AGI
          </div>
          <h1 className="text-2xl font-display">自进化开发总脑</h1>
          <p className="text-sm text-muted-foreground">
            观察项目状态 → 生成开发任务 → 桥接 Codex / Cursor / VSCode → 调用本地网关只读检查 → 写入记录与训练样本。
            默认 L3 权限，不写文件、不删文件、不部署。
          </p>
        </header>

        {/* 顶部状态条 */}
        {selected && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="项目根" value={selected.snapshot.projectRoot} />
            <StatCard
              label="本地网关"
              value={selected.snapshot.localGateway.statusLabel}
              hint={selected.snapshot.localGateway.note}
            />
            <StatCard
              label="上次 tsc"
              value={selected.snapshot.lastTypecheck?.status ?? "未运行"}
              hint={selected.snapshot.lastTypecheck?.summary}
            />
            <StatCard
              label="页面完整度"
              value={`${selected.snapshot.pageCompleteness.ready}/${selected.snapshot.pageCompleteness.total}`}
              hint={`占位 ${selected.snapshot.pageCompleteness.placeholder}｜缺失 ${selected.snapshot.pageCompleteness.pageMissing}`}
            />
            <StatCard
              label="Bug 数"
              value={selected.snapshot.bugAudit.total}
              hint={`阻断 ${selected.snapshot.bugAudit.blockers}｜高 ${selected.snapshot.bugAudit.high}`}
            />
            <StatCard label="开发任务" value={summary?.total ?? 0} hint={`高风险 ${summary?.highRisk ?? 0}`} />
          </section>
        )}

        {/* 操作区 */}
        <section className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleScan}
            disabled={busy}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            扫描并生成任务
          </button>
          <button
            onClick={handleTypecheck}
            disabled={busy || !selected}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            运行 tsc --noEmit（只读）
          </button>
          <button
            onClick={handleRecord}
            disabled={!selected}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            写入 Bug Audit / Record / 训练样本
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">权限：</span>
            <select
              value={level}
              onChange={(e) => handleLevelChange(e.target.value as DevAutomationLevel)}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              {(["L0", "L1", "L2", "L3", "L4", "L5", "L6"] as DevAutomationLevel[]).map((l) => (
                <option key={l} value={l}>
                  {describeLevel(l)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {!selected && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            尚未生成任何运行记录，点击「扫描并生成任务」开始第一次自进化扫描。
          </div>
        )}

        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 左：任务队列 */}
            <aside className="lg:col-span-4 space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">开发任务队列</h2>
              {selected.tasks.length === 0 && (
                <div className="rounded border border-border p-3 text-xs text-muted-foreground">
                  项目当前无可自动识别的开发缺口。
                </div>
              )}
              <ul className="space-y-2">
                {selected.tasks.map((t) => {
                  const active = activeTask?.id === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveTaskId(t.id)}
                        className={`w-full text-left rounded border p-3 text-sm transition ${
                          active ? "border-foreground bg-accent" : "border-border hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Pill className={PRIORITY_STYLE[t.priority]}>{t.priority}</Pill>
                          <Pill className={TOOL_STYLE[t.cost.recommendedTool]}>
                            {TOOL_LABEL[t.cost.recommendedTool]}
                          </Pill>
                          <Pill className="bg-muted text-muted-foreground border-border">{t.issueType}</Pill>
                          <Pill className="bg-muted text-muted-foreground border-border">{t.riskLevel}</Pill>
                        </div>
                        <div className="mt-1.5 font-medium">{t.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{t.reason}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* 中：任务详情 */}
            <main className="lg:col-span-5 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">任务详情</h2>
              {activeTask ? (
                <div className="space-y-3">
                  <div className="rounded border border-border p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill className={PRIORITY_STYLE[activeTask.priority]}>{activeTask.priority}</Pill>
                      <Pill className={TOOL_STYLE[activeTask.cost.recommendedTool]}>
                        {TOOL_LABEL[activeTask.cost.recommendedTool]}
                      </Pill>
                      <Pill className="bg-muted text-muted-foreground border-border">{activeTask.issueType}</Pill>
                      <Pill className="bg-muted text-muted-foreground border-border">{activeTask.riskLevel}</Pill>
                    </div>
                    <div className="font-medium">{activeTask.title}</div>
                    <div className="text-xs text-muted-foreground">{activeTask.reason}</div>
                  </div>

                  <Detail title="期望改动">{activeTask.expectedChange}</Detail>
                  <Detail title="目标文件">
                    {activeTask.targetFiles.length ? (
                      <ul className="list-disc pl-5 text-xs">
                        {activeTask.targetFiles.map((f) => (
                          <li key={f}><code>{f}</code></li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">（未确定，由执行者根据原因定位）</span>
                    )}
                  </Detail>
                  <Detail title="验收标准">
                    <ol className="list-decimal pl-5 text-xs space-y-0.5">
                      {activeTask.acceptanceTests.map((t, i) => <li key={i}>{t}</li>)}
                    </ol>
                  </Detail>

                  <Detail
                    title="成本裁决"
                    extra={
                      <span className="text-[11px] text-muted-foreground">
                        建议工具：{TOOL_LABEL[activeTask.cost.recommendedTool]}
                      </span>
                    }
                  >
                    <div className="grid grid-cols-4 gap-2 text-[11px]">
                      <CostBar label="Lovable" level={activeTask.cost.lovableCostRisk} />
                      <CostBar label="Codex" level={activeTask.cost.codexCostRisk} />
                      <CostBar label="API" level={activeTask.cost.apiCostRisk} />
                      <CostBar label="人工" level={activeTask.cost.manualCost} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{activeTask.cost.reason}</div>
                  </Detail>

                  <PromptBlock title="Codex Prompt" text={activeTask.codexPrompt} />
                  <PromptBlock title="Cursor Prompt" text={activeTask.cursorPrompt} />
                  <Detail title="VSCode 操作步骤" extra={
                    <button onClick={() => copy(activeTask.vscodeSteps.join("\n"))} className="text-[11px] underline">
                      复制
                    </button>
                  }>
                    <ol className="list-decimal pl-5 text-xs space-y-0.5">
                      {activeTask.vscodeSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </Detail>
                </div>
              ) : (
                <div className="rounded border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  暂无任务详情。
                </div>
              )}
            </main>

            {/* 右：执行与记录 */}
            <aside className="lg:col-span-3 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">执行与记录</h2>
              <div className="rounded border border-border p-3 space-y-2">
                <div className="text-xs font-medium">命令检查</div>
                {selected.checks.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">尚未运行任何检查命令。</div>
                ) : (
                  <ul className="space-y-1">
                    {selected.checks.map((c) => (
                      <li key={c.id} className="text-[11px]">
                        <div className="flex items-center gap-2">
                          <Pill className={
                            c.status === "PASS" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : c.status === "FAIL" ? "bg-red-500/15 text-red-500 border-red-500/30"
                            : "bg-muted text-muted-foreground border-border"
                          }>
                            {c.status}
                          </Pill>
                          <code>{c.command}</code>
                        </div>
                        <div className="text-muted-foreground mt-0.5">{c.outputSummary}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded border border-border p-3 space-y-1.5 text-xs">
                <div className="font-medium">写入状态</div>
                <div>Bug Audit：{selected.recordedToBugAudit ? "已写入" : "未写入"}</div>
                <div>记录中心：{selected.recordedToRecordCenter ? "已写入" : "未写入"}</div>
                <div>训练样本：{selected.trainingSampleId ? selected.trainingSampleId : "未生成"}</div>
              </div>

              <div className="rounded border border-border p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="font-medium text-foreground">安全声明</div>
                <div>默认不写文件、不删除文件、不部署。</div>
                <div>仅允许只读命令：tsc / lint / test / build / route-check。</div>
                <div>高风险任务自动标记为 NEEDS_CONFIRMATION。</div>
              </div>
            </aside>
          </div>
        )}

        {/* 历史运行 */}
        {runs.length > 1 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">历史运行</h2>
            <ul className="space-y-1 text-xs">
              {runs.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded border border-border px-2 py-1.5 hover:bg-accent ${
                      r.id === selected?.id ? "bg-accent" : ""
                    }`}
                  >
                    {new Date(r.createdAt).toLocaleString()}｜任务 {r.tasks.length}｜{r.status}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Detail({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-border p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        {extra}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PromptBlock({ title, text }: { title: string; text: string }) {
  return (
    <Detail
      title={title}
      extra={
        <button onClick={() => copy(text)} className="text-[11px] underline">
          复制
        </button>
      }
    >
      <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/90 max-h-48 overflow-auto">
        {text}
      </pre>
    </Detail>
  );
}

function CostBar({ label, level }: { label: string; level: "LOW" | "MEDIUM" | "HIGH" }) {
  const map = {
    LOW: { w: "w-1/4", c: "bg-emerald-500" },
    MEDIUM: { w: "w-1/2", c: "bg-yellow-500" },
    HIGH: { w: "w-full", c: "bg-red-500" },
  } as const;
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="h-1.5 mt-1 rounded bg-muted overflow-hidden">
        <div className={`h-full ${map[level].w} ${map[level].c}`} />
      </div>
      <div className="text-[10px] mt-0.5">{level}</div>
    </div>
  );
}
