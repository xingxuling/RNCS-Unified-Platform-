import type { BreakthroughObjectType } from "@/constants/breakthroughObjectTypes";

export interface FiveDomainMapping {
  heaven: string;
  earth: string;
  human: string;
  spirit: string;
  wind: string;
  strongestDomain: string;
  weakestDomain: string;
  missingDomain: string[];
  interpretation: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  heaven: "天｜时机",
  earth: "地｜场域",
  human: "人｜关系",
  spirit: "神｜主线",
  wind: "风｜变化",
};

const HEAVEN_KEY = /时机|时间|早了|晚了|来不及|等|窗口/;
const EARTH_KEY = /平台|地方|城市|环境|资源|场域|渠道/;
const HUMAN_KEY = /用户|对方|关系|团队|朋友|家人|反馈|沟通/;
const SPIRIT_KEY = /意义|主线|价值|为什么|方向|长期/;
const WIND_KEY = /传播|变化|发布|出口|结果|触发|爆/;

export function mapFiveDomains(text: string, type: BreakthroughObjectType): FiveDomainMapping {
  const scores: Record<string, number> = { heaven: 0, earth: 0, human: 0, spirit: 0, wind: 0 };
  if (HEAVEN_KEY.test(text)) scores.heaven += 2;
  if (EARTH_KEY.test(text)) scores.earth += 2;
  if (HUMAN_KEY.test(text)) scores.human += 2;
  if (SPIRIT_KEY.test(text)) scores.spirit += 2;
  if (WIND_KEY.test(text)) scores.wind += 2;
  type.defaultDomains.forEach((d) => { scores[d] = (scores[d] ?? 0) + 1; });

  const interp = (k: string) => {
    switch (k) {
      case "heaven": return HEAVEN_KEY.test(text) ? "出现时间敏感线索，需判断窗口。" : "时机线索较弱，默认按对象常规节律评估。";
      case "earth":  return EARTH_KEY.test(text) ? "依赖具体场域/平台/资源。" : "场域线索较弱，需补环境信息。";
      case "human":  return HUMAN_KEY.test(text) ? "涉及关键人/用户/反馈。" : "未明确关键人，需要补充用户/对手/关键人。";
      case "spirit": return SPIRIT_KEY.test(text) ? "存在主线/价值判断。" : "主线不清，建议先写一句价值。";
      case "wind":   return WIND_KEY.test(text) ? "关注变化与出口。" : "出口/触发不明确。";
    }
    return "";
  };

  const entries = Object.entries(scores);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];
  const missing = entries.filter(([, v]) => v === 0).map(([k]) => DOMAIN_LABELS[k]);

  return {
    heaven: interp("heaven")!,
    earth: interp("earth")!,
    human: interp("human")!,
    spirit: interp("spirit")!,
    wind: interp("wind")!,
    strongestDomain: DOMAIN_LABELS[strongest],
    weakestDomain: DOMAIN_LABELS[weakest],
    missingDomain: missing,
    interpretation: `强域：${DOMAIN_LABELS[strongest]}；弱域：${DOMAIN_LABELS[weakest]}。优先补弱域。`,
  };
}

export const DOMAIN_LABEL_MAP = DOMAIN_LABELS;
