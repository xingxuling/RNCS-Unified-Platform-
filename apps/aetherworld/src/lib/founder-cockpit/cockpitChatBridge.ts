// 创始人中枢 Chat 接入
import {
  buildDecisionView,
  buildFactoryCards,
  buildFiveDomainStatus,
  buildGrowthScore,
  buildProductForgeItems,
  buildWorldRadarSignals,
} from "./cockpitAggregator";
import { addSeed, loadMode, saveMode, type CockpitMode, COCKPIT_MODE_LABEL } from "./cockpitStore";
import type { SeedKind } from "./cockpitTypes";

export interface CockpitChatCard {
  kind: "FounderCockpitCard";
  title: string;
  lines: string[];
  nextStep?: string;
}

export function handleCockpitChat(input: string): CockpitChatCard | null {
  const q = input.trim();
  if (!q) return null;

  if (/打开|进入.*中枢|founder cockpit/i.test(q)) {
    return summarize();
  }
  if (/今天.*最该做|今日最高价值|today.*do/i.test(q)) {
    const d = buildDecisionView();
    return {
      kind: "FounderCockpitCard",
      title: "今日最该做的事",
      lines: [
        `AGI 观察：${d.observed}`,
        `选择工厂：${d.chosenFactory}`,
        `判断理由：${d.reason}`,
        `预计价值：${d.estimatedValue}`,
        d.needsFounderApproval ? "需要创始人裁决" : "AGI 可自动推进",
      ],
      nextStep: d.nextStep,
    };
  }
  if (/抢用户|增长|growth/i.test(q)) {
    const g = buildGrowthScore();
    return {
      kind: "FounderCockpitCard",
      title: `今日增长分数：${g.score}`,
      lines: g.reasons,
      nextStep: "进入产品锻造台，挑选可发布候选投放",
    };
  }
  if (/世界.*机会|world radar|外界/i.test(q)) {
    const signals = buildWorldRadarSignals().slice(0, 4);
    return {
      kind: "FounderCockpitCard",
      title: "世界雷达 · 当前机会",
      lines: signals.map((s) => `[${s.category}] ${s.title} — ${s.detail}`),
      nextStep: "进入 /system/world-radar 查看全部信号",
    };
  }
  if (/可以发布|哪个产品.*发布|releas/i.test(q)) {
    const items = buildProductForgeItems().filter(
      (i) => i.status === "RELEASABLE" || i.status === "TESTABLE",
    );
    return {
      kind: "FounderCockpitCard",
      title: "可发布 / 可测试候选",
      lines: items.map((i) => `[${i.status}] ${i.name}（${i.kind}）→ ${i.nextStep}`),
    };
  }
  if (/正在进化|哪个模型/i.test(q)) {
    return {
      kind: "FounderCockpitCard",
      title: "模型进化状态",
      lines: [
        "AetherSeed-300M-Smoke：冒烟数据集已组装，等待真实训练",
        "AetherSeed-VL Private v0.1：VLM 样本登记中，待 LoRA / SFT 配置",
      ],
      nextStep: "进入进化账本 /system/evolution-ledger",
    };
  }
  if (/失败.*最该修|recovery/i.test(q)) {
    const cards = buildFactoryCards();
    const failing = cards.find((c) => Number(c.failures) > 0);
    if (!failing) {
      return {
        kind: "FounderCockpitCard",
        title: "失败恢复中心",
        lines: ["当前没有失败任务"],
      };
    }
    return {
      kind: "FounderCockpitCard",
      title: `${failing.label} · 待恢复`,
      lines: [`失败任务：${failing.failures}`, `下一步：${failing.nextStep}`],
    };
  }
  if (/今天.*变强|aetherworld.*today/i.test(q)) {
    const g = buildGrowthScore();
    return {
      kind: "FounderCockpitCard",
      title: `今日 Aetherworld 增长报告 · 分数 ${g.score}`,
      lines: g.reasons,
    };
  }
  if (/丢.*种子|这个种子.*长成什么|seed/i.test(q)) {
    return {
      kind: "FounderCockpitCard",
      title: "种子入口",
      lines: [
        "支持丢入：文本 / 文件 / 文件夹 / 截图 / 链接 / Lovable 返回 / 用户反馈 / 错误日志 / 产品想法 / 竞品资料",
        "种子 → 骨架 → 肌肉 → 血液 → 神经 → 器官 → 文明",
      ],
      nextStep: "在创始人中枢使用「丢一个种子」入口",
    };
  }
  return null;
}

export function quickDropSeed(kind: SeedKind, summary: string, note?: string) {
  return addSeed({ kind, summary, note });
}

export function setCockpitMode(mode: CockpitMode): string {
  saveMode(mode);
  return `中枢模式已切换为 ${COCKPIT_MODE_LABEL[mode]}`;
}

function summarize(): CockpitChatCard {
  const five = buildFiveDomainStatus();
  const mode = loadMode();
  return {
    kind: "FounderCockpitCard",
    title: `创始人中枢 · 当前模式 ${COCKPIT_MODE_LABEL[mode]}`,
    lines: five.map((d) => `${d.headline}：${d.detail}（${d.health}）`),
    nextStep: "打开 /system/founder-cockpit",
  };
}
