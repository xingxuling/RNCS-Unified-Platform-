// 单一域可行性评估
import { DOMAIN_CONSTANTS_MAP } from "./realityScienceConstantsEngine";
import { REALITY_SCIENCE_DOMAINS } from "@/constants/realityScienceDomains";
import type { CreationSeed } from "./creationSeedCompiler";
import type { CreationInput } from "./creationSeedCompiler";

export interface DomainScore {
  domainId: string;
  domainName: string;
  score: number;       // 0-100
  weight: number;
  weighted: number;
  topConstants: { id: string; name: string; hint: string }[];
}

// 基于关键词的简单匹配：常数 id 命中 → 加分
function scoreDomain(domainId: string, seed: CreationSeed, input: CreationInput): { score: number; top: DomainScore["topConstants"] } {
  const constants = DOMAIN_CONSTANTS_MAP[domainId] ?? [];
  const text = [seed.name, input.description, input.targetUser, input.targetEnvironment, input.desiredFunction, ...(input.constraints ?? [])].join(" ").toLowerCase();
  const hitMap: Record<string, number> = {
    DIGITAL_PHYSICS: /(重量|散热|阻力|动量|阈值|压力|延迟|摩擦)/.test(text) ? 60 : 50,
    DIGITAL_CHEMISTRY: /(反应|催化|混合|稳定|链式|浓度|术语)/.test(text) ? 60 : 50,
    DIGITAL_BIOLOGY: /(能量|恢复|适应|进化|身体|压力|睡眠|感官)/.test(text) ? 60 : 50,
    DIGITAL_GEOGRAPHY: /(场域|平台|城市|地区|位置|迁移|渠道)/.test(text) ? 60 : 50,
    DIGITAL_ASTRONOMY: /(周期|节律|窗口|季节|月|窗|节奏)/.test(text) ? 60 : 50,
    DIGITAL_ENGINEERING: /(结构|模块|材料|成本|可靠|维护|制造|接口|扩展)/.test(text) ? 70 : 50,
    DIGITAL_INFORMATION: /(数据|信号|噪声|接口|编码|索引|反馈|本地)/.test(text) ? 65 : 50,
    DIGITAL_SOCIOLOGY: /(用户|信任|社群|文化|权威|网络效应|采用)/.test(text) ? 65 : 50,
    DIGITAL_ECONOMICS: /(成本|价格|付费|市场|商业|收益|订阅)/.test(text) ? 65 : 50,
    DIGITAL_AESTHETICS: /(风格|形态|视觉|审美|符号|图标|品牌)/.test(text) ? 60 : 50,
  };
  let score = hitMap[domainId] ?? 50;
  // 描述完整度 +/-
  if (input.targetUser && input.targetEnvironment) score += 5;
  if (!input.description) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const top = constants.slice(0, 3).map(c => ({ id: c.id, name: c.userFriendlyName, hint: c.positiveUse }));
  return { score, top };
}

export function evaluateAllDomains(seed: CreationSeed, input: CreationInput): DomainScore[] {
  return REALITY_SCIENCE_DOMAINS.map(d => {
    const weight = seed.objectType.domainWeights[d.id] ?? 1;
    const { score, top } = scoreDomain(d.id, seed, input);
    return {
      domainId: d.id,
      domainName: d.userFriendlyName,
      score,
      weight,
      weighted: score * weight,
      topConstants: top,
    };
  });
}

export interface FeasibilityAggregation {
  rawScore: number;       // weighted avg → 0-100
  strongest: DomainScore[];
  weakest: DomainScore[];
  domainScores: DomainScore[];
}

export function aggregateFeasibility(scores: DomainScore[]): FeasibilityAggregation {
  const wSum = scores.reduce((s, x) => s + x.weight, 0);
  const weightedSum = scores.reduce((s, x) => s + x.weighted, 0);
  const rawScore = Math.round(weightedSum / Math.max(wSum, 1));
  const sorted = [...scores].sort((a, b) => b.weighted - a.weighted);
  return {
    rawScore,
    strongest: sorted.slice(0, 3),
    weakest: sorted.slice(-3).reverse(),
    domainScores: scores,
  };
}
