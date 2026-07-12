import { getClientJourney } from "@/lib/multiClientUIFitEngine";
import { getClientProfile } from "@/constants/clientProfiles";

export function ClientJourneyPreview({ clientId }: { clientId: string }) {
  const client = getClientProfile(clientId);
  const steps = getClientJourney(clientId);

  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Recommended Journey · 推荐旅程
      </div>
      <div className="font-display text-lg gold-text">
        {client.name} 的推荐路径
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">默认首页：{client.defaultHome}</div>

      <div className="gold-divider my-3" />

      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-primary/80 w-6">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-xs text-foreground/85">{s}</span>
            {i < steps.length - 1 && <span className="text-muted-foreground/40 ml-auto">→</span>}
          </li>
        ))}
      </ol>

      <div className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        建议导航：{client.recommendedNavigation}<br />
        主 CTA：<span className="text-primary">{client.primaryCTA}</span>
      </div>
    </div>
  );
}
