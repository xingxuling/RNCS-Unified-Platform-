import { BookOpen } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";

export function QADocumentationConsistency({ result }: { result: QAScanResult }) {
  const undocumented = result.modules.filter((m) => !m.documented);
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Documentation Consistency · 文档一致性
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">代码 ↔ 文档</h2>
        <span className="text-[11px] text-muted-foreground">
          一致性 {result.documentationConsistencyScore}/100
        </span>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-2">
        {result.modules.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-md border border-border/60 bg-secondary/15">
            <div className="min-w-0">
              <div className="text-[11px] truncate">{m.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{m.en}</div>
            </div>
            <span className={`text-[10px] shrink-0 ${m.documented ? "text-emerald-300" : "text-rose-300"}`}>
              {m.documented ? "已文档化" : "缺文档"}
            </span>
          </div>
        ))}
      </div>

      {undocumented.length === 0 && (
        <div className="mt-3 text-[11px] text-emerald-300">
          所有核心模块已登记到产品文档中心。
        </div>
      )}
    </div>
  );
}
