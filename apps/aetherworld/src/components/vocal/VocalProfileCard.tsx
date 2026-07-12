import type { VocalProfile } from "@/lib/vocal/vocalProfileEngine";
import { getVocalType } from "@/constants/vocal/vocalTypes";

export function VocalProfileCard({ profile }: { profile: VocalProfile }) {
  const t = getVocalType(profile.voiceType);
  const Row = ({ label, val }: { label: string; val: number }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded bg-secondary/40 overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.round(val * 100)}%` }} />
      </div>
      <span className="font-mono w-10 text-right">{Math.round(val * 100)}</span>
    </div>
  );
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vocal Profile · 声线画像</div>
          <div className="text-sm font-medium mt-0.5">{profile.name}</div>
        </div>
        <div className="text-xs px-2 py-1 rounded border border-border bg-secondary/30">
          {t.name} · {profile.vocalWeight}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{t.description}</div>
      <div className="space-y-1.5">
        <Row label="brightness" val={profile.brightness} />
        <Row label="breathiness" val={profile.breathiness} />
        <Row label="tension" val={profile.tension} />
        <Row label="warmth" val={profile.warmth} />
        <Row label="sharpness" val={profile.sharpness} />
        <Row label="drama" val={profile.dramaticIntensity} />
      </div>
      {profile.riskNotes.length > 0 && (
        <div className="text-[11px] text-amber-500/90 space-y-0.5 pt-1">
          {profile.riskNotes.map((r, i) => <div key={i}>• {r}</div>)}
        </div>
      )}
    </div>
  );
}
