// Aetherworld Local AGI · Chat 接入
import { scanExternalRadar } from "./externalDataRadar";
import { absorbAllPending, recordFeedback } from "./feedbackAbsorber";
import { scanAndPlanDevelopment } from "./developmentFactory";
import {
  buildDailyReport,
  disableAgi,
  enableAgi,
  getLatestDecision,
  getLatestRun,
  observe,
  runOnce,
  summarizeObservation,
  switchMode,
} from "./localAgiRuntime";
import { getAgiState, listFeedback } from "./localAgiStore";
import {
  LOCAL_AGI_FACTORY_LABEL,
  LOCAL_AGI_MODE_LABEL,
} from "./localAgiTypes";

export interface LocalAGICard {
  kind: "LOCAL_AGI_CARD";
  mode: string;
  enabled: boolean;
  lastRun: string;
  currentDecision: string;
  generatedOutputs: string[];
  todayGrowth: string;
  nextStep: string;
}

export function buildLocalAGICard(): LocalAGICard {
  const state = getAgiState();
  const run = getLatestRun();
  const decision = getLatestDecision();
  const o = observe();
  return {
    kind: "LOCAL_AGI_CARD",
    mode: LOCAL_AGI_MODE_LABEL[state.mode],
    enabled: state.enabled,
    lastRun: run?.startedAt ?? "尚未运行",
    currentDecision: decision
      ? `${LOCAL_AGI_FACTORY_LABEL[decision.chosenFactory]} · ${decision.chosenTask}`
      : "暂无决策",
    generatedOutputs: decision?.generatedOutputs ?? [],
    todayGrowth: summarizeObservation(o),
    nextStep: decision?.expectedValue ?? "运行一次以生成下一步",
  };
}

export interface LocalAGIChatResponse {
  reply: string;
  card?: LocalAGICard;
}

export function tryHandleLocalAGIChat(text: string): LocalAGIChatResponse | null {
  const t = text.trim();
  if (!t) return null;

  const has = (...ks: string[]) => ks.some((k) => t.includes(k));

  if (has("启动专属", "启动 aetherworld", "启用专属", "开启专属 agi")) {
    enableAgi();
    return { reply: "已启用 Aetherworld 专属 AGI。", card: buildLocalAGICard() };
  }
  if (has("暂停专属", "停止专属", "关闭专属")) {
    disableAgi();
    return { reply: "已暂停 Aetherworld 专属 AGI。", card: buildLocalAGICard() };
  }
  if (has("竞争模式")) {
    switchMode("COMPETITION");
    return { reply: "已切换到竞争模式：优先抢数据 / 模型 / 资产 / 用户。", card: buildLocalAGICard() };
  }
  if (has("开发模式")) {
    switchMode("DEVELOPMENT");
    return { reply: "已切换到开发模式：优先生成 Lovable / Codex 任务。", card: buildLocalAGICard() };
  }
  if (has("研究模式")) {
    switchMode("RESEARCH");
    return { reply: "已切换到研究模式：优先运行外界数据雷达。", card: buildLocalAGICard() };
  }
  if (has("工厂调度", "factory control")) {
    switchMode("FACTORY_CONTROL");
    return { reply: "已切换到工厂调度模式。", card: buildLocalAGICard() };
  }
  if (has("只观察")) {
    switchMode("OBSERVE");
    return { reply: "已切换到只观察模式。", card: buildLocalAGICard() };
  }
  if (has("规划模式") || has("plan")) {
    switchMode("PLAN");
    return { reply: "已切换到规划模式。", card: buildLocalAGICard() };
  }
  if (has("自动搜集外界", "外界数据", "运行雷达")) {
    const sigs = scanExternalRadar();
    return {
      reply: `已运行外界数据雷达，新增 ${sigs.length} 条外界信号。`,
      card: buildLocalAGICard(),
    };
  }
  if (has("吸收反馈", "吸收最近反馈")) {
    const absorbed = absorbAllPending(listFeedback());
    return {
      reply: `已吸收 ${absorbed.length} 条反馈，转为开发任务 / 训练样本候选 / Lovable 提示词草案。`,
      card: buildLocalAGICard(),
    };
  }
  if (has("生成下一轮 lovable", "下一轮提示词", "下一轮 lovable")) {
    const devs = scanAndPlanDevelopment({ uxComplaints: 1 });
    return {
      reply: `已生成 ${devs.length} 条开发草案，其中含 Lovable 提示词与验收测试。`,
      card: buildLocalAGICard(),
    };
  }
  if (has("今天 aetherworld 变强", "今天变强", "今日增长", "今天做了什么")) {
    const r = buildDailyReport();
    return {
      reply: `今日增长（${r.date}）：增长分 ${r.growthScore}，新增任务 ${r.newTasks}，新增材料任务 ${r.newSamples}，外界信号 ${r.externalSignals}，吸收反馈 ${r.absorbedFeedback}，开发草案 ${r.developmentDrafts}。下一步：${r.nextBestActions.slice(0, 3).join("、")}。`,
      card: buildLocalAGICard(),
    };
  }
  if (has("抢用户")) {
    switchMode("COMPETITION");
    runOnce();
    return {
      reply: "已进入竞争模式并运行一次：优先生成公司工厂 / 商店草案 / 客户材料任务。",
      card: buildLocalAGICard(),
    };
  }
  if (has("增加模型能力")) {
    return {
      reply: "建议路径：补齐中长样本 → 封冒烟数据集 → 生成训练计划 → dry-run → 启动无人值守训练。",
      card: buildLocalAGICard(),
    };
  }
  if (has("低价值")) {
    return {
      reply: "低价值任务：纯装饰美化、P3 整理类。建议保留观察，不要消耗工厂运力。",
      card: buildLocalAGICard(),
    };
  }
  if (has("操控无人工厂", "操控工厂", "调度无人工厂")) {
    switchMode("FACTORY_CONTROL");
    runOnce();
    return { reply: "已请求专属 AGI 调度无人工厂。", card: buildLocalAGICard() };
  }
  if (has("专属 agi", "专属agi", "local agi", "aetherworld agi", "现在在干嘛")) {
    return { reply: "Aetherworld 专属 AGI 当前状态如下。", card: buildLocalAGICard() };
  }
  return null;
}

export function ingestFeedbackFromChat(content: string): void {
  recordFeedback("USER_CHAT", content);
}
