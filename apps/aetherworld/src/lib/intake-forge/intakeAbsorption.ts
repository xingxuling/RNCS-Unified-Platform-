// 投喂吸收率统计
import type {
  IntakeAbsorptionCard,
  IntakeAbsorptionReport,
  IntakeMode,
  LongCorpusChunk,
  RawCorpusDocument,
} from "./intakeAbsorptionTypes";
import { INTAKE_MODE_LABEL } from "./intakeAbsorptionTypes";
import type { IntakeChunk, IntakeCompiledOutput, IntakeEvalItem } from "./intakeForgeTypes";

interface BuildReportOpts {
  mode: IntakeMode;
  rawDocuments: RawCorpusDocument[];
  longChunks: LongCorpusChunk[];
  shortChunks: IntakeChunk[];        // 旧短样本切片
  outputs: IntakeCompiledOutput[];
  evals: IntakeEvalItem[];
}

const SHORT_TOKEN_THRESHOLD = 150;
const ABSORPTION_WARN_THRESHOLD = 0.6;

export function buildAbsorptionReport(opts: BuildReportOpts): IntakeAbsorptionReport {
  const rawTokens = opts.rawDocuments.reduce((s, d) => s + d.rawTokenEstimate, 0);

  const longCorpusTokens = opts.longChunks
    .filter((c) => c.chunkType === "LONG_PRETRAIN" || c.targetUse === "PRETRAIN" || c.targetUse === "CONTINUED_TRAINING")
    .reduce((s, c) => s + c.tokenEstimate, 0);

  const mediumSftTokens = opts.longChunks
    .filter((c) => c.chunkType === "MEDIUM_SFT_CONTEXT")
    .reduce((s, c) => s + c.tokenEstimate, 0);

  const shortSampleTokens = opts.shortChunks.reduce((s, c) => s + (c.tokenEstimate ?? 0), 0);

  // 已吸收 = 长语料 + 中语料 + 短样本（去重粗算：取较大者避免重复计算）
  const absorbedTokens = Math.max(
    longCorpusTokens + mediumSftTokens,
    shortSampleTokens,
    longCorpusTokens + Math.floor(shortSampleTokens / 2),
  );

  // 简单估算 SFT / Eval / Pretrain token 比例（按输出 sampleCount 比例）
  const totalSamples = opts.outputs.reduce((s, o) => s + o.sampleCount, 0) || 1;
  const sftSamples = opts.outputs
    .filter((o) => /SFT|ALPACA|CHATML|LOVABLE_PROMPT|TOOL_CALLING/.test(o.format) || /SFT|ALPACA|CHATML/.test(o.id))
    .reduce((s, o) => s + o.sampleCount, 0);
  const pretrainSamples = opts.outputs
    .filter((o) => /PRETRAIN/.test(o.format) || /预训练/.test(o.format))
    .reduce((s, o) => s + o.sampleCount, 0);

  const sftTokens = Math.floor((shortSampleTokens * sftSamples) / totalSamples);
  const pretrainTokens = longCorpusTokens + Math.floor((shortSampleTokens * pretrainSamples) / totalSamples);
  const evalTokens = opts.evals.length * 60; // 粗估每条 60 token

  const unabsorbedTokens = Math.max(0, rawTokens - absorbedTokens);
  const absorptionRate =
    rawTokens === 0 ? 0 : Number((Math.min(absorbedTokens, rawTokens) / rawTokens).toFixed(3));

  const avgShortSampleTokens =
    opts.shortChunks.length === 0
      ? 0
      : Math.round(shortSampleTokens / opts.shortChunks.length);

  const warnings: string[] = [];
  if (rawTokens > 0 && absorptionRate < ABSORPTION_WARN_THRESHOLD) {
    warnings.push(
      `当前投喂吸收率偏低（${Math.round(absorptionRate * 100)}%），可能是切片过短或长语料未入库。`,
    );
  }
  if (avgShortSampleTokens > 0 && avgShortSampleTokens < SHORT_TOKEN_THRESHOLD) {
    warnings.push(
      `平均短样本仅 ${avgShortSampleTokens} token，建议开启长语料模式或混合吸收模式。`,
    );
  }

  const unabsorbedReasons: string[] = [];
  if (opts.mode === "SHORT_SAMPLE") {
    unabsorbedReasons.push("当前为短样本模式，长语料未生成 LongCorpusChunk。");
  }
  const blocked = opts.rawDocuments.filter((d) => d.safetyStatus === "BLOCK").length;
  if (blocked > 0) {
    unabsorbedReasons.push(`${blocked} 个原始文档被安全策略阻断，未进入训练。`);
  }
  if (unabsorbedTokens > 0 && opts.mode !== "FULL_ABSORB") {
    unabsorbedReasons.push("部分中间段落未达切片阈值或重复，已舍弃。");
  }

  let nextAction = "可进入数据集页面构建 Smoke / Full Corpus / SFT / Continued / Hybrid 数据集。";
  if (absorptionRate < ABSORPTION_WARN_THRESHOLD) {
    nextAction = "建议切换到混合吸收模式或长语料模式后重新投喂以提高吸收率。";
  } else if (opts.mode === "SHORT_SAMPLE") {
    nextAction = "可切换到混合吸收模式以同时生成长语料块。";
  }

  // 回写每个 raw document 的吸收统计（粗估按字符占比分摊）
  if (rawTokens > 0) {
    opts.rawDocuments.forEach((d) => {
      const share = d.rawTokenEstimate / rawTokens;
      d.absorbedTokenEstimate = Math.round(absorbedTokens * share);
      d.unabsorbedTokenEstimate = Math.max(0, d.rawTokenEstimate - d.absorbedTokenEstimate);
      d.absorptionRate = Number(
        (Math.min(d.absorbedTokenEstimate, d.rawTokenEstimate) / d.rawTokenEstimate).toFixed(3),
      );
    });
  }

  return {
    mode: opts.mode,
    rawTokens,
    absorbedTokens: Math.min(absorbedTokens, rawTokens),
    unabsorbedTokens,
    absorptionRate,
    longCorpusTokens,
    mediumSftTokens,
    shortSampleTokens,
    pretrainTokens,
    sftTokens,
    evalTokens,
    rawDocumentCount: opts.rawDocuments.length,
    longChunkCount: opts.longChunks.filter((c) => c.chunkType !== "MEDIUM_SFT_CONTEXT").length,
    mediumChunkCount: opts.longChunks.filter((c) => c.chunkType === "MEDIUM_SFT_CONTEXT").length,
    shortSampleCount: opts.shortChunks.length,
    evalSampleCount: opts.evals.length,
    avgShortSampleTokens,
    warnings,
    unabsorbedReasons,
    nextAction,
  };
}

export function buildAbsorptionCard(
  question: string,
  report: IntakeAbsorptionReport,
): IntakeAbsorptionCard {
  const explanation =
    `Raw token（原始语料）= ${report.rawTokens}，` +
    `已吸收 token = ${report.absorbedTokens}（吸收率 ${Math.round(report.absorptionRate * 100)}%）。` +
    `其中长语料 ${report.longCorpusTokens}，短样本 ${report.shortSampleTokens}。` +
    `样本数高 ≠ token 多，只有 RawCorpusDocument + LongCorpusChunk 才计入真正可训练 token。`;
  return {
    question,
    explanation,
    rawTokens: report.rawTokens,
    absorbedTokens: report.absorbedTokens,
    absorptionRate: report.absorptionRate,
    longCorpusTokens: report.longCorpusTokens,
    shortSampleTokens: report.shortSampleTokens,
    unabsorbedTokens: report.unabsorbedTokens,
    avgShortSampleTokens: report.avgShortSampleTokens,
    mode: report.mode,
    modeLabel: INTAKE_MODE_LABEL[report.mode],
    nextAction: report.nextAction,
    warnings: report.warnings,
  };
}
