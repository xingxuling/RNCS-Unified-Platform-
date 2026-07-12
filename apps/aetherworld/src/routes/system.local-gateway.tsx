// Aether Local Execution Gateway · /system/local-gateway
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadGatewayConfig,
  saveGatewayConfig,
  gatewayDryRun,
  gatewayRunTraining,
  gatewayGetLogs,
  gatewayCancel,
} from "@/lib/local-execution-gateway/localGatewayClient";
import {
  LOCAL_GATEWAY_DEFAULT_URL,
  type GatewayLogResponse,
} from "@/lib/local-execution-gateway/localGatewayTypes";
import {
  LOCAL_GATEWAY_ALLOWED,
  LOCAL_GATEWAY_FORBIDDEN,
  LOCAL_GATEWAY_WHITELIST,
  LOCAL_GATEWAY_ALLOWED_DIRS,
} from "@/lib/local-execution-gateway/localGatewaySafetyPolicy";
import {
  getUnifiedLocalGatewayStatus,
  deriveConnStateLabel,
  type LocalGatewayStatus,
} from "@/lib/local-execution-gateway/localGatewayUnifiedState";

export const Route = createFileRoute("/system/local-gateway")({
  head: () => ({ meta: [{ title: "本地执行网关 · 系统" }] }),
  component: LocalGatewayPage,
});

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function LocalGatewayPage() {
  const [baseUrl, setBaseUrl] = useState(loadGatewayConfig().baseUrl);
  const [status, setStatus] = useState<LocalGatewayStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [taskId, setTaskId] = useState("LOCAL-DRY-001");
  const [workingDirectory, setWorkingDirectory] = useState("./aether-training/local-001");
  const [executable, setExecutable] = useState("python");
  const [argsText, setArgsText] = useState("train.py --config config.yaml");
  const [dryRunResult, setDryRunResult] = useState<Awaited<ReturnType<typeof gatewayDryRun>> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [runId, setRunId] = useState<string>("");
  const [runLogs, setRunLogs] = useState<GatewayLogResponse | null>(null);

  async function refreshConnection() {
    setBusy(true);
    const s = await getUnifiedLocalGatewayStatus();
    setStatus(s);
    setBusy(false);
  }

  useEffect(() => { void refreshConnection(); }, []);

  function handleSaveBaseUrl() {
    saveGatewayConfig({ baseUrl: baseUrl.trim() || LOCAL_GATEWAY_DEFAULT_URL });
    void refreshConnection();
  }

  async function handleDryRun() {
    const args = argsText.trim().split(/\s+/).filter(Boolean);
    const r = await gatewayDryRun({ taskId, workingDirectory, executable, args });
    setDryRunResult(r);
    setConfirmed(false);
  }

  async function handleRun() {
    if (!dryRunResult?.canRun || !confirmed) return;
    const args = argsText.trim().split(/\s+/).filter(Boolean);
    const r = await gatewayRunTraining({
      taskId, workingDirectory, executable, args, userConfirmed: true, timeoutSec: 1800,
    });
    if (r.ok && r.runId) {
      setRunId(r.runId);
      await refreshLogs(r.runId);
    }
  }

  async function refreshLogs(id = runId) {
    if (!id) return;
    const r = await gatewayGetLogs(id);
    setRunLogs(r);
  }

  async function handleCancel() {
    if (!runId) return;
    await gatewayCancel(runId);
    await refreshLogs();
  }

  const derived = status ? deriveConnStateLabel(status) : { state: "DISCONNECTED" as const, label: "未连接", tone: "error" as const };
  const connTone = derived.tone === "ok" ? "text-emerald-500" : derived.tone === "error" ? "text-rose-500" : "text-amber-500";
  const isDisconnected = !status?.connected;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10 text-sm">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">系统 · 训练</p>
        <h1 className="text-2xl font-semibold text-foreground">本地执行网关</h1>
        <p className="text-xs text-muted-foreground">
          连接 Aetherworld 网页与本机训练环境。只接收自动训练器生成的训练任务；只允许白名单命令；只在允许目录内运行；spawn shell:false。
        </p>
      </header>

      <Section title="连接状态" hint={`默认 ${LOCAL_GATEWAY_DEFAULT_URL}（仅 127.0.0.1）`}>
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm font-medium ${connTone}`}>
              {derived.label}
            </span>
            {status?.rawHealth && (
              <span className="text-[11px] text-muted-foreground">
                gateway={status.rawHealth.gateway} · v{status.rawHealth.version} · {status.rawHealth.host}:{status.rawHealth.port}
              </span>
            )}
            <button
              type="button"
              onClick={refreshConnection}
              disabled={busy}
              className="ml-auto rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              {busy ? "检测中…" : "健康检查"}
            </button>
          </div>
          {status && (
            <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
              <div>
                Python：
                <span className={status.python.ok ? "text-emerald-400" : "text-rose-400"}>
                  {status.python.ok
                    ? `可用（${status.python.command} ${status.python.version ?? ""}）`
                    : "缺失"}
                </span>
              </div>
              <div>
                python3：
                <span className={status.python3.ok ? "text-emerald-400" : "text-amber-400"}>
                  {status.python3.ok ? `可用（${status.python3.version ?? ""}）` : "不可用（Windows 可忽略）"}
                </span>
              </div>
              <div>
                本地守护器：
                <span className={status.daemon.available ? "text-emerald-400" : "text-rose-400"}>
                  {status.daemon.available ? `${status.daemon.mode} / 可用` : "OFFLINE"}
                </span>
              </div>
              <div>
                可执行 dry-run：
                <span className={status.readyToRun ? "text-emerald-400" : "text-amber-400"}>
                  {status.readyToRun ? "是" : "否"}
                </span>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="flex-1 min-w-[260px] rounded border border-border bg-background px-2 py-1 font-mono text-[11px]"
            />
            <button type="button" onClick={handleSaveBaseUrl} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">
              保存地址
            </button>
          </div>
          {isDisconnected && (
            <p className="mt-3 rounded bg-rose-500/10 p-2 text-[11px] text-rose-400">
              请先启动本地执行网关：在仓库 <code>local-gateway</code> 目录执行 <code>npm install &amp;&amp; npm run local-gateway</code>。
            </p>
          )}
        </div>
      </Section>

      <Section title="环境检查" hint="node / python / 工作目录可写性">
        {status?.rawEnv ? (
          <div className="rounded-lg border border-border bg-card/40 p-3">
            <ul className="space-y-1 text-xs">
              {status.rawEnv.checks.map((c) => {
                const isPy3 = c.name === "python3";
                const tone = c.ok
                  ? "text-emerald-500"
                  : isPy3
                  ? "text-amber-500"
                  : "text-rose-500";
                const mark = c.ok ? "✓" : isPy3 ? "!" : "✗";
                return (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className={tone}>{mark}</span>
                    <span className="font-mono">{c.name}</span>
                    <span className="text-muted-foreground">
                      — {c.detail}
                      {!c.ok && isPy3 ? "（Windows 可忽略，已自动使用 python）" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            {status.warnings.length > 0 && (
              <ul className="mt-2 text-[11px] text-amber-400">
                {status.warnings.map((w) => <li key={w}>· {w}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">连接网关后会显示本机环境检查结果。</p>
        )}
      </Section>


      <Section title="Dry-run · 训练任务预检查" hint="先校验白名单命令、参数、工作目录，再允许执行">
        <div className="space-y-2 rounded-lg border border-border bg-card/40 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-[11px] text-muted-foreground">
              任务 ID
              <input value={taskId} onChange={(e) => setTaskId(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs" />
            </label>
            <label className="text-[11px] text-muted-foreground">
              工作目录
              <input value={workingDirectory} onChange={(e) => setWorkingDirectory(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs" />
            </label>
            <label className="text-[11px] text-muted-foreground">
              executable
              <input value={executable} onChange={(e) => setExecutable(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs" />
            </label>
            <label className="text-[11px] text-muted-foreground sm:col-span-2">
              args（空格分隔）
              <input value={argsText} onChange={(e) => setArgsText(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleDryRun} disabled={isDisconnected} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50">
              运行 dry-run
            </button>
          </div>
          {dryRunResult && (
            <div className="mt-2 rounded bg-muted/40 p-3 text-[11px]">
              <div>命令预览：<code className="font-mono">{dryRunResult.commandPreview}</code></div>
              <div>白名单：{dryRunResult.whitelistLabel || "—"}</div>
              <div>环境状态：{dryRunResult.environmentStatus}</div>
              <div className={dryRunResult.canRun ? "text-emerald-500" : "text-rose-500"}>
                canRun = {String(dryRunResult.canRun)}
              </div>
              {dryRunResult.warnings.length > 0 && (
                <ul className="mt-1 text-amber-400">{dryRunResult.warnings.map((w) => <li key={w}>· {w}</li>)}</ul>
              )}
              {dryRunResult.blockedReasons.length > 0 && (
                <ul className="mt-1 text-rose-400">{dryRunResult.blockedReasons.map((w) => <li key={w}>· {w}</li>)}</ul>
              )}
            </div>
          )}
          {dryRunResult?.canRun && (
            <div className="mt-2 space-y-2 rounded border border-amber-500/40 bg-amber-500/5 p-3 text-[11px]">
              <label className="flex items-center gap-2 text-amber-400">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                我已确认上述命令、参数与工作目录，授权本机执行。
              </label>
              <button type="button" onClick={handleRun} disabled={!confirmed} className="rounded border border-amber-500/60 px-3 py-1 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50">
                启动训练
              </button>
            </div>
          )}
        </div>
      </Section>

      {runId && (
        <Section title={`运行日志 · ${runId}`} hint={runLogs?.redacted ? "已脱敏" : "脱敏：自动"}>
          <div className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => refreshLogs()} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">刷新日志</button>
              <button type="button" onClick={handleCancel} className="rounded border border-rose-500/50 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/10">停止</button>
              <span className="ml-auto text-[11px] text-muted-foreground">状态：{runLogs?.status || "—"}{runLogs?.truncated && "（已截断）"}</span>
            </div>
            <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-[10px] leading-relaxed">
              {(runLogs?.logs || []).map((l, i) => `[${l.level}] ${l.line}`).join("\n") || "（暂无日志）"}
            </pre>
          </div>
        </Section>
      )}

      <Section title="白名单命令" hint="只允许以下结构化命令">
        <ul className="space-y-1 rounded-lg border border-border bg-card/40 p-3 text-[11px] font-mono">
          {LOCAL_GATEWAY_WHITELIST.map((c) => <li key={c}>· {c}</li>)}
        </ul>
      </Section>

      <Section title="允许目录">
        <ul className="space-y-1 rounded-lg border border-border bg-card/40 p-3 text-[11px] font-mono">
          {LOCAL_GATEWAY_ALLOWED_DIRS.map((d) => <li key={d}>· {d}</li>)}
        </ul>
      </Section>

      <Section title="安全边界">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card/40 p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">允许</div>
            <ul className="space-y-1 text-[11px]">{LOCAL_GATEWAY_ALLOWED.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
          <div className="rounded-lg border border-border bg-card/40 p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">禁止</div>
            <ul className="space-y-1 text-[11px]">{LOCAL_GATEWAY_FORBIDDEN.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
        </div>
      </Section>

      <footer className="border-t border-border pt-4 text-[11px] text-muted-foreground">
        相关入口：
        <Link to="/system/auto-training" className="ml-2 underline">自动训练（受控执行器）</Link>
        <Link to="/system/training-workflows" className="ml-3 underline">训练工作流</Link>
        <Link to="/system/data-engine" className="ml-3 underline">数据引擎</Link>
        <Link to="/system/experiment-ledger" className="ml-3 underline">实验账本</Link>
      </footer>
    </div>
  );
}
