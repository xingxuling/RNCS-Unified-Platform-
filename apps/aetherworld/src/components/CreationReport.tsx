import type { CreationSimulationResult } from "@/lib/virtualCreationCalculus";
import { buildLovablePrompt } from "@/lib/virtualCreationCalculus";

export function CreationReport({ result }: { result: CreationSimulationResult }) {
  const md = buildMarkdown(result);
  const prompt = buildLovablePrompt(result);
  const json = JSON.stringify(result, null, 2);

  const copy = (t: string) => navigator.clipboard?.writeText(t);
  const download = (name: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Creation Report · 创造物报告</div>
      <pre className="text-xs whitespace-pre-wrap bg-background/30 border border-border/30 rounded p-3 max-h-72 overflow-auto">{md}</pre>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => copy(md)} className="text-xs px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30">复制 Markdown</button>
        <button onClick={() => copy(prompt)} className="text-xs px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30">复制 Lovable/Codex 提示词</button>
        <button onClick={() => download(`creation-${result.seed.signature}.md`, md, "text/markdown")}
          className="text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40">导出 MD</button>
        <button onClick={() => download(`creation-${result.seed.signature}.json`, json, "application/json")}
          className="text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40">导出 JSON</button>
      </div>
      <div className="text-[10px] text-muted-foreground">{result.safetyNote}</div>
    </div>
  );
}

function buildMarkdown(r: CreationSimulationResult): string {
  return `# 虚拟创造物报告 · ${r.creationName}

> ${r.safetyNote}

- 对象类型：${r.objectTypeName}
- 可行度：**${r.viabilityScore}/100** · ${r.feasibilityLevelName}
- 说明：${r.feasibilityDescription}
- 建议：${r.feasibilityAdvice}

## 最强域
${r.strongestDomains.map(s => `- ${s}`).join("\n")}

## 最弱域
${r.weakestDomains.map(s => `- ${s}`).join("\n")}

## 关键风险
${r.mainRisks.map(x => `- [${x.severity}] ${x.label} — ${x.hitBy.join("；")}`).join("\n") || "- 暂未识别"}

## 设计建议
${r.designRecommendations.map(s => `- ${s}`).join("\n")}

## 第一原型路径
${r.firstPrototypePath.map(s => `- ${s}`).join("\n")}

## 验证计划
${r.validationPlan.map(s => `- ${s}`).join("\n")}

## 演化潜力
${r.evolutionPotential}
`;
}
