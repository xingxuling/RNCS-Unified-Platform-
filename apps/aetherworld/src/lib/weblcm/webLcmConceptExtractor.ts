import type { AetherConcept } from "./webLcmTypes";
import { newId } from "./webLcmTypes";
import type { WebLcmConceptType } from "@/constants/weblcm/webLcmConceptTypes";
import type { WebLcmConceptSource } from "@/constants/weblcm/webLcmConceptSources";
import { evaluateWebLcmSafety } from "./webLcmSafetyGuard";

export interface ExtractConceptsInput {
  text?: string;
  sourceType: WebLcmConceptSource;
  sourceObjectId?: string;
  hintConceptType?: WebLcmConceptType;
  language?: string;
  domainTags?: string[];
}

const KEYWORD_TYPE_HINTS: { keywords: RegExp; type: WebLcmConceptType }[] = [
  { keywords: /错误|error|exception|failed|失败/i,            type: "ERROR_CONCEPT" },
  { keywords: /修复|patch|fix|补丁/i,                        type: "PATCH_CONCEPT" },
  { keywords: /世界|world|文明|region/i,                     type: "WORLD_CONCEPT" },
  { keywords: /角色|character|npc|英雄/i,                    type: "CHARACTER_CONCEPT" },
  { keywords: /剧情|story|narrative|quest|事件/i,            type: "NARRATIVE_CONCEPT" },
  { keywords: /歌|song|歌词|声乐|vocal|music/i,              type: "VOCAL_CONCEPT" },
  { keywords: /app|应用|项目|product/i,                       type: "APP_CONCEPT" },
  { keywords: /代码|code|module|component|文件|file/i,        type: "CODE_CONCEPT" },
  { keywords: /计算法|calculus|formula|公式/i,                type: "CALCULUS_CONCEPT" },
  { keywords: /常数|constant|定律/i,                          type: "CONSTANT_CONCEPT" },
  { keywords: /工作流|workflow|流程/i,                        type: "WORKFLOW_CONCEPT" },
  { keywords: /情绪|emotion|愤怒|喜悦|悲伤/i,                 type: "EMOTION_CONCEPT" },
  { keywords: /风格|style|美学|曲风/i,                        type: "STYLE_CONCEPT" },
  { keywords: /风险|risk|危险/i,                              type: "RISK_CONCEPT" },
  { keywords: /治理|governance|宪法|policy/i,                 type: "GOVERNANCE_CONCEPT" },
  { keywords: /agent|代理|绑定/i,                             type: "AGENT_CONCEPT" },
  { keywords: /系统|system|runtime/i,                         type: "SYSTEM_CONCEPT" },
];

function splitSentences(text: string): string[] {
  return text.split(/[\n。！？!?;；]+/).map(s => s.trim()).filter(s => s.length >= 2).slice(0, 24);
}

function inferType(sentence: string, hint?: WebLcmConceptType): WebLcmConceptType {
  if (hint) return hint;
  for (const { keywords, type } of KEYWORD_TYPE_HINTS) {
    if (keywords.test(sentence)) return type;
  }
  return "INTENT_CONCEPT";
}

function extractKeywords(sentence: string): string[] {
  const tokens = sentence
    .replace(/[，。、,.;:!?！？；：()（）\[\]【】"'""'']/g, " ")
    .split(/\s+/)
    .filter(t => t.length >= 2 && t.length <= 16);
  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 6);
}

export function extractConcepts(input: ExtractConceptsInput): AetherConcept[] {
  const rawText = (input.text ?? "").trim();
  if (!rawText) return [];
  const safety = evaluateWebLcmSafety(rawText);
  const safeText = safety.sanitizedText ?? rawText;
  const sentences = splitSentences(safeText);
  const concepts: AetherConcept[] = [];
  const createdAt = new Date().toISOString();
  for (const sentence of sentences) {
    const conceptType = inferType(sentence, input.hintConceptType);
    const keywords = extractKeywords(sentence);
    if (keywords.length === 0) continue;
    const title = keywords.slice(0, 2).join(" · ") || sentence.slice(0, 12);
    concepts.push({
      conceptId: newId("cpt"),
      title,
      conceptType,
      sourceType: input.sourceType,
      sourceObjectId: input.sourceObjectId,
      sourceText: sentence.slice(0, 200),
      summary: sentence.length > 120 ? sentence.slice(0, 117) + "…" : sentence,
      keywords,
      language: input.language ?? "zh",
      abstractionLevel: sentence.length > 60 ? "MEDIUM" : "LOW",
      domainTags: input.domainTags ?? [],
      calculusTags: [],
      constantTags: [],
      worldTags: [],
      personalityBiasTags: [],
      confidence: Math.min(0.95, 0.45 + keywords.length * 0.08),
      safetyNotes: safety.warnings,
      createdAt,
    });
  }
  return concepts.slice(0, 12);
}
