// 提示词计算引擎
import { PROMPT_TYPES, type PromptStage, type PromptTarget, type PromptTypeKey } from "@/constants/promptTypes";
import { clamp } from "./math";
import type { DeterminationStatus } from "@/constants/determinationStates";
import { DETERMINATION_STATES } from "@/constants/determinationStates";

export interface PromptInput {
  target: PromptTarget;
  stage: PromptStage;
  productLogic: string;        // 用户输入的产品逻辑
  currentQuestion: string;     // 当前问题/目标
  geoKey?: string;             // 地理 preset key
  vitalityScore?: number;      // 0-100
  constantScore?: number;      // 0-100
  signalPermission?: "YES" | "CAUTION" | "NO";
  intentClarity: number;       // 0-10
  noise: number;               // 0-10
  scopeDrift: number;          // 0-10
  determinationStatus?: DeterminationStatus;  // 定数状态
  determinationScore?: number;                 // 0-100
}

export interface PromptResult {
  power: number;            // 0-100
  types: PromptTypeKey[];   // 推荐类型
  scopeBoundary: string;
  architectureFocus: string;
  uiFocus: string;
  dataFocus: string;
  riskWarning: string;
  finalPrompt: string;
}

function pickTypes(i: PromptInput): PromptTypeKey[] {
  const out: PromptTypeKey[] = [];
  const q = i.currentQuestion.toLowerCase();
  if (i.stage === "Idea") out.push("strategy", "foundation");
  if (i.stage === "Architecture") out.push("foundation", "data_model");
  if (i.stage === "Prototype") out.push("expansion", "ui_upgrade");
  if (i.stage === "Internal Test") out.push("debug", "ui_upgrade", "release");
  if (i.stage === "Release Candidate") out.push("release", "localization");
  if (q.includes("修") || q.includes("bug") || q.includes("debug")) out.push("debug");
  if (q.includes("重构") || q.includes("refactor")) out.push("refactor");
  if (q.includes("地区") || q.includes("市场") || q.includes("local") || q.includes("香港") || q.includes("新加坡")) out.push("localization");
  if (q.includes("发布") || q.includes("上线") || q.includes("release")) out.push("release");
  if (q.includes("ui") || q.includes("界面") || q.includes("体验")) out.push("ui_upgrade");
  if (q.includes("系统") || q.includes("升级")) out.push("mvp_to_system");
  if (i.determinationStatus === "UNDETERMINED") out.unshift("strategy");
  if (i.determinationStatus === "SEMI_DETERMINED") out.push("expansion");
  if (i.determinationStatus === "DETERMINED" || i.determinationStatus === "NEAR_DETERMINED") out.push("release");
  if (i.determinationStatus === "REVERSE_DETERMINED") out.unshift("refactor");
  if (i.determinationStatus === "FALSE_DETERMINED") out.unshift("debug");
  return Array.from(new Set(out)).slice(0, 4);
}

function determinationStance(status?: DeterminationStatus): { intent: string; tone: string } {
  switch (status) {
    case "DETERMINED":         return { intent: "执行型：按结果推进、发布、确认。", tone: "稳定、收敛、不再展开新假设。" };
    case "NEAR_DETERMINED":    return { intent: "推进型：补齐最后 1–2 个关键变量后正式推进。", tone: "稳定、可承诺，少量保留。" };
    case "SEMI_DETERMINED":    return { intent: "小步推进型：可推进，保留撤回余地，等待关键人物 / 场域确认。", tone: "克制、分段、不一次性公开。" };
    case "UNDETERMINED":       return { intent: "澄清 / 观察型：先补证、收集跨域反馈，不投入承诺。", tone: "开放、问句式、信息收集为主。" };
    case "REVERSE_DETERMINED": return { intent: "转向 / 止损型：撤出强承诺，转向更稳定的分支。", tone: "果断、收回、说明退出条件。" };
    case "FALSE_DETERMINED":   return { intent: "信号净化型：暂停判断，先净化情绪 / 愿望 / 恐惧噪声，再做决策。", tone: "悬置、质询、列出净化清单。" };
    default:                   return { intent: "中性推进。", tone: "保持范围聚焦。" };
  }
}

