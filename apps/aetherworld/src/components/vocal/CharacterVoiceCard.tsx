import type { CharacterVoiceResult } from "@/lib/vocal/characterVoiceEngine";

export function CharacterVoiceCard({ data }: { data: CharacterVoiceResult }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Character Voice · 角色声线</div>
      <div className="text-base font-medium">{data.characterName}</div>
      <div className="text-xs text-muted-foreground">{data.voiceIdentity}</div>
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div><span className="text-muted-foreground">演唱风格 </span>{data.singingStyle}</div>
        <div><span className="text-muted-foreground">情绪签名 </span>{data.emotionalSignature}</div>
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        {data.recommendedGenres.map((g, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">{g}</span>
        ))}
      </div>
    </div>
  );
}
