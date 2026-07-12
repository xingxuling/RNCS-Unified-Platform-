// 数列 Agent 路由：根据用户输入与上下文挑选参与 Agent 与协作模式
import { getSystemAgentByType, listSequenceAgents } from "./sequenceAgentRegistry";
import type { SequenceAgent, SequenceAgentType, AgentCollabMode } from "./sequenceAgentTypes";

export interface AgentRouteContext {
  rawInput: string;
  calculusId?: string;
  isPrediction?: boolean;
}

export interface AgentRouteDecision {
  agents: SequenceAgent[];
  mode: AgentCollabMode;
  reason: string;
  explicitMention: boolean;
}

const KEYWORDS: Array<{ types: SequenceAgentType[]; re: RegExp }> = [
  { types: ["ARCHITECT"], re: /(架构|结构|模块归位|下一步|路线|系统应该|怎么接)/ },
  { types: ["PRODUCT"], re: /(产品|用户体验|UI|UX|页面|功能优先级|商业化)/ },
  { types: ["CODE"], re: /(代码|实现|修复|patch|sandbox|bug.*代码|生成代码)/i },
  { types: ["QA"], re: /(测试|bug|缺陷|回归|质量|风险|漏洞)/i },
  { types: ["SECURITY"], re: /(安全|secret|权限|公开发布|founder|敏感|脱敏|full60)/i },
  { types: ["PREDICTION"], re: /(预测|未来|窗口|轨迹|概率|趋势|风险点)/ },
  { types: ["MEMORY"], re: /(记忆|上下文|压缩|历史回顾|长期记忆)/ },
  { types: ["WORLD"], re: /(世界|剧情|叙事|蓝天机|主题曲|歌|narrative|world)/i },
  { types: ["SCHEDULER"], re: /(调度|任务|拆解|计划|安排|提醒|日历)/ },
  { types: ["ANALYTICS"], re: /(统计|分析|数据|哪个最|耗时|延迟|排行)/ },
  { types: ["SOCIAL"], re: /(社交|发布|社区|动态|公开)/ },
];

const EXPLICIT_MENTIONS: Array<{ re: RegExp; type: SequenceAgentType }> = [
  { re: /架构\s*agent|architect\s*agent/i, type: "ARCHITECT" },
  { re: /产品\s*agent|product\s*agent/i, type: "PRODUCT" },
  { re: /代码\s*agent|code\s*agent/i, type: "CODE" },
  { re: /qa\s*agent|质量\s*agent|测试\s*agent/i, type: "QA" },
  { re: /安全\s*agent|security\s*agent/i, type: "SECURITY" },
  { re: /预测\s*agent|prediction\s*agent/i, type: "PREDICTION" },
  { re: /记忆\s*agent|memory\s*agent/i, type: "MEMORY" },
  { re: /世界\s*agent|world\s*agent/i, type: "WORLD" },
  { re: /调度\s*agent|scheduler\s*agent/i, type: "SCHEDULER" },
  { re: /统计\s*agent|analytics\s*agent/i, type: "ANALYTICS" },
];

export function routeAgents(ctx: AgentRouteContext): AgentRouteDecision {
  const text = ctx.rawInput || "";
  const types = new Set<SequenceAgentType>();
  let explicit = false;

  // 显式提及（"让 XX Agent ..."）
  for (const m of EXPLICIT_MENTIONS) {
    if (m.re.test(text)) {
      types.add(m.type);
      explicit = true;
    }
  }

  // 关键词命中
  if (!explicit) {
    for (const k of KEYWORDS) {
      if (k.re.test(text)) k.types.forEach((t) => types.add(t));
    }
  }

  // 计算法路由命中预测
  if (ctx.isPrediction || ctx.calculusId === "SEQUENCE_PREDICTION_CALCULUS") {
    types.add("PREDICTION");
  }

  // 命中多个含安全相关词时强制加入 SECURITY
  if (/公开|发布|支付|部署|社交/.test(text) && !types.has("SECURITY")) {
    types.add("SECURITY");
  }

  // 没命中任何 Agent，则不触发（不强加默认 Agent，避免噪音）
  if (types.size === 0) {
    return {
      agents: [],
      mode: "SINGLE_AGENT",
      reason: "未命中 Agent 关键词",
      explicitMention: false,
    };
  }

  const agents: SequenceAgent[] = [];
  for (const t of types) {
    const a = getSystemAgentByType(t);
    if (a) agents.push(a);
  }

  // 模式判定
  let mode: AgentCollabMode = "SINGLE_AGENT";
  if (agents.length >= 2) mode = "PANEL_REVIEW";
  // 用户显式说 "对...讨论 / 给意见 / 联合" 也强制 Panel
  if (/讨论|对.+给意见|联合|和.+一起|panel/i.test(text) && agents.length >= 2) {
    mode = "PANEL_REVIEW";
  }
  // 串行链：用户说 "先...再..." 或命中代码修复链路
  if (/先.+再.+|代码.*修复|修复.*代码|chain/i.test(text) && agents.length >= 2) {
    mode = "CHAIN_OF_AGENTS";
  }

  return {
    agents,
    mode,
    reason: explicit ? "用户显式指定" : "关键词命中",
    explicitMention: explicit,
  };
}

/** 兜底：列出全部启用 Agent，用于 /system/agents 页面 */
export function listAllEnabledAgents(): SequenceAgent[] {
  return listSequenceAgents();
}
