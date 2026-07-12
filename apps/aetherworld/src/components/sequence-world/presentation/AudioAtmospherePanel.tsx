import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorldAudioAtmosphere } from "@/lib/sequence-world/presentation/worldAudioAtmosphereEngine";

export function AudioAtmospherePanel({ audio }: { audio: WorldAudioAtmosphere }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">世界声音 · World Audio Atmosphere</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>{audio.ambientStyle}</Badge>
          <Badge variant="secondary">{audio.musicMood}</Badge>
          <span className="text-xs text-muted-foreground">强度 {(audio.intensity * 100).toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground">静默 {(audio.silenceLevel * 100).toFixed(0)}%</span>
        </div>
        <div className="text-xs">乐器：{audio.instrumentation.join("、")}</div>
        <div className="text-xs">声景：{audio.soundscapeKeywords.join("、")}</div>
        {audio.vocalHint && <div className="text-xs">声乐提示：{audio.vocalHint}（可送至 Vocal Engine）</div>}
        <div className="text-xs">事件声效：{audio.eventSoundRules.map(r => `${r.eventType}→${r.soundCue}`).join("；")}</div>
      </CardContent>
    </Card>
  );
}
