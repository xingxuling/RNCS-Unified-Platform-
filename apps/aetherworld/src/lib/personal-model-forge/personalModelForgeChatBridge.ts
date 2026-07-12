// 个人模型铸造工坊 · Chat Bridge
import { runPersonalModelForge } from "./personalModelForgeRuntime";
import type {
  ForgeExperiment,
  ForgeLocation,
  PersonalModelForgeReport,
} from "./personalModelForgeTypes";

export interface ChatPersonalModelForgeInfo {
  question: string;
  summary: string;
  focus:
    | "OVERVIEW"
    | "LOCAL"
    | "SERVER"
    | "TOOLCHAIN"
    | "BLOODLINE"
    | "CIVILIZATION_SEED"
    | "CORPUS"
    | "SOLO_TIME";
  focusLabel: string;
  highlightedExperiments?: ForgeExperiment[];
  highlightedToolIds?: string[];
  highlightedStageIds?: string[];
  report: PersonalModelForgeReport;
}

const TRIGGER_KEYWORDS = [
  "训练", "训练计划", "训练路线", "训练管线",
  "模型铸造", "铸造工坊", "personal model forge", "aetherseed",
  "本机", "本机能训练", "我的电脑", "我的 pc", "我的电脑能",
  "晚上慢慢跑", "夜间", "慢速训练",
  "服务器训练", "gpu 服务器", "上服务器",
  "工具链", "lovable", "ollama", "cursor", "codex", "workbuddy",
  "10m", "50m", "100m", "300m", "700m", "1.5b", "3b", "7b",
  "tokenizer", "lora", "qlora", "sft",
  "单人时间模型", "time-rich", "文明种子编译法",
  "语料", "训练语料", "外部语料",
];

export function detectPersonalModelForgeIntent(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

function pickFocus(raw: string): ChatPersonalModelForgeInfo["focus"] {
  const t = raw.toLowerCase();
  if (/服务器|gpu|爆发|300m|700m|1\.5b|3b|7b/.test(t)) return "SERVER";
  if (/本机|我的电脑|我的 pc|夜间|晚上慢慢跑|慢速|10m|50m|100m|tokenizer|lora|qlora/.test(t)) return "LOCAL";
  if (/工具链|lovable|ollama|cursor|codex|workbuddy/.test(t)) return "TOOLCHAIN";
  if (/血统|bloodline|aetherseed/.test(t)) return "BLOODLINE";
  if (/文明种子|种子编译|skeleton|muscle|血液|神经/.test(t)) return "CIVILIZATION_SEED";
  if (/语料|数据集|corpus/.test(t)) return "CORPUS";
  if (/单人时间|time-rich|时间模型/.test(t)) return "SOLO_TIME";
  return "OVERVIEW";
}

const FOCUS_LABEL: Record<ChatPersonalModelForgeInfo["focus"], string> = {
  OVERVIEW: "工坊总览",
  LOCAL: "本机慢速训练炉",
  SERVER: "服务器爆发训练炉",
  TOOLCHAIN: "工具链地图",
  BLOODLINE: "AetherSeed 血统线",
  CIVILIZATION_SEED: "文明种子编译法",
  CORPUS: "语料资产",
  SOLO_TIME: "单人时间模型",
};

export function buildChatPersonalModelForgeInfo(
  raw: string,
): ChatPersonalModelForgeInfo | undefined {
  if (!raw || !detectPersonalModelForgeIntent(raw)) return undefined;
  const report = runPersonalModelForge();
  const focus = pickFocus(raw);

  let highlighted: ForgeExperiment[] | undefined;
  let highlightedToolIds: string[] | undefined;
  let highlightedStageIds: string[] | undefined;

  if (focus === "LOCAL") {
    highlighted = report.localExperiments.slice(0, 4);
  } else if (focus === "SERVER") {
    highlighted = report.serverExperiments.slice(0, 3);
  } else if (focus === "TOOLCHAIN") {
    highlightedToolIds = report.toolchain.map((t) => t.id);
  } else if (focus === "BLOODLINE") {
    highlightedStageIds = report.bloodline.map((s) => s.id);
  }

  // 命中特定参数规模 → 精确匹配
  const scaleMatch = raw.match(/(10m|50m|100m|300m|700m|1\.5b|3b|7b)/i);
  if (scaleMatch) {
    const key = scaleMatch[1].toUpperCase();
    const all: ForgeExperiment[] = [...report.localExperiments, ...report.serverExperiments];
    const hit = all.filter((e) => e.targetModel.toUpperCase().includes(key));
    if (hit.length > 0) highlighted = hit;
  }

  const summaryParts = [
    "本机是慢速训练炉，不是不能训练。",
    `当前路线：${report.bloodline.map((s) => s.parameterScale).join(" → ")}。`,
    focus === "LOCAL"
      ? `本机实验已草案 ${report.localExperiments.length} 项。`
      : focus === "SERVER"
      ? `服务器实验已草案 ${report.serverExperiments.length} 项。`
      : `工具链已登记 ${report.toolchain.length} 个。`,
  ];

  return {
    question: raw,
    summary: summaryParts.join(" "),
    focus,
    focusLabel: FOCUS_LABEL[focus],
    highlightedExperiments: highlighted,
    highlightedToolIds,
    highlightedStageIds,
    report,
  };
}

export function describeLocation(loc: ForgeLocation): string {
  if (loc === "LOCAL_PC") return "本机";
  if (loc === "GPU_SERVER") return "服务器";
  return "混合";
}
