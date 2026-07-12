import { useMemo, useState } from "react";
import { generateFitPrompt, type FitPromptKind, type UIFitResult } from "@/lib/multiClientUIFitEngine";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const KINDS: Array<{ id: FitPromptKind; label: string }> = [
  { id: "MOBILE_SIMPLIFY",    label: "移动端简化" },
  { id: "ENTERPRISE_SAFE_UI", label: "企业安全模式" },
  { id: "DEMO_ONBOARDING",    label: "Demo 引导" },
  { id: "FULL60_PRIVACY_UI",  label: "Full 60 隐私" },
  { id: "ADMIN_CONSOLE",      label: "管理员控制台" },
  { id: "NAV_CLEANUP",        label: "导航整理" },
  { id: "FEEDBACK_VISIBILITY",label: "回验入口可见" },
  { id: "DOC_EXPOSURE",       label: "文档入口强化" },
];

export function UIFitPromptGenerator({ result }: { result: UIFitResult }) {
  const [kind, setKind] = useState<FitPromptKind>("MOBILE_SIMPLIFY");
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => generateFitPrompt(kind, result), [kind, result]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("UI Fit 提示词已复制");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            UI Fit Prompt Generator
          </div>
          <div className="font-display text-lg gold-text">UI 适评提示词生成器</div>
          <div className="text-xs text-muted-foreground mt-1">
            根据当前适配结果，自动生成 Lovable 修复提示词。
          </div>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-primary/40 text-primary text-xs hover:bg-primary/10"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "已复制" : "复制提示词"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {KINDS.map(k => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`px-2.5 py-1.5 rounded border text-[11px] ${
              kind === k.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <pre className="bg-background/60 border border-border/60 rounded-md p-3 text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
{prompt}
      </pre>
    </div>
  );
}
