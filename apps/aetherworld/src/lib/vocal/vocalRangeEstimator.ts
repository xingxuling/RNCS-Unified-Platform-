import { VOCAL_RANGES, VocalRangeId, getRange } from "@/constants/vocal/vocalRanges";

export interface VocalRangeInput {
  rangeId: VocalRangeId;
  userNote?: string;
  songKey?: string;
}

export interface VocalRangeResult {
  estimatedComfortRange: string;
  riskyRange: string;
  recommendedSongKey: string;
  transposeAdvice: string;
  practiceFocus: string[];
  warning: string;
}

export function estimateVocalRange(input: VocalRangeInput): VocalRangeResult {
  const r = getRange(input.rangeId);
  const note = (input.userNote ?? "").trim();

  const practice: string[] = [];
  if (/高音.*紧|high.*tight|飙.*吃力/i.test(note)) {
    practice.push("先做高位 lip trill 与 ‘ng’ 共鸣练习，避免直接强混。");
    practice.push("练混声而非纯胸声推高。");
  }
  if (/低音.*哑|low.*weak/i.test(note)) {
    practice.push("放松喉位，多做胸声共鸣练习。");
  }
  if (practice.length === 0) {
    practice.push("热身 5–10 分钟（lip trill + sirens）。");
    practice.push("从舒适音域开始，逐步靠近副歌目标音。");
  }

  let transpose = "建议先按推荐 Key 试唱。";
  if (input.songKey && /[A-G]/i.test(input.songKey)) {
    transpose = `当前 Key=${input.songKey}；如副歌吃力，向下移调 2–3 个半音（capo 或软件 transpose）。`;
  }

  return {
    estimatedComfortRange: r.comfortRange,
    riskyRange: r.riskyRange,
    recommendedSongKey: r.defaultKey,
    transposeAdvice: transpose,
    practiceFocus: practice,
    warning: "当前为文本估算，不是医学或专业声乐测评。如果出现持续不适请就医或咨询声乐老师。",
  };
}

export const VOCAL_RANGE_OPTIONS = VOCAL_RANGES.map(r => ({ id: r.id, label: `${r.name} · ${r.en}` }));
