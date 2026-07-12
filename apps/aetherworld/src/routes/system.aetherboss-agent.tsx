import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  buildDailyReport,
  disableAgent,
  enableAgent,
  getLatestDecision,
  getLatestReport,
  getLatestRun,
  observe,
  planRecoveryForAllFailures,
  runOnce,
  startHeartbeat,
  stopHeartbeat,
  summarizeObservation,
  switchMode,
  LOCAL_DAEMON_ENDPOINTS,
} from "@/lib/aetherboss/aetherbossRuntime";
import {
  getAgentState,
  getSchedule,
  listDecisions,
  listRecoveryPlans,
  listRuns,
  subscribeAetherBoss,
} from "@/lib/aetherboss/aetherbossStore";
import {
  ACTION_LABEL,
  FACTORY_LABEL,
  MODE_LABEL,
  RECOVERY_LABEL,
  type AetherBossMode,
} from "@/lib/aetherboss/aetherbossTypes";
import {
  buildCompanyCard,
  buildMaterialCard,
  buildOverview,
  buildTrainingCard,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryRuntime";
import { listFactoryTasks } from "@/lib/aetherworld-autonomous-factory/autonomousFactoryStore";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/aetherboss-agent")({
  head: () => ({
    meta: [
      { title: "总策 Agent · Aetherworld" },
      {
        name: "description",
        content:
          "AetherBoss 长时间自动总策 Agent：观察 / 规划 / 半自动 / 无人值守 / 竞争模式，调度材料工厂、训练工厂、公司工厂，处理失败恢复，生成今日增长报告。",
      },
    ],
  }),
  component: AetherBossAgentPage,
});

