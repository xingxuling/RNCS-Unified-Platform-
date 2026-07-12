// AetherSeed First Run Readiness · Chat 桥
import { buildFirstRunReadinessSnapshot } from "./firstRunReadinessRuntime";
import { READINESS_LEVEL_LABEL, type FirstRunReadinessSnapshot } from "./firstRunReadinessTypes";
import {
  buildFirstRunValidationFlow,
  listFirstRunBlockers,
} from "./firstRunValidationFlow";

export type FirstRunChatFocus =
  | "READINESS"
  | "IGNITE"
  | "MODEL_PICK"
  | "SAMPLE_SIZE"
  | "BLOCKED_REASONS"
  | "FINAL_CHECKLIST"
  | "OVERVIEW";

const FOCUS_LABEL: Record<FirstRunChatFocus, string> = {
  READINESS: "第一炉准备状态",
  IGNITE: "现在能否点火",
  MODEL_PICK: "第一炉模型建议",
  SAMPLE_SIZE: "第一炉样本量建议",
  BLOCKED_REASONS: "为什么现在不能训练",
  FINAL_CHECKLIST: "点火前最后确认清单",
  OVERVIEW: "第一炉训练准备总览",
};

const TRIGGERS = [
  "第一炉", "第一次训练", "能不能点火", "可以点火", "点火",
  "第一炉准备", "first run", "ignite",
  "我应该先训", "先训哪个", "训多少", "用多少数据",
  "为什么现在不能训练", "为啥不能训练",
  "最后检查", "最后确认", "还差什么", "还差哪些",
  "300m", "300M", "aetherseed 300", "AetherSeed 300", "私有模型",
  "webxxm", "WebXXM", "tiny", "ollama", "Ollama",
  "router tiny", "Router Tiny", "先跑",
];

export function detectFirstRunIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGERS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): FirstRunChatFocus {
  const t = raw.toLowerCase();
  if (/webxxm|tiny|router tiny|为什么.*不做|为啥.*不做/.test(t)) return "MODEL_PICK";
  if (/300m|私有模型|aetherseed 300|ollama/.test(t)) return "READINESS";
  if (/最后检查|最后确认|最后看一?遍|final checklist/.test(t)) return "FINAL_CHECKLIST";
  if (/还差什么|还差哪些|缺什么|缺哪些/.test(t)) return "BLOCKED_REASONS";
  if (/为什么|为啥|不能训练|blocked/.test(t)) return "BLOCKED_REASONS";
  if (/点火|ignite|能不能训|可以训/.test(t)) return "IGNITE";
  if (/先跑|先训|哪个|模型|model/.test(t)) return "MODEL_PICK";
  if (/多少数据|多少样本|sample|样本量/.test(t)) return "SAMPLE_SIZE";
  if (/准备|状态|readiness/.test(t)) return "READINESS";
  return "OVERVIEW";
}

export interface ChatFirstRunInfo {
  question: string;
  focus: FirstRunChatFocus;
  focusLabel: string;
  summary: string;
  levelLabel: string;
  score: number;
  blockingReasons: string[];
  topModel: { name: string; reason: string; sampleCap: number };
  remainingSteps: string[];
  finalChecklist: { label: string; ok: boolean }[];
  canIgnite: boolean;
  workbenchHint: string;
}

function summarize(
  focus: FirstRunChatFocus,
  snap: FirstRunReadinessSnapshot,
  remaining: string[],
  canIgnite: boolean,
): string {
  const lvl = READINESS_LEVEL_LABEL[snap.level];
  const MAIN = "当前主线：AetherSeed 300M 私有模型（创始人私有 · 不公开 / 不开源 / 不上传）。";
  switch (focus) {
    case "IGNITE":
      return canIgnite
        ? `${MAIN} 当前状态「可以点火」。仍需在 /system/auto-training 走完 dry-run + 用户确认；系统不会替你点火。`
        : `${MAIN} 当前状态「${lvl}」，无法点火。距离点火还差 ${remaining.length} 个步骤，请在 /system/first-run-readiness 处理。`;
    case "MODEL_PICK":
      return `${MAIN} 暂时不训练 WebXXM-2 / Router Tiny / MSL Tiny / Format Tiny；第一炉默认训练计划即 AetherSeed 300M（CPT + SFT，若不可用则降级 SFT_ONLY）。`;
    case "SAMPLE_SIZE":
      return `${MAIN} 300M 第一炉建议从小批 300-1000 条结构化样本起步、逐步扩到 3000-5000 条；禁止全量与未脱敏数据。`;
    case "BLOCKED_REASONS":
      return remaining.length
        ? `${MAIN} 当前阻断点火（${remaining.length} 条）：${remaining.slice(0, 3).join("；")}${remaining.length > 3 ? "…" : ""}`
        : `${MAIN} 当前没有阻断步骤；请到自动训练器走完 dry-run + 用户确认。`;
    case "FINAL_CHECKLIST":
      return canIgnite
        ? `${MAIN} 点火前最后清单已全部通过且用户已确认；可前往自动训练器点火（系统不会替你点火）。`
        : `${MAIN} 点火前最后清单尚有未勾选项；请先处理「实测验收流程」未通过的步骤，再点击「我已确认第一炉点火」。`;
    case "READINESS":
      return `${MAIN} 第一炉准备总分 ${snap.score}/100，状态：${lvl}。Ollama 接入仅作流程预留，本轮不真正执行 GGUF 转换。`;
    case "OVERVIEW":
    default:
      return `${MAIN} 第一炉准备聚合 dataset / export / 训练计划 / 自动训练 / 实验账本 / 本地网关 的只读状态，所有写操作仍走原页面。`;
  }
}

export function buildChatFirstRunInfo(raw: string): ChatFirstRunInfo | undefined {
  if (!detectFirstRunIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const snap = buildFirstRunReadinessSnapshot();
  const flow = buildFirstRunValidationFlow();
  const remaining = listFirstRunBlockers();
  const router = flow.primaryRecommendation;
  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: summarize(focus, snap, remaining, flow.canIgnite),
    levelLabel: READINESS_LEVEL_LABEL[snap.level],
    score: snap.score,
    blockingReasons: snap.blockingReasons,
    topModel: { name: router.modelName, reason: router.reason, sampleCap: router.recommendedSampleCap },
    remainingSteps: remaining,
    finalChecklist: flow.finalChecklist.map((c) => ({ label: c.label, ok: c.ok })),
    canIgnite: flow.canIgnite,
    workbenchHint: "前往 /system/first-run-readiness 的「实测验收流程」按 7 步走完，再回到本页点击「我已确认第一炉点火」。",
  };
}

