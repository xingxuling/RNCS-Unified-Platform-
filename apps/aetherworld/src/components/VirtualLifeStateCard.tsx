import { getLifeState } from "@/constants/virtualLifeStates";

export function VirtualLifeStateCard({ stateId }: { stateId: string }) {
  const s = getLifeState(stateId);
  if (!s) return null;
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Life State · 当前生活状态</div>
      <div className="text-lg font-display">{s.userFriendlyName}</div>
      <div className="text-xs text-muted-foreground">{s.description}</div>
      <div>
        <div className="text-[11px] text-foreground">推荐动作</div>
        <ul className="text-[11px] text-muted-foreground mt-0.5">
          {s.recommendedActions.map(a => <li key={a}>· {a}</li>)}
        </ul>
      </div>
      <div className="text-[11px]">
        <span className="text-amber-300/80">风险：</span>
        <span className="text-muted-foreground">{s.risk}</span>
      </div>
      <div className="text-[11px]">
        <span className="text-primary">现实锚点：</span>
        <span className="text-foreground/80">{s.realityAnchor}</span>
      </div>
    </div>
  );
}
