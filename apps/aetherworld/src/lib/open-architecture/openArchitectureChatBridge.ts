// 开源架构吸收 · Chat Bridge：识别用户意图 → 触发分析 → 构造结果卡数据
import {
  createSource,
  absorbOpenArchitecture,
  OPEN_ARCHITECTURE_ABSORPTION_CALCULUS,
  type AbsorbResult,
} from "./openArchitectureRuntime";

export interface ChatOpenArchInfo {
  calculusId: typeof OPEN_ARCHITECTURE_ABSORPTION_CALCULUS;
  question: string;
  summary: string;
  result: AbsorbResult;
  notes: string[];
}

const TRIGGER_KEYWORDS = [
  "开源架构", "吸收架构", "架构吸收", "开源项目", "github", "外部架构",
  "架构迁移", "架构参考", "项目扫描", "能力抽取", "插件系统", "agent 架构",
  "absorb", "open architecture", "import architecture", "readme",
  "把.*转成.*架构", "吸收.*aetherworld", "接进 aetherworld", "接到 aetherworld",
];

export function detectOpenArchIntent(raw: string): boolean {
  if (!raw) return false;
  const text = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => new RegExp(k, "i").test(text));
}

export function buildChatOpenArchInfo(rawInput: string): ChatOpenArchInfo | undefined {
  if (!rawInput || !detectOpenArchIntent(rawInput)) return undefined;
  // 把整段输入作为粗粒度 rawText 给 Analyzer。
  const source = createSource({
    title: extractTitle(rawInput),
    rawText: rawInput,
    sourceType: /github\.com|\.git\b/i.test(rawInput) ? "GITHUB_REPO"
              : /^#|##\s|readme/i.test(rawInput)        ? "README"
              :                                            "MANUAL_DESCRIPTION",
  });
  const result = absorbOpenArchitecture(source);
  return {
    calculusId: OPEN_ARCHITECTURE_ABSORPTION_CALCULUS,
    question: rawInput,
    summary: `识别为「${result.analysis.projectType}」，吸收等级 ${result.analysis.absorptionLevel}，建议桥接为 ${result.bridgePlan.bridgeType}。`,
    result,
    notes: result.warnings,
  };
}

function extractTitle(raw: string): string {
  const firstLine = raw.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? "";
  if (firstLine.length > 0 && firstLine.length <= 80) return firstLine.replace(/^#+\s*/, "");
  return "未命名开源项目";
}

export { OPEN_ARCHITECTURE_ABSORPTION_CALCULUS };
