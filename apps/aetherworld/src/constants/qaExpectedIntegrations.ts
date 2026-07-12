// QA Expected Integrations · 模块之间预期接入关系
// 用于 QAModuleScanner 自动检测"模块未接入"问题。

import { QA_MODULE_REGISTRY } from "./qaModuleRegistry";

export interface IntegrationEdge {
  fromId: string;     // 提供能力的模块
  toId: string;       // 必须接入它的模块
  reason: string;
}

/**
 * 当前系统期望存在的接入关系。
 * 如果实际产物（页面 / Prompt Forge / Beta Launch / Version Iteration / Docs）
 * 中未读取，则生成 MODULE_NOT_INTEGRATED 问题。
 */
export const EXPECTED_INTEGRATIONS: IntegrationEdge[] = [
  // Real Subject Calculus 应接入的下游
  { fromId: "real-subject-calculus", toId: "trigger-calendar",      reason: "真实主体应进入触发日历 Full Scan。" },
  { fromId: "real-subject-calculus", toId: "determinant-engine",    reason: "定数计算法应读取完整主体数列。" },
  { fromId: "real-subject-calculus", toId: "feedback-weight-engine",reason: "三循环回验应进入权重学习。" },
  { fromId: "real-subject-calculus", toId: "prompt-forge",          reason: "Prompt Forge 应根据三循环生成不同提示词。" },
  { fromId: "real-subject-calculus", toId: "docs-center",           reason: "产品文档应同步真实主体计算法说明。" },

  // Regional UX 应接入的下游
  { fromId: "regional-ux", toId: "prompt-forge",         reason: "Prompt Forge 应按地区调整输出。" },
  { fromId: "regional-ux", toId: "beta-launch",          reason: "Beta Launch 应读取地区适配度。" },
  { fromId: "regional-ux", toId: "version-iteration",    reason: "Version Iteration 应读取地区 UX 适配。" },
  { fromId: "regional-ux", toId: "docs-center",          reason: "产品文档应记录地区用户计算法。" },

  // Feedback Weight Engine 应接入的下游
  { fromId: "feedback-weight-engine", toId: "feedback-center",   reason: "回验中心应展示权重学习。" },
  { fromId: "feedback-weight-engine", toId: "determinant-engine",reason: "定数判断应读取回验权重。" },
  { fromId: "feedback-weight-engine", toId: "prompt-forge",      reason: "Prompt Forge 应反映权重变化。" },
  { fromId: "feedback-weight-engine", toId: "beta-launch",       reason: "Beta Launch 应读取学习进度。" },
  { fromId: "feedback-weight-engine", toId: "version-iteration", reason: "Version Iteration 应读取学习进度。" },

  // Manual Calculus 应接入的下游
  { fromId: "manual-calculus", toId: "usage-safety",         reason: "使用与安全页应承载手册逻辑。" },
  { fromId: "manual-calculus", toId: "safety-boundary",      reason: "安全边界由手册计算法触发。" },
  { fromId: "manual-calculus", toId: "feedback-entry",       reason: "手册计算法应推动回验入口出现。" },
  { fromId: "manual-calculus", toId: "demo-real-isolation",  reason: "手册计算法应解释 Demo/Real 隔离。" },
  { fromId: "manual-calculus", toId: "beta-launch",          reason: "Beta Launch 应读取认知摩擦。" },
  { fromId: "manual-calculus", toId: "version-iteration",    reason: "Version Iteration 应读取认知摩擦。" },

  // Software QA 应接入的下游
  { fromId: "software-qa", toId: "version-iteration", reason: "Version Iteration 应读取 QA Health Score。" },
  { fromId: "software-qa", toId: "beta-launch",       reason: "Beta Launch 应读取阻断/严重问题数量。" },
  { fromId: "software-qa", toId: "docs-center",       reason: "产品文档应同步 QA 说明。" },
  { fromId: "software-qa", toId: "prompt-forge",      reason: "Prompt Forge 应可生成 QA Fix Prompt。" },
];

/** 当前实际已完成接入（由代码现状声明） */
export const ACTUAL_INTEGRATIONS = new Set<string>(
  QA_MODULE_REGISTRY.flatMap((m) =>
    m.expectedIntegrations.map((t) => `${m.id}->${t}`),
  ),
);
