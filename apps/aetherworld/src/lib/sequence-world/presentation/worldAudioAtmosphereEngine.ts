import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_AUDIO_HINTS } from "@/constants/sequence-world/presentation/audioAtmosphereTypes";

export interface EventSoundRule {
  eventType: string;
  soundCue: string;
  intensity: number;
}

export interface WorldAudioAtmosphere {
  ambientStyle: string;
  soundscapeKeywords: string[];
  musicMood: string;
  instrumentation: string[];
  vocalHint?: string;
  eventSoundRules: EventSoundRule[];
  silenceLevel: number;
  intensity: number;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateWorldAudioAtmosphere(core: SequenceCoreProfile): WorldAudioAtmosphere {
  const top = core.dominantDigits[0] ?? "5";
  const t = DIGIT_AUDIO_HINTS[top];
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const instrumentation = new Set<string>();
  const keywords = new Set<string>();
  core.dominantDigits.forEach(d => {
    const h = DIGIT_AUDIO_HINTS[d];
    if (!h) return;
    h.instrumentation.forEach(i => instrumentation.add(i));
    keywords.add(h.ambient);
  });

  const intensity = clamp01(
    Object.entries(f).reduce((s, [d, n]) => s + (DIGIT_AUDIO_HINTS[d]?.intensity ?? 0) * (n / total), 0),
  );
  const silenceLevel = clamp01(
    Object.entries(f).reduce((s, [d, n]) => s + (DIGIT_AUDIO_HINTS[d]?.silenceLevel ?? 0) * (n / total), 0),
  );

  const vocalHint = top === "9" ? "ritual_choir" : top === "2" ? "duet" : top === "6" ? "warm_solo" : undefined;

  return {
    ambientStyle: t?.ambient ?? "ambient_pad",
    soundscapeKeywords: Array.from(keywords),
    musicMood: t?.musicMood ?? "balanced",
    instrumentation: Array.from(instrumentation),
    vocalHint,
    eventSoundRules: [
      { eventType: "CONFLICT", soundCue: "tense_drums", intensity: 0.8 },
      { eventType: "RITUAL", soundCue: "choir_bell", intensity: 0.7 },
      { eventType: "DISCOVERY", soundCue: "rising_pad", intensity: 0.5 },
      { eventType: "TERMINAL", soundCue: "orchestral_swell", intensity: 0.9 },
    ],
    silenceLevel,
    intensity,
  };
}
