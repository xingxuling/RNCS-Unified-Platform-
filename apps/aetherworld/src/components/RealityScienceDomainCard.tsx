import { getDomain } from "@/constants/realityScienceDomains";
import { getDomainConstants } from "@/lib/realityScienceConstantsEngine";

export function RealityScienceDomainCard({ domainId }: { domainId: string }) {
  const d = getDomain(domainId);
  const constants = getDomainConstants(domainId);
  if (!d) return null;
  return (
    <div className="aether-card p-5 space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{d.name}</div>
        <h3 className="text-lg font-medium">{d.userFriendlyName}</h3>
        <p className="text-xs text-foreground/80 mt-1">{d.description}</p>
      </div>
      <div className="text-[11px] text-muted-foreground">
        影响对象：{d.affectsCreationTypes.slice(0, 5).join("、")}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {constants.map(c => (
          <div key={c.id} className="text-[11px] border-l border-border/40 pl-2 py-0.5">
            <span className="text-foreground">{c.userFriendlyName}</span>
            <span className="text-muted-foreground"> · {c.meaning}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-amber-300/80">忽略风险：{d.riskIfIgnored.join("、")}</div>
    </div>
  );
}
