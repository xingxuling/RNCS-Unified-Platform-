// 畅想式融合 · Chat Bridge
import {
  runImaginativeFusionPipeline,
  IMAGINATIVE_FUSION_CALCULUS,
  type ImaginativePipelineOutput,
} from "./imaginativeFusionRuntime";

export interface ChatImaginativeFusionInfo {
  calculusId: typeof IMAGINATIVE_FUSION_CALCULUS;
  question: string;
  summary: string;
  output: ImaginativePipelineOutput;
}

const TRIGGER_KEYWORDS = [
  "畅想", "自由想象", "想象一下", "脑暴", "脑洞",
  "融合创意", "跨项目融合", "跨项目创意", "融合想象",
  "项目能怎么融合", "项目组合.*商业", "组合最有商业",
  "变成 webxxm", "变成能力包", "适合做成虚拟生活", "适合融合到产品自进化",
  "生成.*融合创意", "给我.*融合.*创意",
  "imaginative fusion", "creative fusion",
];

export function detectImaginativeIntent(raw: string): boolean {
  if (!raw) return false;
  return TRIGGER_KEYWORDS.some((k) => new RegExp(k, "i").test(raw));
}

function parseInputs(raw: string): { projectName: string; description: string }[] {
  const lines = raw
    .split(/\r?\n|[；;]|、/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(畅想|自由|想象|脑|融合)/.test(l));
  if (lines.length >= 2) {
    return lines.slice(0, 10).map((l) => {
      const [name, ...rest] = l.split(/[:：]/);
      return { projectName: (name || l).trim().slice(0, 40), description: (rest.join(":") || l).trim() };
    });
  }
  // 默认种子库（覆盖主要类型，确保模板能触发）
  return [
    { projectName: "AI Chat 项目", description: "chat / agent / 工具调用 / streaming" },
    { projectName: "Workspace 项目", description: "object / 工作区 / 版本管理" },
    { projectName: "Calendar 项目", description: "calendar / schedule / trigger / 日历" },
    { projectName: "Store 项目", description: "store / plugin / capability / webxxm" },
    { projectName: "Social 项目", description: "social / feed / 社区 / 发布" },
    { projectName: "World 项目", description: "world / character / 角色 / 叙事 / 音乐 / vocal" },
    { projectName: "Sandbox 项目", description: "sandbox / code / runtime / 诊断" },
    { projectName: "Analytics 项目", description: "analytics / dashboard / 指标 / 时序" },
    { projectName: "Record / Audit 项目", description: "record / audit / 回验 / 重要性" },
    { projectName: "Local Provider 项目", description: "ollama / llm / 本地模型 / gateway" },
    { projectName: "Life OS 项目", description: "personal os / 虚拟生活 / 每日流" },
    { projectName: "Decision 项目", description: "track / decision / 决策 / 企业" },
  ];
}

export function buildChatImaginativeFusionInfo(raw: string): ChatImaginativeFusionInfo | undefined {
  if (!raw || !detectImaginativeIntent(raw)) return undefined;
  const inputs = parseInputs(raw);
  const output = runImaginativeFusionPipeline(inputs);
  return {
    calculusId: IMAGINATIVE_FUSION_CALCULUS,
    question: raw,
    summary: output.report.summary,
    output,
  };
}

export { IMAGINATIVE_FUSION_CALCULUS };
