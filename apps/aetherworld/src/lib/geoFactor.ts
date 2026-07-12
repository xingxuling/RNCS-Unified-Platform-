// 地理位置因素引擎
import { GEO_PRESETS, type GeoPreset } from "@/constants/geoFactors";
import { clamp } from "./math";

export interface GeoFactorResult {
  preset: GeoPreset;
  score: number; // 0-100
  highlights: string[];
  resistance: string[];
  bestAction: string;
  bestProduct: string;
  stageReady: boolean;
  migrationAdvice: string;
}

export function evaluateGeo(presetKey: string, stage: "Idea" | "Architecture" | "Prototype" | "Internal Test" | "Release Candidate"): GeoFactorResult {
  const preset = GEO_PRESETS.find((g) => g.key === presetKey) ?? GEO_PRESETS[0];
  const s = preset.scores;
  const score = Math.round(clamp(
    (s.institution + s.resource + s.culture + s.market + s.physical + s.network + s.cost + s.strategic + s.stageFit) / 9,
    0, 100,
  ));

  const bestAction =
    s.network >= 75 ? "约见关键人 / 建立小圈层" :
    s.market >= 80 ? "做面向本地的小规模付费测试" :
    s.institution >= 80 ? "走制度路径（高校 / 企业 / 政府）" :
                          "线上扩散 + 远程协作";
  const bestProduct =
    s.market >= 85 ? "C 端可付费工具" :
    s.institution >= 80 ? "B 端 / 高校 / 机构方案" :
    s.network >= 75 ? "圈层型咨询 / IP 型产品" :
                      "SaaS / 内容型产品";

  const stageScore = score + (stage === "Internal Test" ? 5 : stage === "Release Candidate" ? -5 : 0);
  const stageReady = stageScore >= 70;

  const migrationAdvice =
    score >= 80 ? "留守此地推进。" :
    score >= 65 ? "以此地为主，线上化补足。" :
    score >= 50 ? "本阶段建议线上化，下一阶段再决定是否迁移。" :
                  "考虑迁移到更高适配地点或全面线上化。";

  return {
    preset, score,
    highlights: preset.highlights, resistance: preset.resistance,
    bestAction, bestProduct, stageReady, migrationAdvice,
  };
}
