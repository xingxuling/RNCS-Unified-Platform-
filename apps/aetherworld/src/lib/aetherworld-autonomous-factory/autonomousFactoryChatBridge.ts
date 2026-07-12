// Aetherworld Autonomous Factory OS · Chat 桥
import { buildCompanyCard, buildMaterialCard, buildOverview, buildTrainingCard } from "./autonomousFactoryRuntime";
import { listFactoryTasks } from "./autonomousFactoryStore";

export interface AutonomousFactoryCard {
  title: string;
  overview: string;
  material: string;
  training: string;
  company: string;
  failed: string[];
  nextSuggestion: string;
}

export function buildAutonomousFactoryCard(): AutonomousFactoryCard {
  const ov = buildOverview();
  const m = buildMaterialCard();
  const t = buildTrainingCard(false);
  const c = buildCompanyCard();
  const failed = listFactoryTasks().filter((x) => x.status === "FAILED");
  return {
    title: "无人工厂总控",
    overview: `今日任务 ${ov.todayCount}｜运行中 ${ov.running}｜完成 ${ov.completed}｜失败 ${ov.failed}`,
    material: `材料工厂：样本池 ${m.samplePool}，已封版数据集 ${m.sealedDatasets}，待复核 ${m.pendingReview}`,
    training: `训练工厂：${t.activeRun}｜守护器 ${t.daemonStatus}｜下一炉：${t.nextPlan}`,
    company: `公司工厂：能力候选 ${c.assetCandidates}，商店草案 ${c.storeDrafts}，下一步：${c.nextStep}`,
    failed: failed.map((f) => `${f.title}：${f.failureReason ?? "未知原因"}`),
    nextSuggestion: ov.nextSuggestion,
  };
}

const FAQ: Array<{ test: RegExp; pick: (c: AutonomousFactoryCard) => string }> = [
  { test: /今天.*无人工厂|今天.*做了什么/, pick: (c) => `${c.overview}。${c.nextSuggestion}` },
  { test: /材料工厂.*缺|材料工厂现在/, pick: (c) => c.material },
  { test: /训练工厂.*能不能|训练工厂现在/, pick: (c) => c.training },
  { test: /公司工厂.*生成|公司工厂现在/, pick: (c) => c.company },
  { test: /哪个任务失败|失败任务/, pick: (c) => c.failed.join("；") || "当前没有失败任务" },
  { test: /下一(批|步|轮|炉)/, pick: (c) => c.nextSuggestion },
];

export function answerAutonomousFactoryQuestion(q: string): {
  reply: string;
  card: AutonomousFactoryCard;
} {
  const card = buildAutonomousFactoryCard();
  for (const item of FAQ) {
    if (item.test.test(q)) return { reply: item.pick(card), card };
  }
  return {
    reply: `${card.overview}。${card.nextSuggestion}`,
    card,
  };
}