export function forgePrompt(i: PromptInput): PromptResult {
  const productLogic = clamp(i.productLogic.length / 20, 0, 10);
  const externalConstants = (i.constantScore ?? 60) / 10;
  const externalVariables = i.geoKey ? 7 : 5;
  const realtime = i.intentClarity;
  const vitality = (i.vitalityScore ?? 60) / 10;
  const geoFactor = i.geoKey ? 7 : 5;
  const intent = i.intentClarity;
  const permissionMul = i.signalPermission === "YES" ? 1 : i.signalPermission === "CAUTION" ? 0.7 : 0.4;

  const num = (productLogic + 1) * (externalConstants + 1) * (externalVariables + 1)
    * (realtime + 1) * (vitality + 1) * (geoFactor + 1) * (intent + 1);
  const den = Math.max(1, i.noise) * Math.max(1, i.scopeDrift);
  const raw = Math.log10(num / den + 1) * 16 * permissionMul;
  // 定数态 × 信号许可 微调 power
  let determinationMul = 1;
  if (i.determinationStatus === "DETERMINED") determinationMul = 1.05;
  if (i.determinationStatus === "NEAR_DETERMINED") determinationMul = 1.0;
  if (i.determinationStatus === "SEMI_DETERMINED") determinationMul = 0.85;
  if (i.determinationStatus === "UNDETERMINED") determinationMul = 0.65;
  if (i.determinationStatus === "REVERSE_DETERMINED") determinationMul = 0.55;
  if (i.determinationStatus === "FALSE_DETERMINED") determinationMul = 0.4;
  const power = Math.round(clamp(raw * determinationMul, 0, 100));

  const types = pickTypes(i);
  const typeNames = types.map((k) => PROMPT_TYPES.find((p) => p.key === k)?.name).filter(Boolean).join(" + ");

  const stance = determinationStance(i.determinationStatus);
  const stateMeta = i.determinationStatus ? DETERMINATION_STATES[i.determinationStatus] : null;

  const scopeBoundary = i.scopeDrift >= 6
    ? "强约束范围：本轮只允许修改与当前问题直接相关的模块。"
    : "保持范围聚焦，不引入与目标无关的新功能。";
  const architectureFocus = "保持现有 TanStack Start + 文件路由结构，新增能力以模块形式接入，不重写已有底盘。";
  const uiFocus = "保持深蓝黑底、白金细线、星图网格、克制信息密度；不引入廉价神秘风。";
  const dataFocus = "新增数据使用 localStorage / 本地模块；为未来接入真实 API 预留清晰边界。";
  const riskWarning =
    i.determinationStatus === "FALSE_DETERMINED" ? "当前为假定态：先净化情绪 / 愿望 / 恐惧噪声，再决定是否执行。" :
    i.determinationStatus === "REVERSE_DETERMINED" ? "当前为反定态：本轮提示词应限定在转向 / 止损，不做新承诺。" :
    i.signalPermission === "NO" ? "当前信号未通过净化，不建议执行；先回到信号净化与折域。" :
    i.scopeDrift >= 7 ? "范围漂移风险高，提示词须显式列出禁止项。" :
                        "保持回验入口与边界声明。";

  const final = [
    `# 目标工具：${i.target}`,
    `# 产品阶段：${i.stage}`,
    `# 提示词类型：${typeNames}`,
    stateMeta ? `# 定数态：${stateMeta.label}（${i.determinationScore ?? "-"}/100） · 基调：${stance.tone}` : "",
    ``,
    `## 上下文`,
    `产品逻辑：${i.productLogic || "（未填写）"}`,
    `当前问题：${i.currentQuestion || "（未填写）"}`,
    i.geoKey ? `目标市场：${i.geoKey}` : "",
    `信号许可：${i.signalPermission ?? "未评估"} · 常数价值：${i.constantScore ?? "-"} · 产品活性：${i.vitalityScore ?? "-"}`,
    stateMeta ? `定数判断：${stateMeta.label} — ${stateMeta.desc}` : "",
    ``,
    `## 本轮意图`,
    `- ${stance.intent}`,
    ``,
    `## 范围`,
    `- ${scopeBoundary}`,
    `- ${architectureFocus}`,
    ``,
    `## 任务`,
    `请围绕「${i.currentQuestion || "当前问题"}」执行以下工作：`,
    `1. 维持现有架构，不破坏已有模块命名。`,
    `2. 在合适位置新增 / 修改文件，新增能力以独立模块导入。`,
    `3. UI：${uiFocus}`,
    `4. 数据：${dataFocus}`,
    `5. 输出要点：列出新增 / 修改的文件、关键决策、验证方法。`,
    ``,
    `## 禁止`,
    `- 不要重写未要求修改的页面。`,
    `- 不要替换设计系统或主题色。`,
    `- 不要把产品改成英文版（除非明确要求）。`,
    `- ${riskWarning}`,
    ``,
    `## 验证`,
    `请在完成后给出：可手动验证的 3 个步骤、需要回验的指标、潜在风险窗口。`,
  ].filter(Boolean).join("\n");

  return {
    power, types,
    scopeBoundary, architectureFocus, uiFocus, dataFocus, riskWarning,
    finalPrompt: final,
  };
}

export interface PromptHistoryItem {
  id: string;
  createdAt: string;
  target: PromptTarget;
  stage: PromptStage;
  type: PromptTypeKey[];
  question: string;
  power: number;
  prompt: string;
  effective?: boolean;
  note?: string;
}

const K_PROMPT_HISTORY = "aether.promptHistory.v1";

export function loadPromptHistory(): PromptHistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(K_PROMPT_HISTORY) || "[]"); }
  catch { return []; }
}
export function savePromptHistory(items: PromptHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_PROMPT_HISTORY, JSON.stringify(items.slice(-50)));
}
