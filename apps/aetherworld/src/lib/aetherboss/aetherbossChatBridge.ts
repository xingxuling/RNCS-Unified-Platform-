// AetherBoss · Chat 接入
import {
  buildDailyReport,
  enableAgent,
  disableAgent,
  getLatestDecision,
  getLatestRun,
  observe,
  planRecoveryForAllFailures,
  runOnce,
  summarizeObservation,
  switchMode,
} from "./aetherbossRuntime";
import { getAgentState } from "./aetherbossStore";
import { ACTION_LABEL, FACTORY_LABEL, MODE_LABEL } from "./aetherbossTypes";

export interface AetherBossAgentCard {
  kind: "AETHERBOSS_AGENT_CARD";
  mode: string;
  enabled: boolean;
  lastRun: string;
  currentDecision: string;
  generatedTasks: number;
  needsConfirmation: boolean;
  todayGrowth: string;
  nextStep: string;
}

export function buildAgentCard(): AetherBossAgentCard {
  const state = getAgentState();
  const decision = getLatestDecision();
  const run = getLatestRun();
  const obs = observe();
  return {
    kind: "AETHERBOSS_AGENT_CARD",
    mode: MODE_LABEL[state.mode],
    enabled: state.enabled,
    lastRun: run?.startedAt ?? "尚未运行",
    currentDecision: decision
      ? `${FACTORY_LABEL[decision.chosenFactory]} · ${ACTION_LABEL[decision.chosenAction]}`
      : "暂无决策",
    generatedTasks: decision?.generatedTaskIds.length ?? 0,
    needsConfirmation: decision?.requiredConfirmation ?? false,
    todayGrowth: summarizeObservation(obs),
    nextStep: decision?.expectedValue ?? "运行一次总策决策以生成下一步",
  };
}

export interface AetherBossChatResponse {
  reply: string;
  card?: AetherBossAgentCard;
}

export function tryHandleAetherBossChat(text: string): AetherBossChatResponse | null {
  const t = text.trim();
  if (!t) return null;
  const lower = t.toLowerCase();

  const match = (...kws: string[]) => kws.some((k) => t.includes(k) || lower.includes(k));

  if (match("启动总策", "启用总策", "开启总策", "start aetherboss")) {
    enableAgent();
    return { reply: "已启用总策 Agent，心跳调度按当前模式运行。", card: buildAgentCard() };
  }
  if (match("暂停总策", "停止总策", "关闭总策", "stop aetherboss")) {
    disableAgent();
    return { reply: "已暂停总策 Agent，不会再自动调度任务。", card: buildAgentCard() };
  }
  if (match("进入竞争模式", "竞争模式")) {
    switchMode("COMPETITION_MODE");
    return { reply: "已切换到竞争模式，优先推进数据 / 模型 / 资产 / 用户增长任务。", card: buildAgentCard() };
  }
  if (match("只观察", "观察模式")) {
    switchMode("OBSERVE_ONLY");
    return { reply: "已切换到只观察模式，只读系统状态，不创建任务。", card: buildAgentCard() };
  }
  if (match("半自动")) {
    switchMode("SEMI_AUTO");
    return { reply: "已切换到半自动模式，关键步骤需要确认。", card: buildAgentCard() };
  }
  if (match("无人值守")) {
    switchMode("UNATTENDED");
    return { reply: "已切换到无人值守模式，按既定边界自动调度低风险动作。", card: buildAgentCard() };
  }
  if (match("运行一次", "运行总策", "run once")) {
    runOnce();
    return { reply: "已运行一次总策决策。", card: buildAgentCard() };
  }
  if (match("今日增长报告", "今天无人工厂", "今天做了什么", "今日复盘")) {
    const r = buildDailyReport();
    return {
      reply: `今日增长报告（${r.date}）：${r.materialProgress}；${r.trainingProgress}；${r.companyProgress}；${r.systemHealth}。下一步：${r.nextBestActions.slice(0, 3).join("、")}`,
      card: buildAgentCard(),
    };
  }
  if (match("失败任务", "恢复失败", "失败恢复")) {
    const plans = planRecoveryForAllFailures();
    return {
      reply: plans.length > 0
        ? `已为 ${plans.length} 个失败任务生成恢复计划。`
        : "当前没有需要恢复的失败任务。",
      card: buildAgentCard(),
    };
  }
  if (match("总策现在", "总策在干嘛", "总策状态", "aetherboss status")) {
    return { reply: "返回总策 Agent 当前状态。", card: buildAgentCard() };
  }
  if (match("最该推进", "下一步该", "下一步做什么")) {
    const d = getLatestDecision();
    return {
      reply: d
        ? `建议：${FACTORY_LABEL[d.chosenFactory]} · ${ACTION_LABEL[d.chosenAction]} —— ${d.reason}`
        : "请先运行一次总策决策。",
      card: buildAgentCard(),
    };
  }
  if (match("抢用户", "竞争", "增长任务")) {
    switchMode("COMPETITION_MODE");
    runOnce();
    return {
      reply: "已进入竞争模式并运行一次：优先生成公司工厂相关任务（能力包 / 商店草案 / 客户材料）。",
      card: buildAgentCard(),
    };
  }
  if (match("低价值")) {
    return {
      reply: "低价值任务包括：纯装饰美化、低优先级 P3 整理。建议保留观察与规划，不要消耗工厂运力。",
      card: buildAgentCard(),
    };
  }
  if (match("调度材料")) {
    runOnce();
    return { reply: "已请求总策调度材料工厂。", card: buildAgentCard() };
  }
  if (match("调度训练")) {
    runOnce();
    return { reply: "已请求总策调度训练工厂。", card: buildAgentCard() };
  }
  if (match("调度公司")) {
    runOnce();
    return { reply: "已请求总策调度公司工厂。", card: buildAgentCard() };
  }
  if (match("总策", "aetherboss")) {
    return { reply: "总策 Agent 卡片如下。", card: buildAgentCard() };
  }
  return null;
}
