import { useState } from "react";
import {
  buildLovableBuildUrl,
  type LovableBuildInput,
  type LovableBuildKind,
  type LovableBuildResult,
} from "@/lib/lovable-native/lovableBuildUrlAdapter";
import { qaStatusFromLovable } from "@/lib/lovable-native/lovableNativeQaBridge";
import { emitLovableNotice } from "@/lib/lovable-native/lovableNativeNoticeBridge";

const KIND_OPTIONS: { id: LovableBuildKind; label: string }[] = [
  { id: "MVP",      label: "MVP" },
  { id: "UI",       label: "UI 草案" },
  { id: "FIX",      label: "修复" },
  { id: "REFACTOR", label: "重构" },
  { id: "FREE",     label: "自由 Prompt" },
];

export function LovableBuildUrlPanel() {
  const [kind, setKind] = useState<LovableBuildKind>("MVP");
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [existingContext, setExistingContext] = useState("");
  const [result, setResult] = useState<LovableBuildResult | null>(null);

  function handleGenerate() {
    try {
      const input: LovableBuildInput = {
        kind,
        appName: appName.trim() || undefined,
        description: description.trim() || "（无描述）",
        features: features.split("\n").map((s) => s.trim()).filter(Boolean),
        existingContext: existingContext.trim() || undefined,
      };
      const r = buildLovableBuildUrl(input);
      setResult(r);
    } catch (e) {
      emitLovableNotice("BUILD_URL_FAILED", { message: (e as Error).message });
    }
  }

  const qa = result ? qaStatusFromLovable({ hasSafetyNotes: result.safetyNotes.length > 0 }) : "NOT_CHECKED";

  return (
    <div className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Lovable Build with URL
        </div>
        <h2 className="font-display text-xl">生成 Lovable 构建链接</h2>
        <p className="text-xs text-muted-foreground mt-1">
          把对话草案、WebCodeM 输出或自由想法转换成一个可在 Lovable 中一键创建项目的链接。
        </p>
      </header>

      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">类型</div>
          <div className="flex flex-wrap gap-1.5">
            {KIND_OPTIONS.map((k) => {
              const active = kind === k.id;
              return (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="应用 / 模块名称">
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="例如：以太收藏夹"
              className="w-full rounded border border-border/60 bg-background/60 text-sm p-2 outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="核心功能（每行一项，可空）">
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="例如：&#10;添加 / 删除收藏&#10;按标签筛选"
              className="w-full min-h-[64px] rounded border border-border/60 bg-background/60 text-sm p-2 outline-none focus:border-primary/60"
            />
          </Field>
        </div>

        <Field label="一句话描述需求">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="想做什么？面向谁？关键体验是什么？"
            className="w-full min-h-[80px] rounded border border-border/60 bg-background/60 text-sm p-2 outline-none focus:border-primary/60"
          />
        </Field>

        {(kind === "FIX" || kind === "REFACTOR") && (
          <Field label="已有上下文（代码 / 报错 / 模块说明）">
            <textarea
              value={existingContext}
              onChange={(e) => setExistingContext(e.target.value)}
              placeholder="粘贴相关代码片段或错误信息…"
              className="w-full min-h-[100px] rounded border border-border/60 bg-background/60 text-xs font-mono p-2 outline-none focus:border-primary/60"
            />
          </Field>
        )}

        <div className="flex items-center justify-end">
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-primary px-3 py-1.5"
          >
            生成构建链接
          </button>
        </div>
      </section>

      {result && (
        <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
          <header className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Lovable Native · {result.kind}
              </div>
              <h3 className="text-base font-display">{result.title}</h3>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                qa === "WARN"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              QA · {qa === "WARN" ? "WARN" : "PASS"}
            </span>
          </header>

          <p className="text-sm text-foreground/90">{result.summary}</p>

          {result.safetyNotes.length > 0 && (
            <ul className="text-[11px] text-amber-500/90 border border-amber-500/20 bg-amber-500/5 rounded px-2 py-1 space-y-0.5">
              {result.safetyNotes.map((n, i) => (
                <li key={i}>· {n}</li>
              ))}
            </ul>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              查看 Prompt（{result.prompt.length} 字符）
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-foreground/80 bg-background/60 p-2 rounded border border-border/40">
              {result.prompt}
            </pre>
          </details>

          <footer className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              onClick={() => navigator.clipboard?.writeText(result.prompt)}
              className="text-[12px] rounded border border-border/60 hover:border-border px-3 py-1"
            >
              复制 Prompt
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(result.url)}
              className="text-[12px] rounded border border-border/60 hover:border-border px-3 py-1"
            >
              复制链接
            </button>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1"
            >
              打开 Lovable 创建应用 ↗
            </a>
          </footer>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
