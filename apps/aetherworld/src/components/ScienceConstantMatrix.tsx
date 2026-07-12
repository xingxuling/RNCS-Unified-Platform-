import { REALITY_SCIENCE_DOMAINS } from "@/constants/realityScienceDomains";
import { DOMAIN_CONSTANTS_MAP } from "@/lib/realityScienceConstantsEngine";

export function ScienceConstantMatrix() {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Science Constant Matrix · 常数矩阵</div>
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="text-muted-foreground">
            <tr><th className="text-left py-1">域</th><th className="text-left py-1">数量</th><th className="text-left py-1">关键常数</th></tr>
          </thead>
          <tbody>
            {REALITY_SCIENCE_DOMAINS.map(d => (
              <tr key={d.id} className="border-t border-border/30">
                <td className="py-1.5">{d.userFriendlyName}</td>
                <td className="py-1.5">{(DOMAIN_CONSTANTS_MAP[d.id] ?? []).length}</td>
                <td className="py-1.5 text-muted-foreground">{d.keyConstants.slice(0, 5).join("·")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
