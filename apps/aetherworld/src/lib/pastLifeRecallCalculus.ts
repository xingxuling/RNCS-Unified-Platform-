// Past-Life Memory & Subconscious Recall Calculus
import { ARCHETYPAL_MEMORY_TYPES } from "@/constants/archetypalMemoryTypes";
import { SYMBOLIC_MEMORY_DOMAINS, findDomainBySymbol } from "@/constants/symbolicMemoryDomains";
import { RECALL_SAFETY_TEXT } from "@/constants/recallSafetyRules";
import type { RecallSourceContext } from "@/constants/recallSignalTypes";

export interface RecallFragment {
  id: string;
  title: string;
  fragmentType: string; // RecallSignalType id
  description: string;
  sourceContext: RecallSourceContext;
  emotionalCharge: number;       // 0-10
  imageIntensity: number;        // 0-10
  recurrenceFrequency: number;   // 0-10
  bodyResonance: number;         // 0-10
  culturalDistance: number;      // 0-10
  narrativeCoherence: number;    // 0-10
  symbols: string[];
  possibleExternalSources: string[];
  createdAt: string;
}

export interface RecallFiveDomainMap {
  heaven: string;
  earth: string;
  human: string;
  spirit: string;
  wind: string;
  dominantDomain: string;
  missingDomain: string[];
}

export interface RecallAnalysisResult {
  recallStrength: number;          // 0-100
  archetypalMatch: string[];
  symbolicDomains: string[];
  emotionalCharge: number;
  contaminationRisk: "LOW" | "MEDIUM" | "HIGH";
  creativeValue: number;           // 0-100
  lifePatternRelevance: number;    // 0-100
  actionRisk: "LOW" | "MEDIUM" | "HIGH";
  recommendedUse: string[];
  safetyNote: string;
  fiveDomainMap: RecallFiveDomainMap;
  band: string;                    // 评分段
  contaminationSources: string[];
}

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

function detectContamination(f: RecallFragment): { level: "LOW" | "MEDIUM" | "HIGH"; sources: string[] } {
  const sources = [...f.possibleExternalSources];
  let score = 0;
  if (sources.length >= 2) score += 2;
  else if (sources.length === 1) score += 1;
  if (f.imageIntensity >= 8 && f.culturalDistance <= 3) score += 2; // 强图像但文化距离低
  if (f.recurrenceFrequency <= 2 && f.emotionalCharge >= 8) score += 1; // 一次性 + 强情绪
  if (f.sourceContext === "CREATIVE_FLASH" && f.imageIntensity >= 8) score += 1;
  const level = score >= 3 ? "HIGH" : score >= 1 ? "MEDIUM" : "LOW";
  return { level, sources };
}

function matchArchetypes(f: RecallFragment): string[] {
  const tags = (f.description + " " + f.symbols.join(" ")).toLowerCase();
  const map: Record<string, string[]> = {
    KING_RULER: ["王", "宫", "冠", "御", "权"],
    WARRIOR: ["战", "剑", "军", "甲", "刀"],
    PRIEST_ORACLE: ["祭", "神", "预言", "仪式", "圣"],
    SCHOLAR_SCRIBE: ["书", "档案", "图书", "文字", "记录"],
    EXILE_WANDERER: ["流亡", "漂", "迁", "异乡"],
    BUILDER_ARCHITECT: ["塔", "城", "桥", "建", "结构"],
    ALCHEMIST: ["炼", "转化", "丹"],
    HEALER: ["医", "疗", "草药"],
    TRICKSTER: ["谜", "戏", "反转"],
    JUDGE: ["审判", "律", "裁"],
    MESSENGER: ["使", "信", "传"],
    FOUNDER: ["奠", "开创", "始"],
    GUARDIAN: ["守", "护", "门"],
    DESTROYER: ["毁", "灭", "终末"],
    WIND_BEARER: ["风"],
    CIVILIZATION_SEED: ["文明", "种子", "重启"],
  };
  const hits: string[] = [];
  for (const [id, kws] of Object.entries(map)) {
    if (kws.some(k => tags.includes(k))) hits.push(id);
  }
  if (hits.length === 0) hits.push("CIVILIZATION_SEED");
  return hits.slice(0, 3);
}

function matchSymbolicDomains(f: RecallFragment): string[] {
  const set = new Set<string>();
  f.symbols.forEach(s => {
    const d = findDomainBySymbol(s);
    if (d) set.add(d.id);
  });
  if (set.size === 0 && f.description) {
    SYMBOLIC_MEMORY_DOMAINS.forEach(d => {
      if (d.symbols.some(s => f.description.includes(s))) set.add(d.id);
    });
  }
  return Array.from(set);
}

