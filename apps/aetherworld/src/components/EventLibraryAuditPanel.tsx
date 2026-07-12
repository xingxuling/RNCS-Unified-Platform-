import { useMemo, useState } from "react";
import { generateCompletionPrompt, type EventLibraryAuditResult } from "@/lib/eventLibraryAudit";

export function EventLibraryAuditPanel({ audit }: { audit: EventLibraryAuditResult }) {
  const prompt = useMemo(() => generateCompletionPrompt(audit), [audit]);
  const [copied, setCopied] = useState(false);

  return (
    <div className="aether-card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Completion Prompt · 事件库补全提示词
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            自动根据审计结果生成下一轮 Lovable 提示词。强制约束：不新增重复事件、不破坏 eventId、不混淆阶段/表现/风险。
          </div>
        </div>
        <button
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-secondary/30"
          onClick={async () => {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "已复制" : "复制提示词"}
        </button>
      </div>
      <pre className="mt-3 max-h-80 overflow-auto text-[11px] leading-relaxed bg-background/40 border border-border rounded p-3 whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
}
