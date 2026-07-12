// 开源架构吸收工作台
// 路径：/system/open-architecture
// 不进入一级导航，作为系统 / 工具子页面。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  createSource,
  absorbOpenArchitecture,
} from "@/lib/open-architecture/openArchitectureRuntime";
import type { OpenArchitectureSourceType } from "@/lib/open-architecture/openArchitectureTypes";
import {
  ABSORPTION_LEVEL_LABEL,
  BRIDGE_TYPE_LABEL,
  LAYER_LABEL,
  CAPABILITY_TYPE_LABEL,
} from "@/lib/open-architecture/openArchitectureTypes";

export const Route = createFileRoute("/system/open-architecture")({
  head: () => ({
    meta: [
      { title: "开源架构吸收 — Aetherworld" },
      { name: "description", content: "把外部开源项目、Agent 架构、插件系统吸收为 Aetherworld 内部资产。" },
      { property: "og:title", content: "开源架构吸收 — Aetherworld" },
      { property: "og:description", content: "Aetherworld 开源架构吸收运行时工作台。" },
    ],
  }),
  component: OpenArchitecturePage,
});

const SOURCE_TYPES: { value: OpenArchitectureSourceType; label: string }[] = [
  { value: "MANUAL_DESCRIPTION", label: "手工描述" },
  { value: "GITHUB_REPO",        label: "GitHub 仓库" },
  { value: "README",             label: "README" },
  { value: "DOCS",               label: "文档" },
  { value: "CODE_SNIPPET",       label: "代码片段" },
  { value: "LOCAL_PROJECT",      label: "本地项目" },
  { value: "LOVABLE_PROJECT",    label: "Lovable 项目" },
  { value: "URL",                label: "URL" },
  { value: "PACKAGE",            label: "Package" },
];

