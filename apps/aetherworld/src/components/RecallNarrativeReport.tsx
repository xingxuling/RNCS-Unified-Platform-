import type { RecallFragment, RecallAnalysisResult } from "@/lib/pastLifeRecallCalculus";
import { RECALL_SAFETY_TEXT } from "@/constants/recallSafetyRules";

export function RecallNarrativeReport({ fragment, result }: { fragment: RecallFragment; result: RecallAnalysisResult }) {
  const md = buildMarkdown(fragment, result);
  const json = JSON.stringify({ fragment, result }, null, 2);

  const copy = (text: string) => navigator.clipboard?.writeText(text);
  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Narrative Report · 叙事报告</div>
      <pre className="text-xs whitespace-pre-wrap bg-background/30 border border-border/30 rounded p-3 max-h-80 overflow-auto">{md}</pre>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => copy(md)} className="text-xs px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30">复制 Markdown</button>
        <button onClick={() => download(`recall-${fragment.id}.md`, md, "text/markdown")} className="text-xs px-3 py-1.5 rounded bg-background/60 hover:bg-background/80 border border-border/40">导出 Markdown</button>
        <button onClick={() => download(`recall-${fragment.id}.json`, json, "application/json")} className="text-xs px-3 py-1.5 rounded bg-background/60 hover:bg-background/80 border border-border/40">导出 JSON</button>
      </div>
      <div className="text-[10px] text-muted-foreground">{RECALL_SAFETY_TEXT}</div>
    </div>
  );
}

function buildMarkdown(f: RecallFragment, r: RecallAnalysisResult): string {
  return `# 潜意识材料 · ${f.title || "未命名"}

> ${RECALL_SAFETY_TEXT}

## 原始记录
- 信号类型：${f.fragmentType}
- 来源情境：${f.sourceContext}
- 描述：${f.description || "（无）"}
- 符号：${f.symbols.join("、") || "（无）"}

## 分析结果
- 调用评分：**${r.recallStrength} / 100**（${r.band}）
- 创作价值：${r.creativeValue}
- 人生模式相关度：${r.lifePatternRelevance}
- 行动风险：${r.actionRisk}
- 污染风险：${r.contaminationRisk}

## 原型匹配
${r.archetypalMatch.map(a => `- ${a}`).join("\n") || "- 无"}

## 五域映射
- 天：${r.fiveDomainMap.heaven}
- 地：${r.fiveDomainMap.earth}
- 人：${r.fiveDomainMap.human}
- 神：${r.fiveDomainMap.spirit}
- 风：${r.fiveDomainMap.wind}
- 主导域：${r.fiveDomainMap.dominantDomain}

## 推荐使用方式
${r.recommendedUse.map(u => `- ${u}`).join("\n")}

---
注：这是象征性分析，不代表真实前世/现实事件断言。
`;
}
