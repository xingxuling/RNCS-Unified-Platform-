import type { RegionProfile } from "@/constants/regionProfiles";
import { Globe, Languages, Shield, Sparkles, Cpu, CreditCard, EyeOff } from "lucide-react";

export function RegionProfileCard({ profile }: { profile: RegionProfile }) {
  const stats = [
    { icon: Sparkles, label: "神秘接受度", value: profile.mysticalTolerance },
    { icon: Cpu,      label: "AI 接受度",  value: profile.aiAcceptance },
    { icon: CreditCard, label: "付费准备", value: profile.paymentReadiness },
    { icon: EyeOff,   label: "隐私敏感",   value: profile.privacySensitivity },
    { icon: Shield,   label: "产品理解",   value: profile.productComprehensionLevel },
  ];
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Region Profile</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{profile.flag}</span>
            <div>
              <div className="font-display text-xl gold-text">{profile.regionName}</div>
              <div className="text-[11px] text-muted-foreground">{profile.regionEn}</div>
            </div>
          </div>
        </div>
        <Globe className="w-5 h-5 text-primary/60" />
      </div>

      <div className="gold-divider my-4" />

      <div className="space-y-2.5">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><s.icon className="w-3 h-3" />{s.label}</span>
              <span className="font-mono text-foreground/80">{s.value}</span>
            </div>
            <div className="h-1 rounded-full bg-muted/20 overflow-hidden mt-1">
              <div className="h-full bg-primary/70 rounded-full" style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="gold-divider my-4" />

      <div className="space-y-2 text-xs text-foreground/85">
        <Row icon={<Languages className="w-3 h-3" />} label="语言偏好" value={profile.languagePreference.join(" / ")} />
        <Row label="文化敏感" value={profile.culturalSensitivity.join("、")} />
        <Row label="信任路径" value={profile.trustPath} />
        <Row label="语气" value={profile.preferredTone} />
        <Row label="最佳入口" value={profile.bestEntryPoint} />
        <Row label="付费模式" value={profile.monetizationFit} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <div className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground pt-0.5 inline-flex items-center gap-1">
        {icon}{label}
      </div>
      <div className="flex-1">{value}</div>
    </div>
  );
}
