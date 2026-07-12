// AetherDev · Chat 桥
import { listDevRuns } from "./aetherDevStore";
import { observeAndPlan, summarizeRun } from "./aetherDevRuntime";
import type { DevAgentRun } from "./aetherDevTypes";

export interface AetherDevAgentCard {
  title: string;
  overview: string;
  topTasks: Array<{ title: string; priority: string; tool: string; reason: string }>;
  gateway: string;
  nextSuggestion: string;
}

function buildCard(run: DevAgentRun): AetherDevAgentCard {
  const s = summarizeRun(run);
  return {
    title: "自进化开发总脑",
    overview: `共 ${s.total} 个开发任务｜P0 ${s.p0}｜P1 ${s.p1}｜P2 ${s.p2}｜高风险 ${s.highRisk}`,
    topTasks: run.tasks.slice(0, 5).map((t) => ({
      title: t.title,
      priority: t.priority,
      tool: t.cost.recommendedTool,
      reason: t.cost.reason,
    })),
    gateway: `本地网关：${run.snapshot.localGateway.statusLabel} · ${run.snapshot.localGateway.note}`,
    nextSuggestion: run.tasks[0]
      ? `建议先用「${run.tasks[0].cost.recommendedTool}」处理：${run.tasks[0].title}`
      : "项目当前无可自动识别的开发缺口",
  };
}

export function buildAetherDevAgentCard(): AetherDevAgentCard {
  const runs = listDevRuns();
  const run = runs[0] ?? observeAndPlan();
  return buildCard(run);
}

const FAQ: Array<{ test: RegExp; pick: (c: AetherDevAgentCard) => string }> = [
  { test: /扫描|当前(项目|开发).*状态/, pick: (c) => `${c.overview}。${c.gateway}` },
  { test: /最该修|先修|优先修/, pick: (c) => c.nextSuggestion },
  { test: /Codex|cursor|VSCode|Lovable|该用什么|用哪个工具/i, pick: (c) =>
      c.topTasks.map((t) => `${t.priority}｜${t.tool}｜${t.title}（${t.reason}）`).join("\n") || c.nextSuggestion },
  { test: /typecheck|tsc|检查命令/i, pick: (c) => c.gateway },
  { test: /训练样本|写入记录|记录/, pick: () => "已为本次扫描保留训练样本候选与记录写入接口，可在 /system/aetherdev-agent 一键写入。" },
];

export function answerAetherDevQuestion(q: string): { reply: string; card: AetherDevAgentCard } {
  const card = buildAetherDevAgentCard();
  for (const item of FAQ) {
    if (item.test.test(q)) return { reply: item.pick(card), card };
  }
  return { reply: `${card.overview}。${card.nextSuggestion}`, card };
}
