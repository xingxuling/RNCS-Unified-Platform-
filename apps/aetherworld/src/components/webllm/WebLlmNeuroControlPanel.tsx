import { listNeuroProfiles } from "@/lib/webllm/webLlmNeuroControlLayer";

export function WebLlmNeuroControlPanel({ value, onChange, report }: {
  value: string;
  onChange: (id: string) => void;
  report?: { status: string; driftScore: number; consistencyScore: number; detailScore: number; executiveGateScore: number; predictionErrorScore: number; notes: string[] } | null;
}) {
  const profiles = listNeuroProfiles();
  const p = profiles.find((x) => x.profileId === value) || profiles[0];
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Neuro Control · 神经启发控制层</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border/40 rounded px-2 py-1 text-sm">
        {profiles.map((x) => <option key={x.profileId} value={x.profileId}>{x.name}（{x.profileId}）</option>)}
      </select>
      <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
        <span>局部细节聚焦</span><span className="text-right font-mono">{p.localDetailFocus}</span>
        <span>预测误差敏感度</span><span className="text-right font-mono">{p.predictionErrorSensitivity}</span>
        <span>一致性阈值</span><span className="text-right font-mono">{p.consistencyThreshold}</span>
        <span>执行闸门严格度</span><span className="text-right font-mono">{p.executiveGateStrictness}</span>
      </div>
      {report && (
        <div className="mt-2 border-t border-border/30 pt-2 space-y-1 text-[11px]">
          <div className="flex justify-between"><span>状态</span><span className="font-mono">{report.status}</span></div>
          <div className="flex justify-between"><span>漂移分</span><span className="font-mono">{report.driftScore.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>一致性</span><span className="font-mono">{report.consistencyScore.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>细节</span><span className="font-mono">{report.detailScore.toFixed(2)}</span></div>
          <ul className="text-muted-foreground">{report.notes.map((n, i) => <li key={i}>• {n}</li>)}</ul>
        </div>
      )}
      <div className="text-[10px] text-muted-foreground/70 leading-relaxed">
        说明：神经启发控制层不是医学诊断，不是对任何神经类型的模拟，仅为工程化的细节聚焦、预测误差检查、上下文漂移检测与执行闸门机制。
      </div>
    </div>
  );
}
