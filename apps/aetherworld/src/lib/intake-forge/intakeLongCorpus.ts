// 投喂吸收率修正 · 长语料切片器
// 不丢弃原文：基于已脱敏文本生成 RawCorpusDocument + LongCorpusChunk。
import type { IntakeSafetyStatus } from "./intakeForgeTypes";
import { nextIntakeId } from "./intakeForgeTypes";
import type {
  IntakeMode,
  LongCorpusChunk,
  LongCorpusChunkType,
  LongCorpusTargetUse,
  RawCorpusDocument,
} from "./intakeAbsorptionTypes";
import { DEFAULT_INTAKE_CHUNK_CONFIG } from "./intakeAbsorptionTypes";

/** token = char/3 的折中估算（中英混合） */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3);
}

/** 简易指纹（避免存全文时仍可追溯） */
export function fingerprintOf(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return `fp_${(h >>> 0).toString(36)}_${text.length.toString(36)}`;
}

interface BuildRawDocOpts {
  intakeRunId: string;
  intakeItemId: string;
  sourceName: string;
  sourceType: RawCorpusDocument["sourceType"];
  sanitizedText: string;
  safetyStatus: IntakeSafetyStatus;
  language?: string;
  licenseStatus?: string;
}

/** PASS / WARN 保留原文；BLOCK 仅指纹 */
export function buildRawCorpusDocument(opts: BuildRawDocOpts): RawCorpusDocument {
  const charCount = opts.sanitizedText.length;
  const rawTokenEstimate = estimateTokens(opts.sanitizedText);
  const store = opts.safetyStatus !== "BLOCK";
  return {
    id: nextIntakeId("IFI") + "_raw",
    intakeRunId: opts.intakeRunId,
    intakeItemId: opts.intakeItemId,
    sourceName: opts.sourceName,
    sourceType: opts.sourceType,
    rawText: store ? opts.sanitizedText : "",
    rawTextStored: store,
    fingerprint: fingerprintOf(opts.sanitizedText),
    rawTokenEstimate,
    charCount,
    language: opts.language,
    safetyStatus: opts.safetyStatus,
    licenseStatus: opts.licenseStatus ?? "UNVERIFIED",
    absorbedTokenEstimate: 0,
    unabsorbedTokenEstimate: rawTokenEstimate,
    absorptionRate: 0,
    createdAt: new Date().toISOString(),
  };
}

/** 按段落 + 长度阈值切片 */
function splitParagraphs(text: string): string[] {
  const parts = text.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

/** 把段落组合为目标 token 大小的块 */
function packIntoChunks(paragraphs: string[], targetTokens: number): string[] {
  const targetChars = targetTokens * 3;
  const out: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    // 单段超长，硬切
    if (p.length > targetChars) {
      if (buf) {
        out.push(buf);
        buf = "";
      }
      for (let i = 0; i < p.length; i += targetChars) {
        out.push(p.slice(i, i + targetChars));
      }
      continue;
    }
    if (buf.length + p.length + 2 > targetChars && buf) {
      out.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function chunkTypeFor(
  src: RawCorpusDocument["sourceType"],
): { chunkType: LongCorpusChunkType; targetUse: LongCorpusTargetUse } {
  switch (src) {
    case "CHAT_EXPORT":
      return { chunkType: "CHAT_HISTORY_CHUNK", targetUse: "CONTINUED_TRAINING" };
    case "LOVABLE_REPORT":
      return { chunkType: "LOVABLE_REPORT_CHUNK", targetUse: "SFT_CONTEXT" };
    case "SYSTEM_DOC":
      return { chunkType: "SYSTEM_DOC_CHUNK", targetUse: "CONTINUED_TRAINING" };
    case "LONG_TEXT":
      return { chunkType: "LONG_PRETRAIN", targetUse: "PRETRAIN" };
    case "IMAGE_TEXT":
      return { chunkType: "MEDIUM_SFT_CONTEXT", targetUse: "SFT_CONTEXT" };
    case "PASTE":
    case "FILE":
    case "FOLDER":
    case "UNKNOWN":
    default:
      return { chunkType: "METHOD_DOC_CHUNK", targetUse: "CONTINUED_TRAINING" };
  }
}

function qualityForLong(text: string): number {
  if (!text) return 0;
  const len = text.length;
  let s = 0.5;
  if (len >= 600) s += 0.2;
  if (len >= 2000) s += 0.1;
  if (/[。.！!？?\n]/.test(text)) s += 0.1;
  if (len < 200) s = 0.3;
  return Math.min(1, Number(s.toFixed(2)));
}

interface BuildLongChunksOpts {
  rawDoc: RawCorpusDocument;
  intakeRunId: string;
  mode: IntakeMode;
}

/** 根据投喂模式生成长 / 中 语料切片 */
export function buildLongCorpusChunks(opts: BuildLongChunksOpts): LongCorpusChunk[] {
  const { rawDoc, mode } = opts;
  if (rawDoc.safetyStatus === "BLOCK" || !rawDoc.rawTextStored) return [];
  if (mode === "SHORT_SAMPLE") return [];

  const cfg = DEFAULT_INTAKE_CHUNK_CONFIG;
  const { chunkType, targetUse } = chunkTypeFor(rawDoc.sourceType);

  // 选择切片 token 大小
  const longTokens =
    mode === "FULL_ABSORB" ? cfg.fullAbsorbLongTokens : cfg.defaultLongTokens;

  const paragraphs = splitParagraphs(rawDoc.rawText);

  // 长语料块
  const longParts = packIntoChunks(paragraphs, longTokens);

  // 中等 SFT 上下文（HYBRID / FULL_ABSORB 才生成）
  const mediumParts =
    mode === "HYBRID" || mode === "FULL_ABSORB"
      ? packIntoChunks(paragraphs, Math.floor((cfg.mediumMin + cfg.mediumMax) / 2))
      : [];

  const chunks: LongCorpusChunk[] = [];
  longParts.forEach((text, idx) => {
    if (estimateTokens(text) < cfg.longMin && mode !== "FULL_ABSORB" && longParts.length > 1) {
      // 太短的长块跳过（仅当还有其它块时）
      return;
    }
    chunks.push({
      id: nextIntakeId("IFC") + "_long",
      rawDocumentId: rawDoc.id,
      intakeRunId: opts.intakeRunId,
      chunkIndex: idx,
      text,
      tokenEstimate: estimateTokens(text),
      charCount: text.length,
      chunkType,
      targetUse,
      safetyStatus: rawDoc.safetyStatus,
      qualityScore: qualityForLong(text),
      createdAt: new Date().toISOString(),
    });
  });

  // 仅在 HYBRID / FULL_ABSORB 添加中等块（避免与长块完全重复时按段落主导）
  if (mediumParts.length > 0 && (mode === "HYBRID" || mode === "FULL_ABSORB")) {
    mediumParts.forEach((text, idx) => {
      const t = estimateTokens(text);
      if (t < cfg.mediumMin || t > cfg.mediumMax + 200) return;
      chunks.push({
        id: nextIntakeId("IFC") + "_med",
        rawDocumentId: rawDoc.id,
        intakeRunId: opts.intakeRunId,
        chunkIndex: longParts.length + idx,
        text,
        tokenEstimate: t,
        charCount: text.length,
        chunkType: "MEDIUM_SFT_CONTEXT",
        targetUse: "SFT_CONTEXT",
        safetyStatus: rawDoc.safetyStatus,
        qualityScore: qualityForLong(text),
        createdAt: new Date().toISOString(),
      });
    });
  }

  return chunks;
}
