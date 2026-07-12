// 投喂铸造炉 · SourceType 自动识别
import type { IntakeSourceType, IntakeInputMode } from "./intakeForgeTypes";

interface ClassifySignal {
  re: RegExp;
  type: IntakeSourceType;
  weight: number;
}

const TEXT_SIGNALS: ClassifySignal[] = [
  { re: /you are chatgpt|chatgpt\s+conversation|user:\s|assistant:/i, type: "CHATGPT_CONVERSATION", weight: 3 },
  { re: /压缩对话|compressed[_\s-]?dialogue|文明种子编译/i, type: "CHATGPT_COMPRESSED_EXPORT", weight: 4 },
  { re: /lovable\s*(prompt|提示词)|请执行「.+v\d/i, type: "LOVABLE_PROMPT", weight: 4 },
  { re: /lovable\s*(result|返回|response)|files changed:|edited\s+src\//i, type: "LOVABLE_RESULT", weight: 4 },
  { re: /MSL::|@status=|@calculus=|@frametype=/i, type: "MSL_STATE", weight: 5 },
  { re: /sequence\s*memory|数列记忆|compressionratio|sequencecode/i, type: "SEQUENCE_MEMORY", weight: 3 },
  { re: /sequence\s*prediction|数列预测|trajectories/i, type: "SEQUENCE_PREDICTION", weight: 3 },
  { re: /sequence\s*agent|数列\s*agent|agent\s*run/i, type: "SEQUENCE_AGENT_RUN", weight: 3 },
  { re: /sequence\s*ai|数列\s*ai/i, type: "SEQUENCE_AI_RESULT", weight: 2 },
  { re: /bug[_\s-]?audit|bug\s*report|reproduce:/i, type: "BUG_AUDIT", weight: 3 },
  { re: /record\s*center|记录中心/i, type: "RECORD_CENTER_EXPORT", weight: 2 },
  { re: /^#\s+|^##\s+.*readme|^# readme/im, type: "README_DOC", weight: 3 },
  { re: /aetherworld|aetherseed|fusion\s*runtime|五域坐标|常数宇宙|计算法/i, type: "AETHERWORLD_INTERNAL_DOC", weight: 2 },
  { re: /open[_\s-]?architecture|开源架构吸收/i, type: "OPEN_ARCHITECTURE_DOC", weight: 3 },
  { re: /https?:\/\/(github\.com|huggingface\.co|arxiv\.org)/i, type: "NETWORK_SOURCE", weight: 2 },
  { re: /世界观|narrative|character|virtual\s*world|世界种子/i, type: "WORLD_CREATIVE", weight: 2 },
  { re: /import\s+.*from\s+['"]|export\s+(default\s+)?(function|class|const)/, type: "CODE_PROJECT", weight: 2 },
];

const FILENAME_SIGNALS: { re: RegExp; type: IntakeSourceType }[] = [
  { re: /readme/i, type: "README_DOC" },
  { re: /chatgpt|conversations?\.json/i, type: "CHATGPT_COMPRESSED_EXPORT" },
  { re: /\.tsx?$|\.jsx?$|\.py$|\.html$|\.css$/i, type: "CODE_PROJECT" },
  { re: /msl/i, type: "MSL_STATE" },
  { re: /bug|audit/i, type: "BUG_AUDIT" },
  { re: /record/i, type: "RECORD_CENTER_EXPORT" },
];

export interface ClassifyResult {
  sourceType: IntakeSourceType;
  confidence: number; // 0~1
  rationale: string;
}

export function classifyIntakeSource(opts: {
  inputMode: IntakeInputMode;
  text?: string;
  fileName?: string;
  fileCount?: number;
}): ClassifyResult {
  const scores: Partial<Record<IntakeSourceType, number>> = {};
  const reasons: string[] = [];

  // 文件夹模式：默认 PROJECT_FOLDER
  if (opts.inputMode === "FOLDER") {
    scores.PROJECT_FOLDER = 3;
    if ((opts.fileCount ?? 0) > 0) reasons.push(`检测到文件夹（${opts.fileCount} 个文件）`);
  }

  // 文件名信号
  if (opts.fileName) {
    for (const sig of FILENAME_SIGNALS) {
      if (sig.re.test(opts.fileName)) {
        scores[sig.type] = (scores[sig.type] ?? 0) + 2;
        reasons.push(`文件名命中 ${sig.type}`);
      }
    }
  }

  // 文本信号
  if (opts.text) {
    for (const sig of TEXT_SIGNALS) {
      if (sig.re.test(opts.text)) {
        scores[sig.type] = (scores[sig.type] ?? 0) + sig.weight;
        reasons.push(`内容命中 ${sig.type}`);
      }
    }
  }

  const entries = Object.entries(scores) as [IntakeSourceType, number][];
  if (!entries.length) {
    return {
      sourceType: opts.text ? "GENERAL_TEXT" : "UNKNOWN",
      confidence: 0.3,
      rationale: "未命中显著信号，归类为通用文本 / 未知。",
    };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [best, score] = entries[0];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const confidence = Math.min(0.99, score / Math.max(1, total));

  return {
    sourceType: best,
    confidence: Number(confidence.toFixed(2)),
    rationale: reasons.slice(0, 3).join("；"),
  };
}
