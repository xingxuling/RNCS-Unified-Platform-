import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  buildCompanyCard,
  buildMaterialCard,
  buildOverview,
  buildTrainingCard,
  completeTask,
  createFactoryTask,
  failTask,
  pauseTask,
  resumeTask,
  retryTask,
  startTask,
  summarizeFactory,
  summarizeTaskType,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryRuntime";
import {
  listFactoryTasks,
  subscribeFactoryTasks,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryStore";
import {
  AUTOMATION_LEVEL_LABEL,
  type AutomationLevel,
  type AutonomousFactoryTask,
  type FactoryKind,
  type FactoryTaskType,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryTypes";
import { checkDaemonHealth } from "@/lib/aetherseed-unattended/daemonBridge";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/autonomous-factory")({
  head: () => ({
    meta: [
      { title: "无人工厂总控 · Aetherworld" },
      {
        name: "description",
        content:
          "Aetherworld 无人工厂总控：统一调度材料工厂、训练工厂、公司工厂，任务时间线与失败恢复中心。",
      },
    ],
  }),
  component: AutonomousFactoryPage,
});

const FACTORY_OPTIONS: { value: FactoryKind; label: string }[] = [
  { value: "MATERIAL", label: "材料工厂" },
  { value: "TRAINING", label: "训练工厂" },
  { value: "COMPANY", label: "公司工厂" },
];

const TASK_TYPES: { value: FactoryTaskType; label: string }[] = [
  { value: "INTAKE", label: "材料投喂" },
  { value: "DATASET_BUILD", label: "数据集构建" },
  { value: "EXPORT", label: "训练包导出" },
  { value: "TRAINING_PLAN", label: "训练计划生成" },
  { value: "DRY_RUN", label: "Dry-run 校验" },
  { value: "TRAINING_RUN", label: "无人值守训练" },
  { value: "EVAL", label: "自动评测" },
  { value: "LEDGER_WRITE", label: "实验账本写入" },
  { value: "CAPABILITY_PACKAGE", label: "能力包封装" },
  { value: "STORE_DRAFT", label: "商店草案" },
  { value: "FEEDBACK_TO_DATASET", label: "反馈回流" },
  { value: "RECOVERY", label: "失败恢复" },
];

const AUTOMATION_LEVELS: AutomationLevel[] = ["L0", "L1", "L2", "L3", "L4"];

