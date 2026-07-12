import { useMemo, useState } from "react";
import { Copy, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateBulkFixPrompt,
  generateFixPrompt,
  type QAIssue,
  type QAScanResult,
} from "@/lib/softwareQAFeedbackCalculus";
import { QA_SEVERITY_META } from "@/constants/qaSeverityLevels";
import { toast } from "sonner";

interface Props {
  result: QAScanResult;
  focusIssue?: QAIssue | null;
}

export function QAFixPromptGenerator({ result, focusIssue }: Props) {
  const [mode, setMode] = useState<"single" | "bulk">(focusIssue ? "single" : "bulk");
  const [selected, setSelected] = useState<QAIssue | null>(focusIssue ?? result.issues[0] ?? null);

  // 当外部 focusIssue 变更时切换
  useMemo(() => {
    if (focusIssue) {
      setSelected(focusIssue);
      setMode("single");
    }
  }, [focusIssue]);

  const topIssues = useMemo(() => {
    const order = ["BLOCKER", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
    return [...result.issues].sort(
      (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
    ).slice(0, 10);
  }, [result.issues]);

  const text = mode === "single"
    ? (selected ? generateFixPrompt(selected) : "暂未选择问题。")
    : generateBulkFixPrompt(topIssues);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("提示词已复制，可直接粘贴给 Lovable。");
    } catch {
      toast.error("复制失败，请手动选中复制。");
    }
  };

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Fix Prompt Generator · Lovable 修复提示词
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1 gap-3 flex-wrap">
        <h2 className="font-display text-lg gold-text">一键生成下一轮修复提示词</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant={mode === "single" ? "default" : "outline"}
            className="h-7 text-[11px]" onClick={() => setMode("single")}
          >单条</Button>
          <Button
            size="sm" variant={mode === "bulk" ? "default" : "outline"}
            className="h-7 text-[11px]" onClick={() => setMode("bulk")}
          >Top 10 批量</Button>
        </div>
      </div>

      {mode === "single" && (
        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">选择问题</label>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setSelected(result.issues.find((i) => i.id === e.target.value) ?? null)}
            className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs"
          >
            {result.issues.length === 0 && <option>暂无问题</option>}
            {result.issues.map((i) => (
              <option key={i.id} value={i.id}>
                [{QA_SEVERITY_META[i.severity].cn}] {i.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <Textarea
        readOnly
        value={text}
        rows={14}
        className="mt-3 font-mono text-[11px] leading-relaxed"
      />

      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          提示词遵循"不破坏现有计算法、保留隔离与安全边界"的硬约束。
        </div>
        <Button size="sm" onClick={copy} className="h-7 text-[11px]">
          <Copy className="w-3 h-3 mr-1" /> 复制
        </Button>
      </div>
    </div>
  );
}
