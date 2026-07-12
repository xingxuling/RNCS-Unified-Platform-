// AetherSeed Dataset · Token 与模型适配度 · Chat 桥 v0.1
import {
  computeDatasetTokenStats,
  evaluateAllModelFitness,
  evaluateModelFitness,
  formatTokens,
  FITNESS_THRESHOLDS,
  type DatasetTokenStats,
  type ModelFitnessReport,
  type ModelTarget,
} from "./datasetTokenEstimator";

export type TokenChatFocus =
  | "TOKEN_OVERVIEW"
  | "FIT_300M"
  | "FIT_1B"
  | "SHORTFALL"
  | "WHY_NOT_COUNT"
  | "WHY_TOO_SHORT"
  | "HOW_TO_LONGER"
  | "CAN_SEAL_SMOKE"
  | "DATASET_FIT_FOR_WHAT";

const TRIGGER = [
  "token", "tokens",
  "够训", "够不够", "够训练",
  "差多少", "还差",
  "样本条数", "样本数",
  "300m", "1b",
  "适配度", "训练量",
  "太短", "平均.*短",
  "中长样本", "怎么增加",
  "封冒烟", "冒烟版", "冒烟数据集",
  "适合什么训练", "适合做什么",
];

export function detectTokenIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGER.some((k) => new RegExp(k).test(t));
}

function pickFocus(raw: string): TokenChatFocus {
  const t = raw.toLowerCase();
  if (/适合什么训练|适合做什么|适合.*训练/.test(t)) return "DATASET_FIT_FOR_WHAT";
  if (/封冒烟|冒烟版|冒烟数据集|能不能封/.test(t)) return "CAN_SEAL_SMOKE";
  if (/怎么增加|怎样增加|如何增加.*中长|增加.*中长样本/.test(t)) return "HOW_TO_LONGER";
  if (/太短|平均.*短|为什么.*短/.test(t)) return "WHY_TOO_SHORT";
  if (/为什么.*只看|样本条数|条数.*不|够多.*不够/.test(t)) return "WHY_NOT_COUNT";
  if (/差多少|还差|缺多少/.test(t)) return "SHORTFALL";
  if (/1b/.test(t)) return "FIT_1B";
  if (/300m|私有模型/.test(t)) return "FIT_300M";
  return "TOKEN_OVERVIEW";
}

export interface TokenChatInfo {
  question: string;
  focus: TokenChatFocus;
  focusLabel: string;
  stats: DatasetTokenStats;
  fitness: ModelFitnessReport[];
  summary: string;
  hints: string[];
}

const FOCUS_LABEL: Record<TokenChatFocus, string> = {
  TOKEN_OVERVIEW: "Token 总览",
  FIT_300M: "300M 适配度",
  FIT_1B: "1B 适配度",
  SHORTFALL: "差距分析",
  WHY_NOT_COUNT: "为什么不能只看样本条数",
  WHY_TOO_SHORT: "为什么平均 token 太短",
  HOW_TO_LONGER: "怎么增加中长样本",
  CAN_SEAL_SMOKE: "能不能封冒烟版",
  DATASET_FIT_FOR_WHAT: "当前数据集适合什么训练",
};

function shortfallLine(m: ModelTarget): string {
  const stats = computeDatasetTokenStats();
  const report = evaluateModelFitness(m, stats.effectiveTrainingTokens);
  const next = report.rows.find((r) => !r.ok);
  if (!next) return `${report.modelLabel}：已满足全部档位。`;
  return `${report.modelLabel} · 距「${next.levelLabel}」还差 ${formatTokens(next.shortfallTokens)} token（门槛 ${formatTokens(next.thresholdTokens)}）。`;
}

