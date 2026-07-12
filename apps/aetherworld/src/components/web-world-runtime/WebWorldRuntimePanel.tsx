import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { runWebWorldRuntime } from "@/lib/web-world-runtime/webWorldRuntimeEngine";
import type {
  WebWorldRuntimeInput,
  WebWorldRuntimeMode,
  WebWorldRuntimeResult,
} from "@/lib/web-world-runtime/webWorldRuntimeTypes";
import { WEB_WORLD_RUNTIME_META } from "@/lib/web-world-runtime/webWorldRuntimeTypes";
import { EmptyState } from "@/components/common/EmptyState";

const MODES: { id: WebWorldRuntimeMode; label: string; note: string }[] = [
  { id: "DEMO",     label: "演示",   note: "首次体验，最快。" },
  { id: "LIGHT",    label: "轻量",   note: "普通用户日常使用。" },
  { id: "FULL",     label: "深度",   note: "需要 Full60，私密环境。" },
  { id: "CREATOR",  label: "创作",   note: "偏向世界观与角色设计。" },
  { id: "DECISION", label: "决策",   note: "偏向行动与风险推演。" },
];

export function WebWorldRuntimePanel() {
  const [seed, setSeed] = useState("");
  const [mode, setMode] = useState<WebWorldRuntimeMode>("LIGHT");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WebWorldRuntimeResult | null>(null);

  async function handleRun() {
    if (running) return;
    setRunning(true);
    try {
      const input: WebWorldRuntimeInput = {
        seed,
        mode,
        generateMap: true,
        generateNpcs: true,
        generateQuests: true,
      };
      const r = await runWebWorldRuntime(input);
      setResult(r);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {WEB_WORLD_RUNTIME_META.name} · v{WEB_WORLD_RUNTIME_META.version}
        </div>
        <h1 className="font-display text-2xl">{WEB_WORLD_RUNTIME_META.chineseName}</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          {WEB_WORLD_RUNTIME_META.description}
        </p>
      </header>

      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">世界种子 / 描述</label>
          <textarea
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="用一段话或一组数列描述你想生成的世界…"
            className="mt-1 w-full min-h-[80px] rounded border border-border/60 bg-background/60 text-sm p-2 outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1.5">运行模式</div>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  title={m.note}
                  className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {MODES.find((m) => m.id === mode)?.note}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Link
            to="/world-simulation"
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            深度编辑 →
          </Link>
          <button
            disabled={running || !seed.trim()}
            onClick={handleRun}
            className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-primary px-3 py-1.5"
          >
            {running ? "运行中…" : "运行世界"}
          </button>
        </div>
      </section>

      <section>
        {!result ? (
          <EmptyState
            title="尚未运行"
            description="填写种子描述并选择模式后，运行结果会显示在这里，也会同步回到对话承接系统。"
            secondary={
              <span>
                也可以直接打开{" "}
                <Link to="/world-simulation" className="underline hover:text-foreground">
                  世界模拟
                </Link>{" "}
                做深度操作。
              </span>
            }
          />
        ) : (
          <article className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
            <header className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Run · {result.runId}
                </div>
                <h3 className="text-base font-display">{result.worldName}</h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                签名 {result.signature}
              </span>
            </header>

            <p className="text-sm text-foreground/90">{result.summary}</p>

            <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Stat label="主导域"  value={result.dominantDomain} />
              <Stat label="阶段"    value={result.phase} />
              <Stat label="区域数"  value={String(result.zonesCount)} />
              <Stat label="任务数"  value={String(result.questsCount)} />
              <Stat label="NPC 数"  value={String(result.npcsCount)} />
              <Stat label="法则数"  value={String(result.rulesCount)} />
            </dl>

            {result.safetyNotes.length > 0 && (
              <ul className="text-[11px] text-amber-500/90 border border-amber-500/20 bg-amber-500/5 rounded px-2 py-1 space-y-0.5">
                {result.safetyNotes.map((n, i) => (
                  <li key={i}>· {n}</li>
                ))}
              </ul>
            )}

            <footer className="flex items-center justify-end gap-2 pt-1">
              <Link
                to="/world-simulation"
                className="text-[12px] rounded border border-border/60 hover:border-border px-3 py-1"
              >
                打开深度编辑
              </Link>
              <Link
                to="/workspace"
                className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1"
              >
                保存到工作区
              </Link>
            </footer>
          </article>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
