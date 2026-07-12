export interface LyricSection {
  section: string;
  lyricText: string;
}

export interface LyricSingingAnalysis {
  section: string;
  lyricText: string;
  emotion: string;
  vocalDelivery: string;
  intensity: number;
  breathingNotes: string[];
  difficultLines: string[];
  rewriteSuggestions?: string[];
}

const SECTION_DEFAULTS: Record<string, { delivery: string; intensity: number; emotion: string }> = {
  intro:      { delivery: "breathy / spoken-sung", intensity: 0.25, emotion: "克制" },
  verse:      { delivery: "restrained mixed voice", intensity: 0.4, emotion: "叙事" },
  preChorus:  { delivery: "rising mixed voice", intensity: 0.6, emotion: "推进" },
  chorus:     { delivery: "belting / mixed", intensity: 0.9, emotion: "爆发" },
  bridge:     { delivery: "restrained / breathy", intensity: 0.55, emotion: "回望" },
  outro:      { delivery: "soft / decay", intensity: 0.4, emotion: "落地" },
};

function classifySection(name: string): keyof typeof SECTION_DEFAULTS {
  const s = name.toLowerCase();
  if (/intro|前奏/.test(s)) return "intro";
  if (/pre.?chorus|预副/.test(s)) return "preChorus";
  if (/chorus|副歌/.test(s)) return "chorus";
  if (/bridge|桥/.test(s)) return "bridge";
  if (/outro|尾|结束/.test(s)) return "outro";
  return "verse";
}

export function parseLyricSections(lyrics: string): LyricSection[] {
  // [Verse] line / [Chorus] line ...
  const lines = lyrics.split(/\r?\n/);
  const out: LyricSection[] = [];
  let current: LyricSection | null = null;
  for (const line of lines) {
    const m = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (m) {
      if (current) out.push(current);
      current = { section: m[1].trim(), lyricText: "" };
    } else if (current) {
      current.lyricText += (current.lyricText ? "\n" : "") + line;
    } else if (line.trim()) {
      current = { section: "Verse", lyricText: line };
    }
  }
  if (current) out.push(current);
  return out.length ? out : [{ section: "Verse", lyricText: lyrics }];
}

export function analyzeLyricSinging(lyrics: string): LyricSingingAnalysis[] {
  const sections = parseLyricSections(lyrics);
  return sections.map(sec => {
    const k = classifySection(sec.section);
    const d = SECTION_DEFAULTS[k];
    const lines = sec.lyricText.split(/\r?\n/).filter(Boolean);
    const difficult = lines.filter(l => l.length > 22 || /[啊呀哦哎]/.test(l));
    const breath: string[] = [];
    lines.forEach((l, i) => {
      if (l.length > 16) breath.push(`第 ${i + 1} 行偏长，建议在中间换气。`);
    });
    if (k === "chorus") breath.push("副歌前完成深呼吸；副歌末尾留余气。");

    const rewrite: string[] = [];
    difficult.slice(0, 2).forEach(l => rewrite.push(`「${l.slice(0, 14)}…」可拆为两句，或减少齿音。`));

    return {
      section: sec.section,
      lyricText: sec.lyricText,
      emotion: d.emotion,
      vocalDelivery: d.delivery,
      intensity: d.intensity,
      breathingNotes: breath,
      difficultLines: difficult,
      rewriteSuggestions: rewrite.length ? rewrite : undefined,
    };
  });
}