function AutonomousFactoryPage() {
  const [tasks, setTasks] = useState<AutonomousFactoryTask[]>(() => listFactoryTasks());
  const [daemonReady, setDaemonReady] = useState(false);
  const [form, setForm] = useState({
    factory: "MATERIAL" as FactoryKind,
    taskType: "INTAKE" as FactoryTaskType,
    title: "",
    automationLevel: "L3" as AutomationLevel,
  });

  useEffect(() => subscribeFactoryTasks(() => setTasks(listFactoryTasks())), []);
  useEffect(() => {
    void checkDaemonHealth().then((d) => setDaemonReady(d.detected));
  }, []);

  const overview = useMemo(() => buildOverview(), [tasks]);
  const material = useMemo(() => buildMaterialCard(), [tasks]);
  const training = useMemo(() => buildTrainingCard(daemonReady), [tasks, daemonReady]);
  const company = useMemo(() => buildCompanyCard(), [tasks]);
  const failed = tasks.filter((t) => t.status === "FAILED");

  function handleCreate() {
    createFactoryTask({
      factory: form.factory,
      taskType: form.taskType,
      title: form.title || undefined,
      automationLevel: form.automationLevel,
    });
    setForm({ ...form, title: "" });
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/system" className="hover:underline">系统</Link>
          <span>/</span>
          <span>无人工厂总控</span>
        </div>
        <h1 className="text-2xl font-semibold">无人工厂总控</h1>
        <p className="text-sm text-muted-foreground">
          统一调度材料工厂 / 训练工厂 / 公司工厂。不替代已有模块，只做总控编排。屏幕可关，训练不停。
        </p>
      </header>

      <UnifiedGatewayStatusBar prefix="工厂调度前置：" />



      {/* 顶部总览 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="今日任务" value={overview.todayCount} />
        <Metric label="运行中" value={overview.running} tone="info" />
        <Metric label="已完成" value={overview.completed} tone="ok" />
        <Metric label="失败" value={overview.failed} tone="error" />
        <Metric label="生成资产" value={overview.generatedAssets} />
        <Metric label="生成样本任务" value={overview.generatedSamples} />
        <Metric label="训练状态" value={overview.trainingStatus} small />
        <Metric label="下一步建议" value={overview.nextSuggestion} small />
      </section>

      {/* 三大工厂卡片 */}
      <section className="grid md:grid-cols-3 gap-4">
        <FactoryCard
          title="材料工厂"
          status="无人值守 · L3"
          rows={[
            ["最近投喂", material.recentIntake],
            ["样本池", String(material.samplePool)],
            ["长语料 token", String(material.longCorpusTokens)],
            ["待复核", String(material.pendingReview)],
            ["已封版数据集", String(material.sealedDatasets)],
            ["可导出训练包", String(material.exportableBundles)],
          ]}
          footer={material.nextStep}
          link="/system/intake-forge"
          linkLabel="进入投喂炉"
        />
        <FactoryCard
          title="训练工厂"
          status={training.unattended ? "无人值守 · L3" : "L1 半自动"}
          rows={[
            ["目标模型", training.targetModel],
            ["当前任务", training.activeRun],
            ["本地守护器", training.daemonStatus],
            ["最新 checkpoint", training.latestCheckpoint],
            ["最新实验", training.latestExperiment],
            ["下一炉", training.nextPlan],
          ]}
          footer="模型归属：使用 Aetherworld 数据 / 账本 / 接入 → AetherSeed 血统模型"
          link="/system/unattended-training"
          linkLabel="进入训练工厂"
        />
        <FactoryCard
          title="公司工厂"
          status="L2 一键执行"
          rows={[
            ["能力候选", String(company.assetCandidates)],
            ["用户上传", String(company.userUploads)],
            ["商店草案", String(company.storeDrafts)],
            ["可发布页面", String(company.publishablePages)],
            ["待审核", String(company.pendingReview)],
            ["收入化路线", company.revenueRoute],
          ]}
          footer={`下一步：${company.nextStep}（不真实上架 / 不接支付）`}
          link="/store"
          linkLabel="查看能力市场"
        />
      </section>

      {/* 创建任务 */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">创建无人工厂任务</h2>
        <div className="grid md:grid-cols-5 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-muted-foreground">工厂</span>
            <select
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.factory}
              onChange={(e) => setForm({ ...form, factory: e.target.value as FactoryKind })}
            >
              {FACTORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">任务类型</span>
            <select
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.taskType}
              onChange={(e) => setForm({ ...form, taskType: e.target.value as FactoryTaskType })}
            >
              {TASK_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-muted-foreground">标题（可选）</span>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="留空将自动命名"
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">自动化等级</span>
            <select
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.automationLevel}
              onChange={(e) =>
                setForm({ ...form, automationLevel: e.target.value as AutomationLevel })
              }
            >
              {AUTOMATION_LEVELS.map((l) => (
                <option key={l} value={l}>{AUTOMATION_LEVEL_LABEL[l]}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          创建任务
        </button>
      </section>

      {/* 时间线 */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">任务时间线（{tasks.length}）</h2>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无任务。创建第一个无人工厂任务开始编排。</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        )}
      </section>

      {/* 失败恢复中心 */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">失败与恢复中心</h2>
        {failed.length === 0 ? (
          <p className="text-xs text-muted-foreground">当前没有失败任务。</p>
        ) : (
          <ul className="space-y-2">
            {failed.map((t) => (
              <li key={t.id} className="border border-red-500/30 bg-red-500/5 rounded p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.title}</span>
                  <button
                    onClick={() => retryTask(t.id)}
                    className="px-2 py-0.5 rounded border hover:bg-muted"
                  >
                    一键重试
                  </button>
                </div>
                <div className="text-muted-foreground mt-1">失败原因：{t.failureReason}</div>
                <div className="text-muted-foreground">修复建议：{t.recoveryHint}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 安全边界 */}
      <section className="border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <h2 className="font-semibold text-sm text-foreground">安全边界</h2>
        <p>不真实上架 / 不接支付 / 不上传用户数据 / 不执行非白名单命令 / 不自动修改系统电源设置 / 不训练 BLOCK 样本。</p>
        <p>所有「公司工厂」产物均为私有草案，仅供创始人内部演示与客户邀请试用。</p>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string | number;
  tone?: "info" | "ok" | "error";
  small?: boolean;
}) {
  const color =
    tone === "info"
      ? "text-blue-600 dark:text-blue-300"
      : tone === "ok"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "error"
      ? "text-red-600 dark:text-red-300"
      : "text-foreground";
  return (
    <div className="border rounded-lg p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`${small ? "text-sm" : "text-xl font-semibold"} ${color}`}>{value}</div>
    </div>
  );
}

function FactoryCard({
  title,
  status,
  rows,
  footer,
  link,
  linkLabel,
}: {
  title: string;
  status: string;
  rows: Array<[string, string]>;
  footer: string;
  link: string;
  linkLabel: string;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{status}</span>
      </div>
      <dl className="text-xs space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right truncate max-w-[60%]" title={v}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted-foreground border-t pt-2">{footer}</p>
      <Link to={link} className="inline-block text-xs px-3 py-1 rounded border hover:bg-muted">
        {linkLabel} →
      </Link>
    </div>
  );
}

function TaskRow({ task }: { task: AutonomousFactoryTask }) {
  const statusCls =
    task.status === "RUNNING"
      ? "bg-blue-500/15 text-blue-600"
      : task.status === "COMPLETED"
      ? "bg-emerald-500/15 text-emerald-600"
      : task.status === "FAILED"
      ? "bg-red-500/15 text-red-600"
      : task.status === "PAUSED"
      ? "bg-amber-500/15 text-amber-600"
      : "bg-muted text-muted-foreground";
  return (
    <li className="border rounded p-2 text-xs space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded ${statusCls}`}>{task.status}</span>
          <span className="font-medium">{task.title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {summarizeFactory(task.factory)} · {summarizeTaskType(task.taskType)} · {AUTOMATION_LEVEL_LABEL[task.automationLevel]}
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {task.status === "WAITING" && (
          <BtnMini onClick={() => startTask(task.id)}>开始</BtnMini>
        )}
        {task.status === "RUNNING" && (
          <>
            <BtnMini onClick={() => pauseTask(task.id)}>暂停</BtnMini>
            <BtnMini onClick={() => completeTask(task.id, `${task.id}/output`)}>
              标记完成
            </BtnMini>
            <BtnMini onClick={() => failTask(task.id, "模拟失败：环境异常", "检查本地网关与数据集")}>
              模拟失败
            </BtnMini>
          </>
        )}
        {task.status === "PAUSED" && <BtnMini onClick={() => resumeTask(task.id)}>继续</BtnMini>}
        {task.status === "FAILED" && <BtnMini onClick={() => retryTask(task.id)}>重试</BtnMini>}
      </div>
    </li>
  );
}

function BtnMini({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2 py-0.5 rounded border hover:bg-muted">
      {children}
    </button>
  );
}
