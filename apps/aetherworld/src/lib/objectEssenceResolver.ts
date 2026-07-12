import { resolveOntologyType, type ObjectOntologyType } from "@/constants/objectOntologyTypes";
import { resolveEssenceLevel } from "@/constants/objectEssenceTypes";

export interface ObjectEssence {
  essenceStatement: string;
  notThis: string[];
  coreNeed: string;
  coreDrive: string;
  coreFunction: string;
  essenceConfidence: number;
  confidenceLevel: string;
}

export function resolveObjectEssence(input: { name: string; description: string; typeId: string }): ObjectEssence {
  const t: ObjectOntologyType = resolveOntologyType(input.typeId);
  const text = (input.description || "").trim();
  const len = text.length;
  // Heuristic confidence
  const lenScore = Math.min(60, Math.floor(len / 4));
  const keywordBonus = /[，。、：；]/.test(text) ? 10 : 0;
  const negationBonus = /(不是|并非|不属于)/.test(text) ? 15 : 0;
  const namedBonus = input.name.trim() ? 10 : 0;
  const confidence = Math.max(10, Math.min(95, lenScore + keywordBonus + negationBonus + namedBonus));
  const level = resolveEssenceLevel(confidence);

  const notThis = extractNotThis(text, t);
  const essenceStatement =
    text
      ? `${input.name || "该对象"}的本质 = ${shorten(text, 60)}（在「${t.userFriendlyName}」语境下）`
      : `${input.name || "该对象"}的本质待补充：${t.defaultEssenceQuestions[0]}`;
  return {
    essenceStatement,
    notThis,
    coreNeed: inferCoreNeed(text, t),
    coreDrive: inferCoreDrive(text, t),
    coreFunction: inferCoreFunction(text, t),
    essenceConfidence: confidence,
    confidenceLevel: level.label,
  };
}

function shorten(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

function extractNotThis(text: string, t: ObjectOntologyType): string[] {
  const negations = text.match(/(?:不是|并非|不属于)[^。，；\n]+/g) || [];
  const baseline = t.commonMislabels.map(m => `不是「${m}」`);
  return Array.from(new Set([...negations.map(s => s.trim()), ...baseline])).slice(0, 5);
}

function inferCoreNeed(text: string, t: ObjectOntologyType) {
  if (/需求|想要|希望|缺/.test(text)) return text.match(/(?:需求|想要|希望|缺)[^。，；\n]{0,30}/)![0];
  return `${t.userFriendlyName}的核心需求待明确`;
}
function inferCoreDrive(text: string, t: ObjectOntologyType) {
  if (/动机|驱动|为了/.test(text)) return text.match(/(?:动机|驱动|为了)[^。，；\n]{0,30}/)![0];
  return `${t.userFriendlyName}的核心驱动待明确`;
}
function inferCoreFunction(text: string, t: ObjectOntologyType) {
  if (/作用|功能|用于/.test(text)) return text.match(/(?:作用|功能|用于)[^。，；\n]{0,30}/)![0];
  return `${t.userFriendlyName}的核心功能待明确`;
}
