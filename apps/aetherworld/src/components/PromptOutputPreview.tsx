// 输出预览 · Prompt Output Preview
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  prompt: string;
  power: number;
}

export function PromptOutputPreview({ prompt, power }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const tone = power >= 80 ? "text-emerald-400" : power >= 60 ? "text-amber-300" : "text-rose-400";
  return (
    <div className="aether-card rounded-md border border-border/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Generated Prompt · 提示词强度
          <span className={`ml-2 ${tone}`}>{power} / 100</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-border/40 hover:border-border"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="text-[11px] leading-relaxed p-3 whitespace-pre-wrap font-mono max-h-[480px] overflow-auto">
        {prompt}
      </pre>
    </div>
  );
}
