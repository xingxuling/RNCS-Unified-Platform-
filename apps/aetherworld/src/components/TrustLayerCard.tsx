import { ShieldCheck, Lock, FileText, AlertTriangle } from "lucide-react";

export function TrustLayerCard({
  trustMechanism, privacyRequirements, riskWarnings,
}: {
  trustMechanism: string[];
  privacyRequirements: string[];
  riskWarnings: string[];
}) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Trust Layer</div>
      <div className="font-display text-lg gold-text mt-1">信任建立层</div>

      <div className="gold-divider my-3" />

      <Block icon={<ShieldCheck className="w-3.5 h-3.5" />} title="信任机制" items={trustMechanism} tone="primary" />
      <Block icon={<Lock className="w-3.5 h-3.5" />}        title="隐私要求" items={privacyRequirements} tone="good" />
      <Block icon={<AlertTriangle className="w-3.5 h-3.5" />} title="风险声明" items={riskWarnings} tone="warn" />

      <div className="mt-3 text-[10px] text-muted-foreground inline-flex items-center gap-1.5">
        <FileText className="w-3 h-3" /> 所有地区共用基础免责，地区附加项叠加在上方。
      </div>
    </div>
  );
}

function Block({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: "primary" | "good" | "warn"; }) {
  const cls =
    tone === "primary" ? "border-primary/30 bg-primary/5 text-primary" :
    tone === "good"    ? "border-trigger-high/30 bg-trigger-high/5 text-trigger-high" :
                         "border-trigger-mid/30 bg-trigger-mid/5 text-trigger-mid";
  return (
    <div className={`rounded-md border p-3 mb-2 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest">{icon}{title}</div>
      <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/85">
        {items.map((it, i) => (<li key={i}>· {it}</li>))}
      </ul>
    </div>
  );
}