export function answerTokenQuestion(raw: string): TokenChatInfo {
  const focus = pickFocus(raw);
  const stats = computeDatasetTokenStats();
  const fitness = evaluateAllModelFitness(stats);

  let summary = "";
  const hints: string[] = [];

  switch (focus) {
    case "WHY_NOT_COUNT":
      summary =
        "样本条数只代表「条数」，不代表「信息量」。1 条 200 字的样本与 1 条 2000 字的样本对训练贡献完全不同。" +
        "训练真正消耗的是 token：模型按 token 计算 loss、按 token 决定收敛。" +
        "因此判断「够不够训」必须看有效 token 数、重复率、样本质量，而不是单纯样本条数。";
      break;
    case "WHY_TOO_SHORT":
      summary =
        `当前平均每条样本仅 ${stats.avgTrainingTokens} token，主要原因：` +
        `① 投喂切片以「短切片」为主；` +
        `② SFT 模板倾向简短问答；` +
        `③ 长文档未启用长切片模式。` +
        `中长样本（≥150 token）当前占比 ${(stats.qualityPanel.midLongShare * 100).toFixed(1)}%，不足以训练方法论与系统理解。`;
      break;
    case "HOW_TO_LONGER":
      summary =
        "增加中长样本的方法：① 在投喂炉切换到「中切片」或「混合切片」模式；" +
        "② 投喂长方法论 / 系统文档 / 完整对话压缩（≥800 token）；" +
        "③ 减少纯路由 / 短问答比例；" +
        "④ 把多条相关短样本合并为一条 ChatML 对话。" +
        "AetherSeed 300M 推荐使用「混合切片」并保持中+长样本占 ≥ 40%。";
      break;
    case "CAN_SEAL_SMOKE":
      summary = stats.smokeReadiness.ready
        ? `可以封版为「${stats.smokeReadiness.suggestedName}」。` +
          `用途：${stats.smokeReadiness.reasons.slice(1).join("；")}。` +
          `注意：${stats.smokeReadiness.forbiddenLabels.join("；")}。`
        : `当前不可封版。${stats.smokeReadiness.reasons.join("；")}。`;
      break;
    case "DATASET_FIT_FOR_WHAT": {
      const q = stats.qualityPanel;
      const lines: string[] = [];
      lines.push(`当前数据集（有效 token ${formatTokens(stats.effectiveTrainingTokens)}）适合：`);
      if (q.okForSmoke) lines.push("✅ AetherSeed 300M 冒烟测试（链路 / 脚本 / dry-run / 网关 / 账本验证）");
      else lines.push("❌ 暂不足以做冒烟测试");
      lines.push("❌ AetherSeed 300M 初步可用版（差 5M 量级 token）");
      lines.push("❌ AetherSeed 300M 正式第一版（差 300M 量级 token）");
      lines.push("❌ AetherSeed 1B 任何档位");
      summary = lines.join("\n");
      break;
    }
    case "FIT_300M": {
      const r = fitness.find((f) => f.model === "AETHERSEED_300M")!;
      summary = `${r.modelLabel} 当前可达档位：${r.reachedLevelLabel}（有效 token ${formatTokens(stats.effectiveTrainingTokens)}）。` +
        r.rows.map((x) => `\n· ${x.levelLabel}：门槛 ${formatTokens(x.thresholdTokens)} · ${x.ok ? "✅ 已达" : `❌ 差 ${formatTokens(x.shortfallTokens)}`}`).join("");
      break;
    }
    case "FIT_1B": {
      const r = fitness.find((f) => f.model === "AETHERSEED_1B")!;
      summary = `${r.modelLabel} 当前可达档位：${r.reachedLevelLabel}（有效 token ${formatTokens(stats.effectiveTrainingTokens)}）。` +
        r.rows.map((x) => `\n· ${x.levelLabel}：门槛 ${formatTokens(x.thresholdTokens)} · ${x.ok ? "✅ 已达" : `❌ 差 ${formatTokens(x.shortfallTokens)}`}`).join("");
      break;
    }
    case "SHORTFALL":
      summary = [shortfallLine("AETHERSEED_300M"), shortfallLine("AETHERSEED_1B")].join("\n");
      break;
    case "TOKEN_OVERVIEW":
    default:
      summary =
        `当前训练 token 估算：${formatTokens(stats.trainingTotalTokens)}（有效 ${formatTokens(stats.effectiveTrainingTokens)}），` +
        `评测 token：${formatTokens(stats.evalTotalTokens)}。` +
        `训练样本 ${stats.trainingSampleCount} 条 · 评测 ${stats.evalSampleCount} 条 · 平均 ${stats.avgTrainingTokens} token/条 · ` +
        `最长 ${stats.maxTrainingTokens} · 最短 ${stats.minTrainingTokens} · 重复率 ${(stats.duplicationRate * 100).toFixed(1)}%。${stats.splitAnalysis.hint}`;
      break;
  }

  hints.push("样本条数不等于 token 数。当前数据量足够冒烟测试，不代表足够训练出高质量模型。");
  hints.push(
    `300M 门槛参考：冒烟 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_300M.SMOKE)} / 初步 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_300M.INITIAL)} / 正式 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_300M.FIRST_RELEASE)}。`,
  );
  hints.push(
    `1B 门槛参考：冒烟 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_1B.SMOKE)} / 初步 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_1B.INITIAL)} / 正式 ${formatTokens(FITNESS_THRESHOLDS.AETHERSEED_1B.FIRST_RELEASE)}。`,
  );

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    stats,
    fitness,
    summary,
    hints,
  };
}
