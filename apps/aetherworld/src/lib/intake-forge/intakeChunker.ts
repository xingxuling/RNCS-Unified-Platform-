// 投喂铸造炉 · 切片
// 根据 SourceType 决定切片粒度：对话按轮、代码按文件 / 函数、文档按章节。
import type {
  IntakeChunk,
  IntakeChunkType,
  IntakeSampleType,
  IntakeSourceType,
} from "./intakeForgeTypes";
import { nextIntakeId } from "./intakeForgeTypes";
import { sanitizeIntakeText } from "./intakeSanitizer";

const MAX_CHUNKS = 60;
const MAX_CHUNK_CHARS = 1600;

function chunkTypeOf(sourceType: IntakeSourceType): IntakeChunkType {
  switch (sourceType) {
    case "CHATGPT_CONVERSATION":
    case "CHATGPT_COMPRESSED_EXPORT":
      return "DIALOGUE";
    case "LOVABLE_PROMPT":
      return "PROMPT";
    case "LOVABLE_RESULT":
      return "RESULT";
    case "CODE_PROJECT":
    case "PROJECT_FOLDER":
      return "CODE";
    case "MSL_STATE":
      return "MSL";
    case "WORLD_CREATIVE":
      return "WORLD";
    case "BUG_AUDIT":
      return "BUG";
    case "README_DOC":
    case "AETHERWORLD_INTERNAL_DOC":
    case "OPEN_ARCHITECTURE_DOC":
    case "NETWORK_SOURCE":
    case "RECORD_CENTER_EXPORT":
      return "DOC";
    default:
      return "UNKNOWN";
  }
}

function splitByPattern(text: string, pattern: RegExp): string[] {
  const parts = text.split(pattern).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

function splitText(text: string, sourceType: IntakeSourceType): string[] {
  // 对话：按 user:/assistant: 或常见角色行切
  if (sourceType === "CHATGPT_CONVERSATION" || sourceType === "CHATGPT_COMPRESSED_EXPORT") {
    return splitByPattern(text, /\n(?=(?:user|assistant|system|用户|助手)[:：])/i);
  }
  // 代码：按文件分隔（--- File / // FILE / === FILE）或大于阈值切
  if (sourceType === "CODE_PROJECT" || sourceType === "PROJECT_FOLDER") {
    const fileSep = splitByPattern(text, /\n(?=(?:===\s*File|---\s*File|\/\/\s*FILE|\/\*\s*FILE|#\s*FILE).*\n)/i);
    if (fileSep.length > 1) return fileSep;
  }
  // 文档：按二级标题 / 双换行
  if (
    sourceType === "README_DOC" ||
    sourceType === "AETHERWORLD_INTERNAL_DOC" ||
    sourceType === "OPEN_ARCHITECTURE_DOC"
  ) {
    return splitByPattern(text, /\n(?=#{1,3}\s)/);
  }

  // 默认：按双换行 / 段落
  const paragraphs = splitByPattern(text, /\n\s*\n/);
  if (paragraphs.length >= 2) return paragraphs;

  // 兜底：按长度切
  const out: string[] = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK_CHARS) {
    out.push(text.slice(i, i + MAX_CHUNK_CHARS));
  }
  return out;
}

function candidateSamples(
  sourceType: IntakeSourceType,
  chunkType: IntakeChunkType,
): IntakeSampleType[] {
  switch (sourceType) {
    case "CHATGPT_COMPRESSED_EXPORT":
      return ["STRUCTURED_REASONING", "CIVILIZATION_SEED_COMPILATION", "LOVABLE_HANDOFF", "CALCULUS_ROUTING", "AGENT_PANEL", "SEQUENCE_PREDICTION", "SYSTEM_DESIGN"];
    case "CHATGPT_CONVERSATION":
      return ["STRUCTURED_REASONING", "CALCULUS_ROUTING", "AGENT_PANEL"];
    case "LOVABLE_PROMPT":
      return ["LOVABLE_PROMPT_SAMPLE", "SYSTEM_IMPLEMENTATION_INSTRUCTION", "ACCEPTANCE_CRITERIA_SAMPLE"];
    case "LOVABLE_RESULT":
      return ["CHANGELOG_SAMPLE", "BUG_AUDIT_SAMPLE", "SYSTEM_STATE_SAMPLE", "QA_VERIFICATION_SAMPLE"];
    case "MSL_STATE":
      return ["MSL_GENERATION", "STATE_CLASSIFICATION", "STATUS_VALIDATION"];
    case "CODE_PROJECT":
    case "PROJECT_FOLDER":
      return ["CODE_ASSIST", "OPEN_ARCHITECTURE_SAMPLE", "PROJECT_FUSION_SAMPLE", "ARCHITECTURE_MAPPING"];
    case "WORLD_CREATIVE":
      return ["WORLD_GENERATION", "NARRATIVE_SAMPLE", "CHARACTER_SAMPLE", "VOCAL_PROMPT_SAMPLE"];
    case "BUG_AUDIT":
    case "RECORD_CENTER_EXPORT":
      return ["SYSTEM_QA_SAMPLE", "VERIFICATION_REVIEW", "PRODUCT_EVOLUTION_SAMPLE", "BUG_AUDIT_SAMPLE"];
    case "OPEN_ARCHITECTURE_DOC":
      return ["OPEN_ARCHITECTURE_SAMPLE", "ARCHITECTURE_MAPPING"];
    default:
      return chunkType === "CODE" ? ["CODE_ASSIST"] : ["STRUCTURED_REASONING"];
  }
}

function qualityScore(text: string, chunkType: IntakeChunkType): number {
  if (!text) return 0;
  const len = text.length;
  let s = 0.4;
  if (len >= 100 && len <= 2000) s += 0.3;
  if (chunkType !== "UNKNOWN") s += 0.15;
  if (/\n/.test(text)) s += 0.05;
  if (/[？?。.！!]/.test(text)) s += 0.05;
  if (len < 30) s = Math.min(s, 0.3);
  return Math.min(1, Math.max(0, Number(s.toFixed(2))));
}

function estimateTokens(text: string): number {
  // 粗估：英文 4 字符 / token，中文 2 字符 / token；取折中 3。
  return Math.ceil(text.length / 3);
}

export function chunkIntakeText(opts: {
  intakeItemId: string;
  sanitizedText: string;
  sourceType: IntakeSourceType;
}): IntakeChunk[] {
  const ct = chunkTypeOf(opts.sourceType);
  const parts = splitText(opts.sanitizedText, opts.sourceType).slice(0, MAX_CHUNKS);

  return parts.map((part, idx) => {
    // 二次脱敏（防漏网）
    const san = sanitizeIntakeText(part);
    const preview = san.sanitizedText.slice(0, 240);
    return {
      id: nextIntakeId("IFC"),
      intakeItemId: opts.intakeItemId,
      chunkIndex: idx,
      textPreview: preview,
      tokenEstimate: estimateTokens(part),
      chunkType: ct,
      sampleCandidates: candidateSamples(opts.sourceType, ct),
      qualityScore: qualityScore(part, ct),
      safetyStatus: san.safetyStatus,
    };
  });
}
