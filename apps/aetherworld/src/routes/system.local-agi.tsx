import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  buildDailyReport,
  disableAgi,
  enableAgi,
  getLatestDecision,
  getLatestReport,
  getLatestRun,
  observe,
  runOnce,
  startHeartbeat,
  stopHeartbeat,
  summarizeObservation,
  switchMode,
  LOCAL_AGI_DAEMON_ENDPOINTS,
} from "@/lib/local-agi/localAgiRuntime";
import {
  getAgiState,
  getHeartbeat,
  listDecisions,
  listDevTasks,
  listFeedback,
  listRuns,
  listSignals,
  subscribeLocalAGI,
} from "@/lib/local-agi/localAgiStore";
import {
  recordFeedback,
  absorbAllPending,
} from "@/lib/local-agi/feedbackAbsorber";
import { scanExternalRadar } from "@/lib/local-agi/externalDataRadar";
import { scanAndPlanDevelopment } from "@/lib/local-agi/developmentFactory";
import {
  DEV_TASK_LABEL,
  EXTERNAL_SOURCE_LABEL,
  FEEDBACK_SOURCE_LABEL,
  LOCAL_AGI_FACTORY_LABEL,
  LOCAL_AGI_MODE_LABEL,
  type FeedbackSource,
  type LocalAGIMode,
} from "@/lib/local-agi/localAgiTypes";
import {
  buildCompanyCard,
  buildMaterialCard,
  buildOverview,
  buildTrainingCard,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryRuntime";
import { listFactoryTasks } from "@/lib/aetherworld-autonomous-factory/autonomousFactoryStore";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/local-agi")({
  head: () => ({
    meta: [
      { title: "Aetherworld 专属 AGI · 总策智能体" },
      {
        name: "description",
        content:
          "Aetherworld 专属 AGI：长期心跳，多模式（观察 / 规划 / 工厂调度 / 竞争 / 研究 / 开发），调度材料 / 训练 / 公司 / 开发 / 系统健康五大工厂，外界数据雷达，反馈吸收器，今日增长报告。",
      },
    ],
  }),
  component: LocalAgiPage,
});

const MODES: { v: LocalAGIMode; desc: string }[] = [
  { v: "SLEEP", desc: "休眠：不创建任务" },
  { v: "OBSERVE", desc: "只观察：只读状态" },
  { v: "PLAN", desc: "规划：生成计划草案" },
  { v: "FACTORY_CONTROL", desc: "工厂调度：可推进低风险动作" },
  { v: "COMPETITION", desc: "竞争：抢数据 / 模型 / 资产 / 用户" },
  { v: "RESEARCH", desc: "研究：跑外界数据雷达" },
  { v: "DEVELOPMENT", desc: "开发：生成 Lovable / Codex 任务" },
];