function OpenArchitecturePage() {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<OpenArchitectureSourceType>("MANUAL_DESCRIPTION");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [fileTree, setFileTree] = useState("");
  const [result, setResult] = useState<ReturnType<typeof absorbOpenArchitecture> | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0 && (rawText.trim() || fileTree.trim() || url.trim()), [title, rawText, fileTree, url]);

  function handleAnalyze() {
    const source = createSource({
      title: title.trim() || "未命名开源项目",
      sourceType,
      url: url.trim() || undefined,
      rawText: rawText.trim() || undefined,
      fileTree: fileTree.trim() || undefined,
    });
    setResult(absorbOpenArchitecture(source));
  }

  function handleReset() {
    setTitle(""); setUrl(""); setRawText(""); setFileTree(""); setResult(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System / Open Architecture Absorption</div>
          <h1 className="text-2xl font-semibold">开源架构吸收工作台</h1>
          <p className="text-sm text-muted-foreground">
            把外部开源项目、框架、Agent 架构、插件系统、工作流系统、本地运行时吸收为 Aetherworld 可理解、可映射、可接入、可商店化的内部资产。
            本页面只做结构化分析与桥接计划生成，<strong>不执行外部代码、不安装依赖、不复制源码、不绕过 License</strong>。
          </p>
          <div className="text-xs">
            <Link to="/system" className="text-primary hover:underline">← 返回系统</Link>
          </div>
        </header>

        <section className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
          <h2 className="text-sm font-medium">输入待吸收的外部架构</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <div className="text-muted-foreground">项目名称 / 标题</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：OpenClaw / LangGraph / xxx Agent"
                className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs space-y-1">
              <div className="text-muted-foreground">来源类型</div>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as OpenArchitectureSourceType)}
                className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm"
              >
                {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-xs space-y-1 sm:col-span-2">
              <div className="text-muted-foreground">URL（可选）</div>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs space-y-1 sm:col-span-2">
              <div className="text-muted-foreground">README / 描述 / 关键代码片段</div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="粘贴 README、架构说明、关键代码片段…"
                className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs font-mono"
              />
            </label>
            <label className="text-xs space-y-1 sm:col-span-2">
              <div className="text-muted-foreground">文件树（可选）</div>
              <textarea
                value={fileTree}
                onChange={(e) => setFileTree(e.target.value)}
                rows={5}
                placeholder="src/agent/...\nsrc/plugin/...\nserver/..."
                className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs font-mono"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              分析架构
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md border border-border/50 text-sm text-muted-foreground hover:text-foreground"
            >
              重置
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <h2 className="text-sm font-medium">分析结果</h2>
              <div className="text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Cell label="项目类型" value={result.analysis.projectType} />
                <Cell label="吸收等级" value={ABSORPTION_LEVEL_LABEL[result.analysis.absorptionLevel]} />
                <Cell label="桥接类型" value={BRIDGE_TYPE_LABEL[result.bridgePlan.bridgeType]} />
                <Cell label="优先级" value={result.bridgePlan.recommendedPriority} />
              </div>
              {result.analysis.techStack.length > 0 && (
                <div className="text-xs"><span className="text-muted-foreground">技术栈：</span>{result.analysis.techStack.join("、")}</div>
              )}
              {result.analysis.architecturePattern.length > 0 && (
                <div className="text-xs"><span className="text-muted-foreground">架构模式：</span>{result.analysis.architecturePattern.join("、")}</div>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <h2 className="text-sm font-medium">核心模块 ({result.analysis.modules.length})</h2>
              {result.analysis.modules.length === 0 ? (
                <div className="text-xs text-muted-foreground">未抽取到明确模块。</div>
              ) : (
                <ul className="text-xs space-y-1">
                  {result.analysis.modules.map((m) => (
                    <li key={m.id} className="rounded border border-border/40 p-2">
                      <div className="text-foreground/90">{m.name} <span className="text-muted-foreground">· {LAYER_LABEL[m.layer]}</span></div>
                      <div className="text-muted-foreground">{m.role}</div>
                      <div className="text-foreground/80 mt-1">→ {m.mappableToAether.join("、") || "—"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <h2 className="text-sm font-medium">能力 ({result.analysis.capabilities.length})</h2>
              {result.analysis.capabilities.length === 0 ? (
                <div className="text-xs text-muted-foreground">无。</div>
              ) : (
                <ul className="text-xs space-y-1">
                  {result.analysis.capabilities.map((c) => (
                    <li key={c.id}>
                      <span className="text-foreground/90">{c.name}</span>
                      <span className="text-muted-foreground"> · {CAPABILITY_TYPE_LABEL[c.capabilityType]} · 风险 {c.riskLevel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <h2 className="text-sm font-medium">Bridge Plan</h2>
              <div className="text-xs"><span className="text-muted-foreground">接入系统：</span>{result.bridgePlan.targetSystems.join("、") || "—"}</div>
              {result.bridgePlan.requiredPermissions.length > 0 && (
                <div className="text-xs"><span className="text-muted-foreground">需要权限：</span>{result.bridgePlan.requiredPermissions.join("、")}</div>
              )}
              <ol className="list-decimal pl-4 text-xs space-y-0.5 text-muted-foreground">
                {result.bridgePlan.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {result.bridgePlan.lovablePromptDraft && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary">Lovable Prompt 草案</summary>
                  <pre className="mt-1 text-[11px] bg-muted/30 p-2 rounded whitespace-pre-wrap">{result.bridgePlan.lovablePromptDraft}</pre>
                </details>
              )}
            </div>

            {result.webxxmDraft && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-1 text-xs">
                <h2 className="text-sm font-medium text-violet-400">WebXXM 能力包草案</h2>
                <Cell label="包名" value={result.webxxmDraft.packageName} />
                <Cell label="能力类型" value={CAPABILITY_TYPE_LABEL[result.webxxmDraft.capabilityType]} />
                <Cell label="风险等级" value={result.webxxmDraft.riskLevel} />
                <div><span className="text-muted-foreground">权限：</span>{result.webxxmDraft.permissions.join("、")}</div>
                {result.webxxmDraft.installRequirements.length > 0 && (
                  <div><span className="text-muted-foreground">安装依赖：</span>{result.webxxmDraft.installRequirements.join("、")}</div>
                )}
              </div>
            )}

            {result.analysis.risks.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1 text-xs">
                <h2 className="text-sm font-medium text-amber-500">风险与许可证提示</h2>
                <ul className="list-disc pl-4 text-amber-500/90 space-y-0.5">
                  {result.analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1 text-[11px] text-muted-foreground">
                <h2 className="text-xs font-medium text-foreground">安全策略提示</h2>
                <ul className="list-disc pl-4">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-foreground/90">{value}</div>
    </div>
  );
}
