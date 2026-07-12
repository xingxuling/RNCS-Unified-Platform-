// 数列 AI 路由：根据用户输入决定 Sequence AI 模式
import type { SequenceAiMode } from "./sequenceAiTypes";

const RULES: Array<{ mode: SequenceAiMode; re: RegExp }> = [
  { mode: "PREDICT_SEQUENCE", re: /(用数列预测|数列预测|预测.{0,8}(瓶颈|风险|趋势|未来)|推演)/ },
  { mode: "COMPRESS_SEQUENCE", re: /(压成数列记忆|压缩.{0,4}(记忆|对话|上下文)|生成\s*SMU|存为长期记忆)/ },
  { mode: "VALUE_SEQUENCE", re: /(数列价值|价值计量|value\s*ledger|计算.{0,4}价值|多少\s*SCU)/i },
  { mode: "AGENT_SEQUENCE", re: /(数列人格|数列\s*agent|多.{0,2}agent|让.{0,4}(agent|人格).{0,8}(分析|讨论|评审))/i },
  { mode: "STATE_SEQUENCE", re: /(用\s*MSL\s*表达|生成.{0,4}MSL|状态帧|MSLStateFrame)/i },
  { mode: "WORLD_SEQUENCE", re: /(数列世界|世界引擎|主题曲|叙事链|声乐链)/ },
  { mode: "EXPLAIN_SEQUENCE", re: /(这组数列|数列\s*[0-9A-Za-z]{2,}\s*(是什么|表示|含义|意思)|解释.{0,4}数列|数列\s*结构)/ },
  { mode: "GENERATE_SEQUENCE", re: /(生成.{0,4}(数列|sequence)|出一个数列|给我一组数列)/i },
];

// 总入口触发词：判定是否进入 SEQUENCE_AI_CALCULUS（即使没匹配具体模式，也走默认 EXPLAIN/GENERATE）
const SEQUENCE_AI_TRIGGER = /(用数列\s*AI|数列\s*AI|sequence\s*ai|用数列系统|数列总调度|ask\s*sequence)/i;

export interface SequenceAiRouteDecision {
  triggered: boolean;
  mode: SequenceAiMode;
  reason: string;
}

export function routeSequenceAi(rawInput: string): SequenceAiRouteDecision {
  const text = (rawInput || "").trim();
  for (const r of RULES) {
    if (r.re.test(text)) {
      return { triggered: true, mode: r.mode, reason: `命中「${r.mode}」关键词` };
    }
  }
  if (SEQUENCE_AI_TRIGGER.test(text)) {
    return { triggered: true, mode: "EXPLAIN_SEQUENCE", reason: "命中「数列 AI 总入口」（默认解释模式）" };
  }
  return { triggered: false, mode: "EXPLAIN_SEQUENCE", reason: "未命中数列 AI 关键词" };
}

export function isSequenceAiCalculus(rawInput: string): boolean {
  return routeSequenceAi(rawInput).triggered;
}