const FB_SOURCES: { v: FeedbackSource; label: string }[] = [
  { v: "USER_CHAT", label: FEEDBACK_SOURCE_LABEL.USER_CHAT },
  { v: "LOVABLE_REPORT", label: FEEDBACK_SOURCE_LABEL.LOVABLE_REPORT },
  { v: "ERROR_LOG", label: FEEDBACK_SOURCE_LABEL.ERROR_LOG },
  { v: "TRAINING_FAIL", label: FEEDBACK_SOURCE_LABEL.TRAINING_FAIL },
  { v: "BROKEN_PAGE", label: FEEDBACK_SOURCE_LABEL.BROKEN_PAGE },
  { v: "USER_IDEA", label: FEEDBACK_SOURCE_LABEL.USER_IDEA },
  { v: "BUG_AUDIT", label: FEEDBACK_SOURCE_LABEL.BUG_AUDIT },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function LocalAgiPage() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);
  useEffect(() => subscribeLocalAGI(refresh), []);

  const state = getAgiState();
  const hb = getHeartbeat();
  const o = observe();
  const run = getLatestRun();
  const decision = getLatestDecision();
  const report = getLatestReport();

  const decisions = listDecisions().slice(0, 6);
  const runs = listRuns().slice(0, 5);
  const signals = listSignals().slice(0, 6);
  const feedback = listFeedback().slice(0, 8);
  const devs = listDevTasks().slice(0, 6);

  const tasks = listFactoryTasks();
  const overview = useMemo(() => buildOverview(), [tasks.length]);
  const matCard = useMemo(() => buildMaterialCard(), [tasks.length]);
  const trainCard = useMemo(() => buildTrainingCard(false), [tasks.length]);
  const compCard = useMemo(() => buildCompanyCard(), [tasks.length]);

  const [fbSource, setFbSource] = useState<FeedbackSource>("USER_CHAT");
  const [fbContent, setFbContent] = useState("");

  useEffect(() => {
    if (state.enabled && hb.enabled) {
      startHeartbeat();
      return () => stopHeartbeat();
    }
    stopHeartbeat();
  }, [state.enabled, hb.enabled, hb.intervalMinutes]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link to="/system" className="hover:text-foreground">系统</Link>
          <span>/</span>
          <span>专属 AGI</span>
        </div>
        <h1 className="text-2xl font-bold">Aetherworld 专属 AGI</h1>
        <p className="text-sm text-muted-foreground">
          局部领域 AGI：长期运行、调用工具、吸收反馈、自我改进。调度材料 / 训练 / 公司 / 开发 / 系统健康五大工厂。
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          浏览器模式下心跳依赖页面开启；本地守护接口已预留，未真正发起请求。
        </p>
      </header>

      <UnifiedGatewayStatusBar prefix="AGI 调度前置：" />



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="AGI 状态">
          <Row label="是否启用" value={state.enabled ? "已启用" : "已暂停"} />
          <Row label="当前模式" value={LOCAL_AGI_MODE_LABEL[state.mode]} />
          <Row label="心跳间隔" value={`${hb.intervalMinutes} 分钟`} />
          <Row label="运行次数" value={hb.runCount} />
          <Row label="最近运行" value={state.lastRunAt ?? "尚未运行"} />
          <Row label="下次运行" value={state.nextRunAt ?? "—"} />
          <Row label="当前焦点" value={hb.currentFocus} />
          <Row label="当前目标" value={state.currentGoal} />
          <Row label="今日增长分" value={state.todayGrowthScore} />

          <div className="pt-3 flex flex-wrap gap-2">
            {state.enabled ? (
              <button
                onClick={() => {
                  disableAgi();
                  refresh();
                }}
                className="px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted/70"
              >
                暂停
              </button>
            ) : (
              <button
                onClick={() => {
                  enableAgi();
                  refresh();
                }}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
              >
                启用
              </button>
            )}
            <button
              onClick={() => {
                runOnce();
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              运行一次
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
                scanExternalRadar();
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              运行外界数据雷达
            </button>
            <button
              onClick={() => {
                scanAndPlanDevelopment({ uxComplaints: o.pendingFeedback });
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              生成开发任务
            </button>
            <button
              onClick={() => {
                absorbAllPending(listFeedback());
                refresh();
              }}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
            >
              吸收待处理反馈
            </button>
          </div>

          <div className="pt-3">
            <div className="text-xs text-muted-foreground mb-2">切换模式</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.v}
                  onClick={() => {
                    switchMode(m.v);
                    refresh();
                  }}
                  className={`text-left px-3 py-2 rounded border text-xs ${
                    state.mode === m.v
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="font-medium text-sm">{LOCAL_AGI_MODE_LABEL[m.v]}</div>
                  <div className="text-muted-foreground">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="五大工厂状态">
          <Row label="材料工厂 · 样本池" value={matCard.samplePool} />
          <Row label="材料工厂 · 数据集" value={matCard.sealedDatasets} />
          <Row label="训练工厂 · 当前任务" value={trainCard.activeRun} />
          <Row label="训练工厂 · 守护" value={trainCard.daemonStatus} />
          <Row label="公司工厂 · 商店草案" value={compCard.storeDrafts} />
          <Row label="公司工厂 · 能力包" value={compCard.assetCandidates} />
          <Row label="开发工厂 · 草案数" value={devs.length} />
          <Row label="系统健康 · 失败任务" value={overview.failed} />
          <Row label="今日观察" value={summarizeObservation(o)} />
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <Link to="/system/autonomous-factory" className="underline text-primary">
              无人工厂总控 →
            </Link>
            <Link to="/system/aetherboss-agent" className="underline text-primary">
              总策 Agent →
            </Link>
          </div>
        </Card>
      </div>

      <Card title="总策任务（决策日志）">
        {decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚无决策。点击「运行一次」开始。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {decisions.map((d) => (
              <li key={d.id} className="rounded border border-border/60 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.createdAt}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">
                    {LOCAL_AGI_MODE_LABEL[d.mode]} · {d.priority}
                  </span>
                </div>
                <div className="font-medium">
                  {LOCAL_AGI_FACTORY_LABEL[d.chosenFactory]} · {d.chosenTask}
                </div>
                <div className="text-xs text-muted-foreground">观察：{d.observation}</div>
                <div className="text-xs">原因：{d.reason}</div>
                <div className="text-xs">预期：{d.expectedValue}</div>
                {d.generatedOutputs.length > 0 && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-300">
                    产出：{d.generatedOutputs.join("、")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="外界数据雷达">
          {signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚无外界信号。点击「运行外界数据雷达」。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {signals.map((s) => (
                <li key={s.id} className="rounded border border-border/60 p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {EXTERNAL_SOURCE_LABEL[s.sourceType]}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-muted">
                      战略价值 {s.strategicValue}
                    </span>
                  </div>
                  <div className="font-medium">{s.topic}</div>
                  <div className="text-xs text-muted-foreground">{s.summary}</div>
                  <div className="text-xs">建议：{s.suggestedAction}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="反馈吸收器">
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={fbSource}
                onChange={(e) => setFbSource(e.target.value as FeedbackSource)}
                className="text-sm rounded border border-border bg-background px-2 py-1"
              >
                {FB_SOURCES.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.label}
                  </option>
                ))}
              </select>
              <input
                value={fbContent}
                onChange={(e) => setFbContent(e.target.value)}
                placeholder="输入一条反馈 / 想法 / 错误"
                className="flex-1 text-sm rounded border border-border bg-background px-2 py-1"
              />
              <button
                onClick={() => {
                  if (!fbContent.trim()) return;
                  recordFeedback(fbSource, fbContent.trim());
                  setFbContent("");
                  refresh();
                }}
                className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground"
              >
                录入
              </button>
            </div>
            <button
              onClick={() => {
                absorbAllPending(listFeedback());
                refresh();
              }}
              className="text-xs underline text-primary"
            >
              吸收全部待处理反馈
            </button>
          </div>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无反馈记录。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {feedback.map((f) => (
                <li key={f.id} className="rounded border border-border/60 p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {FEEDBACK_SOURCE_LABEL[f.source]}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-muted">
                      {f.absorbed ? "已吸收" : "待吸收"}
                    </span>
                  </div>
                  <div className="text-xs">{f.content}</div>
                  {f.outputs.length > 0 && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-300">
                      产出：{f.outputs.map((o) => o.title).join("；")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="开发工厂草案">
        {devs.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚无开发草案。点击「生成开发任务」。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {devs.map((d) => (
              <li key={d.id} className="rounded border border-border/60 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.createdAt}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">{DEV_TASK_LABEL[d.kind]}</span>
                </div>
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">{d.body}</div>
                <div className="text-xs">
                  验收：
                  <ul className="list-disc list-inside">
                    {d.acceptance.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="今日增长报告">
        {report ? (
          <>
            <Row label="日期" value={report.date} />
            <Row label="增长分数" value={report.growthScore} />
            <Row label="新增样本任务" value={report.newSamples} />
            <Row label="估算新增 token" value={report.newTokens} />
            <Row label="新增训练计划" value={report.newTrainingPlans} />
            <Row label="新增资产" value={report.newAssets} />
            <Row label="新增任务" value={report.newTasks} />
            <Row label="外界信号" value={report.externalSignals} />
            <Row label="吸收反馈" value={report.absorbedFeedback} />
            <Row label="开发草案" value={report.developmentDrafts} />
            <div className="pt-2 text-xs text-muted-foreground">
              战略提示：{report.strategicNote}
            </div>
            <div className="text-xs">
              下一步建议：
              <ul className="list-disc list-inside">
                {report.nextBestActions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">尚未生成今日报告。</p>
        )}
      </Card>

      <Card title="最近运行">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚无运行记录。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {runs.map((r) => (
              <li key={r.id} className="rounded border border-border/60 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.startedAt}</span>
                  <span className="px-2 py-0.5 rounded bg-muted">
                    {LOCAL_AGI_MODE_LABEL[r.mode]}
                  </span>
                </div>
                <div className="text-xs">{r.observation}</div>
                <div className="text-xs text-muted-foreground">{r.notes.join(" · ")}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="本地守护模式接口（预留）">
        <p className="text-xs text-muted-foreground">
          以下接口为本地执行网关预留。当前未真正发起请求，未来本地守护模式可在电脑开机后自动启动并长期运行。
        </p>
        <ul className="text-xs font-mono space-y-1">
          {Object.entries(LOCAL_AGI_DAEMON_ENDPOINTS).map(([k, v]) => (
            <li key={k} className="text-muted-foreground">
              <span className="text-foreground">{k}</span> → {v}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="安全边界">
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          <li>不真实发送消息、不真实发布内容、不支付、不删除文件。</li>
          <li>不执行非白名单命令、不上传私有数据、不越过本地网关安全策略。</li>
          <li>不自动开始真实训练，除非训练任务已被用户确认。</li>
          <li>可自动：观察 / 规划 / 创建草案 / 调度低风险工厂 / 生成报告与提示词 / 把反馈转候选样本。</li>
        </ul>
      </Card>

      {decision && decision.requiredConfirmation && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          有 1 个决策需要确认：
          {LOCAL_AGI_FACTORY_LABEL[decision.chosenFactory]} · {decision.chosenTask}
        </div>
      )}

      {!run && (
        <p className="text-xs text-muted-foreground">
          提示：首次访问可点击「运行一次」生成第一个观察与决策。
        </p>
      )}
    </div>
  );
}