const MODE_OPTIONS: { value: AetherBossMode; label: string; desc: string }[] = [
  { value: "OBSERVE_ONLY", label: MODE_LABEL.OBSERVE_ONLY, desc: "只读状态，不创建任务" },
  { value: "PLAN_ONLY", label: MODE_LABEL.PLAN_ONLY, desc: "生成任务草案，但不自动执行" },
  { value: "SEMI_AUTO", label: MODE_LABEL.SEMI_AUTO, desc: "可调度低风险动作，关键步骤需确认" },
  { value: "UNATTENDED", label: MODE_LABEL.UNATTENDED, desc: "在既定边界内自动调度三大工厂" },
  { value: "COMPETITION_MODE", label: MODE_LABEL.COMPETITION_MODE, desc: "优先抢用户 / 数据 / 资产" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm gap-3 py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function AetherBossAgentPage() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);

  useEffect(() => subscribeAetherBoss(refresh), []);

  const state = getAgentState();
  const schedule = getSchedule();
  const obs = observe();
  const latestRun = getLatestRun();
  const latestDecision = getLatestDecision();
  const latestReport = getLatestReport();
  const decisions = listDecisions().slice(0, 8);
  const runs = listRuns().slice(0, 6);
  const recoveries = listRecoveryPlans().slice(0, 6);

  const tasks = listFactoryTasks();
  const waiting = tasks.filter((t) => t.status === "WAITING");
  const running = tasks.filter((t) => t.status === "RUNNING");
  const completed = tasks.filter((t) => t.status === "COMPLETED").slice(0, 5);
  const failed = tasks.filter((t) => t.status === "FAILED");
  const needConfirm = tasks.filter((t) => t.status === "NEEDS_CONFIRMATION");

  const overview = useMemo(() => buildOverview(), [tasks.length]);
  const matCard = useMemo(() => buildMaterialCard(), [tasks.length]);
  const trainCard = useMemo(() => buildTrainingCard(false), [tasks.length]);
  const compCard = useMemo(() => buildCompanyCard(), [tasks.length]);

  useEffect(() => {
    if (state.enabled && schedule.enabled) {
      startHeartbeat();
      return () => stopHeartbeat();
    }
    stopHeartbeat();
  }, [state.enabled, schedule.enabled, schedule.intervalMinutes]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link to="/system" className="hover:text-foreground">系统</Link>
          <span>/</span>
          <span>总策 Agent</span>
        </div>
        <h1 className="text-2xl font-bold">总策 Agent · AetherBoss</h1>
        <p className="text-sm text-muted-foreground">
          无人工厂操作系统的老板层 / 总经理层。长期观察 Aetherworld 状态，自动调度材料 / 训练 / 公司工厂，追踪结果，处理失败，生成下一轮任务。
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          浏览器模式下长时间 Agent 依赖页面开启；本地守护模式下可长期运行（接口已预留，未真正启用）。
        </p>
      </header>

      <UnifiedGatewayStatusBar prefix="总策前置：" />



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Agent 状态">
          <Field label="是否启用" value={state.enabled ? "已启用" : "已暂停"} />
          <Field label="当前模式" value={MODE_LABEL[state.mode]} />
          <Field label="心跳频率" value={`${schedule.intervalMinutes} 分钟 / 次`} />
          <Field label="最近运行" value={state.lastRunAt ?? "尚未运行"} />
          <Field label="下次运行" value={state.nextRunAt ?? "—"} />
          <Field label="当前目标" value={state.currentGoal} />
          <Field label="今日观察" value={summarizeObservation(obs)} />

          <div className="pt-3 flex flex-wrap gap-2">
            {state.enabled ? (
              <button
                onClick={() => {
                  disableAgent();
                  refresh();
                }}
                className="px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted/70"
              >
                暂停 Agent
              </button>
            ) : (
              <button
                onClick={() => {
                  enableAgent();
                  refresh();
                }}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
              >
                启用 Agent
              </button>
            )}
            <button
              onClick={() => {
                runOnce();
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              运行一次总策决策
            </button>
            <button
              onClick={() => {
                buildDailyReport();
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              生成今日增长报告
            </button>
            <button
              onClick={() => {
                planRecoveryForAllFailures();
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              生成失败恢复计划
            </button>
          </div>

          <div className="pt-3">
            <div className="text-xs text-muted-foreground mb-2">切换模式</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODE_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    switchMode(m.value);
                    refresh();
                  }}
                  className={`text-left px-3 py-2 rounded border text-xs ${
                    state.mode === m.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="font-medium text-sm">{m.label}</div>
                  <div className="text-muted-foreground">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="工厂观察">
          <Field label="材料工厂 · 样本池" value={matCard.samplePool} />
          <Field label="材料工厂 · 数据集候选" value={matCard.sealedDatasets} />
          <Field label="训练工厂 · 当前任务" value={trainCard.activeRun} />
          <Field label="训练工厂 · 守护" value={trainCard.daemonStatus} />
          <Field label="公司工厂 · 商店草案" value={compCard.storeDrafts} />
          <Field label="公司工厂 · 能力包" value={compCard.assetCandidates} />
          <Field label="失败任务" value={overview.failed} />
          <Field label="今日新增任务" value={overview.todayCount} />
          <div className="pt-2 text-xs text-muted-foreground">
            下一步建议：{overview.nextSuggestion}
          </div>
          <div className="pt-2">
            <Link
              to="/system/autonomous-factory"
              className="text-xs underline text-primary"
            >
              打开无人工厂总控 →
            </Link>
          </div>
        </Section>
      </div>

      <Section title="当前任务队列">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
          <div className="rounded bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">待执行</div>
            <div className="text-lg font-semibold">{waiting.length}</div>
          </div>
          <div className="rounded bg-blue-500/10 p-3">
            <div className="text-xs text-muted-foreground">执行中</div>
            <div className="text-lg font-semibold">{running.length}</div>
          </div>
          <div className="rounded bg-emerald-500/10 p-3">
            <div className="text-xs text-muted-foreground">已完成</div>
            <div className="text-lg font-semibold">{completed.length}</div>
          </div>
          <div className="rounded bg-red-500/10 p-3">
            <div className="text-xs text-muted-foreground">失败</div>
            <div className="text-lg font-semibold">{failed.length}</div>
          </div>
          <div className="rounded bg-amber-500/10 p-3">
            <div className="text-xs text-muted-foreground">需确认</div>
            <div className="text-lg font-semibold">{needConfirm.length}</div>
          </div>
        </div>
      </Section>

      <Section title="Agent 决策日志">
        {decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚无决策。点击「运行一次总策决策」开始。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {decisions.map((d) => (
              <li key={d.id} className="rounded border border-border/60 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.createdAt}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">
                    优先级 {d.priority}
                  </span>
                </div>
                <div className="font-medium">
                  {FACTORY_LABEL[d.chosenFactory]} · {ACTION_LABEL[d.chosenAction]}
                </div>
                <div className="text-muted-foreground text-xs">观察：{d.observationSummary}</div>
                <div className="text-xs">原因：{d.reason}</div>
                <div className="text-xs">预期价值：{d.expectedValue}</div>
                {d.generatedTaskIds.length > 0 && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-300">
                    生成任务：{d.generatedTaskIds.length} 个
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="今日增长报告">
          {latestReport ? (
            <>
              <Field label="日期" value={latestReport.date} />
              <Field label="材料进度" value={latestReport.materialProgress} />
              <Field label="训练进度" value={latestReport.trainingProgress} />
              <Field label="公司进度" value={latestReport.companyProgress} />
              <Field label="系统健康" value={latestReport.systemHealth} />
              <Field label="新增样本" value={latestReport.generatedSamples} />
              <Field label="新增 token" value={latestReport.generatedTokens} />
              <Field label="新增资产" value={latestReport.generatedAssets} />
              <Field label="新增任务" value={latestReport.generatedTasks} />
              <Field label="完成 / 失败 / 恢复" value={`${latestReport.completedTasks} / ${latestReport.failedTasks} / ${latestReport.recoveredTasks}`} />
              <div className="pt-2 text-xs text-muted-foreground">
                战略提示：{latestReport.strategicWarning}
              </div>
              <div className="text-xs">
                下一步建议：
                <ul className="list-disc list-inside">
                  {latestReport.nextBestActions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">尚未生成今日报告。</p>
          )}
        </Section>

        <Section title="失败恢复中心">
          {recoveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前没有恢复计划。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recoveries.map((p) => (
                <li key={p.id} className="rounded border border-border/60 p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{p.createdAt}</span>
                    <span className="px-2 py-0.5 rounded bg-muted">
                      {RECOVERY_LABEL[p.kind]}
                    </span>
                  </div>
                  <div className="text-xs">
                    {p.autoRecoverable ? "可自动恢复" : "需要人工确认"}
                  </div>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground">
                    {p.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="最近运行">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚无运行记录。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {runs.map((r) => (
              <li key={r.id} className="rounded border border-border/60 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.startedAt}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">{MODE_LABEL[r.mode]}</span>
                </div>
                <div className="text-xs">{r.observationSummary}</div>
                <div className="text-xs text-muted-foreground">{r.notes.join(" · ")}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="本地守护模式接口（预留）">
        <p className="text-xs text-muted-foreground">
          以下接口为本地执行网关预留，当前未真正发起请求。未来本地守护模式可在电脑开机后自动启动，页面关闭仍继续运行。
        </p>
        <ul className="text-xs font-mono space-y-1">
          {Object.entries(LOCAL_DAEMON_ENDPOINTS).map(([k, v]) => (
            <li key={k} className="text-muted-foreground">
              <span className="text-foreground">{k}</span> → {v}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="安全边界">
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          <li>不自动发送真实消息 / 不自动发布公开内容 / 不自动支付。</li>
          <li>不自动删除文件、不执行非白名单命令、不上传用户数据。</li>
          <li>不自动开始真实训练，除非训练任务已被用户确认。</li>
          <li>可自动：观察 / 规划 / 创建草案 / 生成任务 / 写记录 / 生成恢复建议。</li>
        </ul>
      </Section>

      {latestDecision && latestDecision.requiredConfirmation && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          有 1 个决策需要用户确认：
          {FACTORY_LABEL[latestDecision.chosenFactory]} ·{" "}
          {ACTION_LABEL[latestDecision.chosenAction]}
        </div>
      )}

      {!latestRun && (
        <p className="text-xs text-muted-foreground">
          提示：首次访问可点击「运行一次总策决策」生成第一个观察与决策。
        </p>
      )}
    </div>
  );
}