function fiveDomainMap(f: RecallFragment, archetypes: string[]): RecallFiveDomainMap {
  const heaven = `${f.sourceContext}·频率${f.recurrenceFrequency}/10`;
  const earth = matchSymbolicDomains(f).join("·") || "未明地点/环境";
  const human = archetypes.includes("RELATIONSHIP_ECHO") ? "关系原型激活" : "以自我观察为主";
  const spirit = archetypes[0] ? `主线原型：${archetypes[0]}` : "主线尚未浮现";
  const wind = f.imageIntensity >= 7 ? "强烈创作冲动" : "缓慢渗透";
  const all = { tian: f.recurrenceFrequency, di: f.symbols.length, ren: f.bodyResonance,
    shen: f.narrativeCoherence, feng: f.imageIntensity };
  const dominantEntry = Object.entries(all).sort((a, b) => b[1] - a[1])[0];
  const missing = Object.entries(all).filter(([, v]) => v <= 2).map(([k]) => k);
  return { heaven, earth, human, spirit, wind, dominantDomain: dominantEntry[0], missingDomain: missing };
}

function bandOf(s: number): string {
  if (s <= 20) return "普通联想";
  if (s <= 40) return "有一定象征价值";
  if (s <= 60) return "值得记录的潜意识材料";
  if (s <= 80) return "高强度原型材料";
  return "极高强度（须加强安全边界）";
}

export function analyzeRecallFragment(f: RecallFragment): RecallAnalysisResult {
  const contamination = detectContamination(f);
  const archetypes = matchArchetypes(f);
  const symbolicDomains = matchSymbolicDomains(f);

  // 公式（线性近似）
  const numerator =
    f.imageIntensity * 1.0 +
    f.emotionalCharge * 0.8 +
    Math.min(symbolicDomains.length * 1.5, 6) +
    f.recurrenceFrequency * 1.2 +
    f.culturalDistance * 0.9 +
    f.narrativeCoherence * 1.0 +
    f.bodyResonance * 1.0;

  const fantasyInflation = f.imageIntensity >= 9 && f.recurrenceFrequency <= 2 ? 1.4 : 1;
  const confirmationBias = f.possibleExternalSources.length >= 2 ? 1.3 : 1;
  const emotionalNoise = f.emotionalCharge >= 9 && f.narrativeCoherence <= 3 ? 1.3 : 1;
  const mediaContam = contamination.level === "HIGH" ? 1.6 : contamination.level === "MEDIUM" ? 1.25 : 1;
  const overMyth = f.description.length > 0 && /命定|必须|唯一/.test(f.description) ? 1.2 : 1;

  const divisor = fantasyInflation * confirmationBias * emotionalNoise * mediaContam * overMyth;
  const raw = (numerator / divisor) * 1.4;
  const recallStrength = clamp(Math.round(raw));

  const creativeValue = clamp(Math.round(
    f.imageIntensity * 6 + f.narrativeCoherence * 4 + symbolicDomains.length * 5,
  ));
  const lifePatternRelevance = clamp(Math.round(
    f.recurrenceFrequency * 7 + f.bodyResonance * 4 + (archetypes.length * 5),
  ));
  const actionRisk: "LOW" | "MEDIUM" | "HIGH" =
    recallStrength >= 80 ? "HIGH" : recallStrength >= 60 ? "MEDIUM" : "LOW";

  const recommendedUse: string[] = [];
  if (creativeValue >= 50) recommendedUse.push("用于小说/世界观/角色设定");
  if (recallStrength >= 40) recommendedUse.push("作为潜意识材料库长期记录");
  if (lifePatternRelevance >= 50) recommendedUse.push("作为自我观察主题");
  if (contamination.level !== "HIGH" && recallStrength >= 60) recommendedUse.push("可转入 Virtual World OS");
  if (recommendedUse.length === 0) recommendedUse.push("先记录，不下结论");

  return {
    recallStrength,
    archetypalMatch: archetypes,
    symbolicDomains,
    emotionalCharge: f.emotionalCharge,
    contaminationRisk: contamination.level,
    creativeValue,
    lifePatternRelevance,
    actionRisk,
    recommendedUse,
    safetyNote: RECALL_SAFETY_TEXT,
    fiveDomainMap: fiveDomainMap(f, archetypes),
    band: bandOf(recallStrength),
    contaminationSources: contamination.sources,
  };
}

export function archetypeMetaById(id: string) {
  return ARCHETYPAL_MEMORY_TYPES.find(a => a.id === id);
}
