// Sequence Interpreter — 把核心 profile 翻译成人话
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import { SEQUENCE_DIGIT_MEANINGS } from "@/constants/sequence-world/sequenceDigitMeanings";

export interface SequenceInterpretation {
  oneLineSummary: string;
  dominantStory: string;
  missingStory: string;
  domainStory: string;
  recommendedFocus: string[];
}

export function interpretSequence(core: SequenceCoreProfile): SequenceInterpretation {
  const domMeanings = core.dominantDigits.map(d => SEQUENCE_DIGIT_MEANINGS[d]?.keyword ?? d);
  const oneLineSummary = `${core.name} · ${core.sequenceMode} · 主导 ${domMeanings.join(" / ")}`;
  const dominantStory = core.dominantDigits.length
    ? `世界主旋律由 ${domMeanings.join("、")} 推动。`
    : `没有显著主导数，世界整体处于均衡态。`;
  const missingStory = core.missingDigits.length
    ? `缺失数 ${core.missingDigits.join("·")}：对应层面在世界中表现较弱，需要外部输入或特殊事件激活。`
    : `数列覆盖完整，世界各层面均有表达。`;
  const dom = core.fiveDomainBias;
  const domainStory = `天 ${dom.heaven}｜地 ${dom.earth}｜人 ${dom.human}｜神 ${dom.spirit}｜风 ${dom.wind}`;
  const recommendedFocus = core.generationBias.slice(0, 3);
  return { oneLineSummary, dominantStory, missingStory, domainStory, recommendedFocus };
}
