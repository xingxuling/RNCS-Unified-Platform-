import type { VocalSafetyResult } from "@/lib/vocal/vocalSafetyGuard";
import { ShieldAlert } from "lucide-react";

export function VocalSafetyNote({ safety, note }: { safety: VocalSafetyResult; note: string }) {
  return (
    <div className="aether-card p-4 space-y-2 border border-amber-500/30">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        <div className="text-[10px] uppercase tracking-widest text-amber-500">Vocal Safety · 声乐安全</div>
      </div>
      <pre className="text-[11px] whitespace-pre-wrap font-sans text-muted-foreground">{note}</pre>
      {safety.violations.length > 0 && (
        <div className="text-[11px] space-y-1 pt-1">
          <div className="text-amber-500">检测到以下风险：</div>
          {safety.violations.map((v, i) => (
            <div key={i} className="border-l-2 border-amber-500/50 pl-2">
              <div className="text-[10px] text-muted-foreground">[{v.rule.severity}] {v.rule.description}</div>
              <div>{v.rule.recommendation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
