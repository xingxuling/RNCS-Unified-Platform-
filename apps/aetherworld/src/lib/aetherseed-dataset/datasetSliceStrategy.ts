// AetherSeed Dataset · 切片策略 v0.1
// 投喂炉 / 数据集生成器可读取本表，按目标模型推荐切片模式。
// 注意：本文件只声明策略与推荐，不真正执行切片（执行仍由 intakeChunker 完成）。

export type SliceStrategy = "SHORT" | "MEDIUM" | "LONG" | "MIXED";

export const SLICE_STRATEGY_LABEL: Record<SliceStrategy, string> = {
  SHORT: "短切片（路由 / 冒烟）",
  MEDIUM: "中切片（SFT）",
  LONG: "长切片（预训练）",
  MIXED: "混合切片（自动生成短 / 中 / 长）",
};

export interface SliceStrategySpec {
  strategy: SliceStrategy;
  label: string;
  /** 目标单切片 token 范围 */
  minTokens: number;
  maxTokens: number;
  /** 推荐用途 */
  usage: string;
  /** 期望产出的样本类型偏向 */
  preferredOutputTypes: string[];
}

export const SLICE_STRATEGY_SPECS: Record<SliceStrategy, SliceStrategySpec> = {
  SHORT: {
    strategy: "SHORT",
    label: SLICE_STRATEGY_LABEL.SHORT,
    minTokens: 32,
    maxTokens: 150,
    usage: "路由 / 分类 / 短问答 / 冒烟测试",
    preferredOutputTypes: ["ROUTER_JSON", "SFT_JSONL"],
  },
  MEDIUM: {
    strategy: "MEDIUM",
    label: SLICE_STRATEGY_LABEL.MEDIUM,
    minTokens: 150,
    maxTokens: 800,
    usage: "SFT / 结构问答 / 提示词生成",
    preferredOutputTypes: ["SFT_JSONL", "ALPACA", "CHATML", "LOVABLE_PROMPT_JSON"],
  },
  LONG: {
    strategy: "LONG",
    label: SLICE_STRATEGY_LABEL.LONG,
    minTokens: 800,
    maxTokens: 3000,
    usage: "预训练 / 方法论吸收 / 系统文档学习",
    preferredOutputTypes: ["PRETRAIN_TEXT"],
  },
  MIXED: {
    strategy: "MIXED",
    label: SLICE_STRATEGY_LABEL.MIXED,
    minTokens: 32,
    maxTokens: 3000,
    usage: "AetherSeed 300M 默认推荐：自动产出短 / 中 / 长三类样本",
    preferredOutputTypes: ["SFT_JSONL", "ALPACA", "CHATML", "PRETRAIN_TEXT"],
  },
};

/** AetherSeed 300M 私有模型默认推荐切片策略。 */
export const AETHERSEED_300M_DEFAULT_SLICE_STRATEGY: SliceStrategy = "MIXED";

export function recommendSliceStrategy(target: "AETHERSEED_300M" | "ROUTER_TINY" | "PRETRAIN_ONLY"): SliceStrategy {
  if (target === "ROUTER_TINY") return "SHORT";
  if (target === "PRETRAIN_ONLY") return "LONG";
  return AETHERSEED_300M_DEFAULT_SLICE_STRATEGY;
}
