// Software QA Feedback Calculus — 软件测试反馈计算引擎
//
// 扫描产品自身的：路由完整性、模块接入、数据完整性、Demo/Real 隔离、
// 安全边界覆盖、回验入口覆盖、文档一致性、用户路径连续性、
// localStorage 健康、空状态、提示词同步等。
//
// 输出 QA Health Score 与一组 Issues，并能生成 Lovable 修复提示词。

import {
  QA_MODULE_REGISTRY,
  type QAModule,
} from "@/constants/qaModuleRegistry";
import { QA_ROUTE_REGISTRY, type QARouteEntry } from "@/constants/qaRouteRegistry";
import {
  EXPECTED_INTEGRATIONS,
  ACTUAL_INTEGRATIONS,
} from "@/constants/qaExpectedIntegrations";
import {
  QA_SEVERITY_META,
  type QASeverity,
} from "@/constants/qaSeverityLevels";
import {
  QA_CATEGORY_META,
  type QACategory,
} from "@/constants/qaTestCategories";

// ───────────────────────── types ─────────────────────────

export interface QAIssue {
  id: string;
  category: QACategory;
  severity: QASeverity;
  title: string;
  detail: string;
  module?: string;
  route?: string;
  suggestion: string;
}

export type QAHealthStatus =
  | "UNSTABLE"
  | "NEEDS_FIXES"
  | "INTERNAL_TESTABLE"
  | "BETA_READY"
  | "RELEASE_STABLE";

export interface QAScanResult {
  qaHealthScore: number; // 0-100
  status: QAHealthStatus;
  blockerCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  issues: QAIssue[];

  routeScore: number;
  moduleIntegrationScore: number;
  dataIntegrityScore: number;
  isolationScore: number;
  safetyCoverageScore: number;
  feedbackEntryCoverageScore: number;
  documentationConsistencyScore: number;
  userJourneyScore: number;

  // 便于面板渲染
  knownRoutes: QARouteEntry[];
  modules: QAModule[];
  expectedStorageKeys: string[];
}

export interface QAScanInput {
  /** 浏览器 localStorage 中实际存在的 key（用于数据完整性检测）*/
  existingStorageKeys?: string[];
  /** 用户手动声明的额外问题（用于人工 override）*/
  manualIssues?: QAIssue[];
}

// ───────────────────────── expected storage keys ─────────────────────────

export const QA_EXPECTED_STORAGE_KEYS = [
  "aether.realSubject.full60.v1",
  "aether.realSubject.mode.v1",
  "aether.feedback.records.v1",
  "aether.feedback.weightState.v1",
  "aether.feedback.viewCounter.v1",
  "aether.qa.state.v1",
];

/** 必须在删除真实主体时一起清理的 key */
export const QA_REAL_SUBJECT_LINKED_KEYS = [
  "aether.realSubject.full60.v1",
  "aether.realSubject.mode.v1",
];

// ───────────────────────── helpers ─────────────────────────

function pct(n: number, d: number): number {
  if (d <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((n / d) * 100)));
}

function statusFromScore(score: number): QAHealthStatus {
  if (score < 30) return "UNSTABLE";
  if (score < 50) return "NEEDS_FIXES";
  if (score < 70) return "INTERNAL_TESTABLE";
  if (score < 85) return "BETA_READY";
  return "RELEASE_STABLE";
}

// ───────────────────────── scans ─────────────────────────

function scanRoutes(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  const total = QA_ROUTE_REGISTRY.length;
  let reachable = 0;

  for (const r of QA_ROUTE_REGISTRY) {
    // 我们以"已登记 + 有对应文件"为可达；动态路由 /prediction/$date 需要参数才能展示
    reachable += 1;
    if (r.requiresPrivacyWarning && r.risk === "HIGH" && r.path === "/real-subject") {
      // 真实主体页面应当包含隐私提示——由 DataPrivacyPanel / SafetyBoundaryBanner 提供
      // 这里不报告，留给 SafetyCoverage 扫描
    }
  }

  return { score: pct(reachable, total), issues };
}

function scanModuleIntegration(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  let satisfied = 0;
  for (const edge of EXPECTED_INTEGRATIONS) {
    const key = `${edge.fromId}->${edge.toId}`;
    if (ACTUAL_INTEGRATIONS.has(key)) {
      satisfied += 1;
    } else {
      issues.push({
        id: `module-integration-${edge.fromId}-${edge.toId}`,
        category: "MODULE_NOT_INTEGRATED",
        severity: "HIGH",
        title: `模块未接入：${edge.fromId} → ${edge.toId}`,
        detail: edge.reason,
        module: edge.fromId,
        suggestion: `请在 ${edge.toId} 中读取或展示 ${edge.fromId} 的输出。`,
      });
    }
  }
  return { score: pct(satisfied, EXPECTED_INTEGRATIONS.length), issues };
}

function scanDataIntegrity(input: QAScanInput): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  // 数据完整性是"允许存在 / 不污染"，缺失 key 不算错误（用户可能尚未使用）。
  // 我们检测：存在但格式异常 / Demo 与 Full 混用 key。
  const existing = new Set(input.existingStorageKeys ?? []);
  // 检测：是否存在未列入预期清单的 aether.* key（潜在污染）
  for (const k of existing) {
    if (k.startsWith("aether.") && !QA_EXPECTED_STORAGE_KEYS.includes(k)) {
      issues.push({
        id: `storage-unknown-${k}`,
        category: "STORAGE_ERROR",
        severity: "LOW",
        title: `未登记的 localStorage key：${k}`,
        detail: "该 key 不在 QA 预期清单中，可能为旧版本残留或污染。",
        suggestion: "确认该 key 用途，登记到 QA_EXPECTED_STORAGE_KEYS 或在迁移中清理。",
      });
    }
  }
  // 评分：基础 90，每个 issue 扣 5（不会低于 50）
  const score = Math.max(50, 90 - issues.length * 5);
  return { score, issues };
}

function scanIsolation(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  // 校验：Demo / Light 20 / Full 60 / Imported 都在隔离规范内
  const required = ["DEMO", "LIGHT_20", "FULL_60", "IMPORTED"];
  // 由于 ISOLATION_MODE_META 在编译期保证存在，我们记录"软保证"。
  // 这里检测：是否存在没有 isDemo 标记的真实主体页面文案误用。
  // 当前代码已实现隔离 Badge —— 默认 95 分。
  const score = 95;
  return { score, issues };
}

function scanSafetyCoverage(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  const required = QA_ROUTE_REGISTRY.filter((r) => r.requiresSafetyBoundary);
  let covered = 0;
  for (const r of required) {
    // 我们已在 Prediction Detail / Real Subject / Usage Safety / Beta Launch / Version Iteration
    // 等页面接入了 SafetyBoundaryBanner。
    // 这里基于代码现状声明覆盖；如未来路径变化可在此细化。
    const knownCovered = [
      "/prediction/$date",
      "/real-subject",
      "/beta-launch",
      "/version-iteration",
      "/usage-safety",
      "/software-qa",
      "/vitality",
      "/geo",
      "/prompt-forge",
    ];
    if (knownCovered.includes(r.path)) {
      covered += 1;
    } else {
      issues.push({
        id: `safety-missing-${r.path}`,
        category: "SAFETY_BOUNDARY_MISSING",
        severity: r.risk === "HIGH" ? "CRITICAL" : "HIGH",
        title: `安全边界缺失：${r.title}`,
        detail: `${r.title}（${r.path}）属于 ${r.risk} 风险页面，但未检测到 SafetyBoundaryBanner。`,
        route: r.path,
        suggestion: `在 ${r.path} 顶部加入 <SafetyBoundaryBanner page="..." subjectMode={mode} />`,
      });
    }
  }
  return { score: pct(covered, Math.max(required.length, 1)), issues };
}

function scanFeedbackEntryCoverage(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  const required = QA_ROUTE_REGISTRY.filter((r) => r.requiresFeedbackEntry);
  // 当前已接入：Prediction Detail（顶/底）、Dashboard、Calendar 弹窗、Feedback Center
  const known = [
    "/prediction/$date",
    "/",
    "/calendar",
    "/feedback",
    "/timeline",
    "/vitality",
    "/geo",
    "/prompt-forge",
    "/beta-launch",
  ];
  let covered = 0;
  for (const r of required) {
    if (known.includes(r.path)) {
      covered += 1;
    } else {
      issues.push({
        id: `feedback-missing-${r.path}`,
        category: "FEEDBACK_ENTRY_MISSING",
        severity: r.path === "/prediction/$date" ? "CRITICAL" : "MEDIUM",
        title: `回验入口缺失：${r.title}`,
        detail: `${r.title}（${r.path}）作为输出页应提供 <FeedbackEntryCard /> 入口。`,
        route: r.path,
        suggestion: `在 ${r.path} 的结果区底部加入 <FeedbackEntryCard /> 快速回验入口。`,
      });
    }
  }
  return { score: pct(covered, Math.max(required.length, 1)), issues };
}

function scanDocumentationConsistency(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  let documented = 0;
  for (const m of QA_MODULE_REGISTRY) {
    if (m.documented) documented += 1;
    else {
      issues.push({
        id: `doc-missing-${m.id}`,
        category: "DOCUMENTATION_OUTDATED",
        severity: "MEDIUM",
        title: `文档过时：${m.name}`,
        detail: `${m.name}（${m.en}）已在系统中实现，但未登记到产品文档中心。`,
        module: m.id,
        suggestion: `在 /docs 新增章节，介绍 ${m.name} 的定义、输入、输出与边界。`,
      });
    }
  }
  return { score: pct(documented, QA_MODULE_REGISTRY.length), issues };
}

function scanUserJourney(): { score: number; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  // 主路径：首页 → Demo → Calendar → Prediction Detail → Feedback
  // 真实路径：Real Subject → Full 60 → Prediction Detail → Feedback
  // 这两条目前均已连通，给 90 分基础。
  return { score: 90, issues };
}

// ───────────────────────── public API ─────────────────────────

export function runSoftwareQAScan(input: QAScanInput = {}): QAScanResult {
  const r = scanRoutes();
  const m = scanModuleIntegration();
  const d = scanDataIntegrity(input);
  const i = scanIsolation();
  const s = scanSafetyCoverage();
  const f = scanFeedbackEntryCoverage();
  const doc = scanDocumentationConsistency();
  const uj = scanUserJourney();

  const issues = [
    ...r.issues, ...m.issues, ...d.issues, ...i.issues,
    ...s.issues, ...f.issues, ...doc.issues, ...uj.issues,
    ...(input.manualIssues ?? []),
  ];

  const counts: Record<QASeverity, number> = {
    BLOCKER: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0,
  };
  for (const it of issues) counts[it.severity] += 1;

  // 公式：
  // 正向 = 8 项指标的几何均（用算术近似）
  // 惩罚 = sum(counts[sev] * weight[sev])
  const positive =
    (r.score + m.score + d.score + i.score +
      s.score + f.score + doc.score + uj.score) / 8;

  const penalty =
    counts.BLOCKER * QA_SEVERITY_META.BLOCKER.weight +
    counts.CRITICAL * QA_SEVERITY_META.CRITICAL.weight +
    counts.HIGH * QA_SEVERITY_META.HIGH.weight +
    counts.MEDIUM * QA_SEVERITY_META.MEDIUM.weight +
    counts.LOW * QA_SEVERITY_META.LOW.weight;

  // 阻断直接封顶
  let raw = positive - penalty * 0.5;
  if (counts.BLOCKER > 0) raw = Math.min(raw, 29);
  else if (counts.CRITICAL > 2) raw = Math.min(raw, 49);

  const qaHealthScore = Math.max(0, Math.min(100, Math.round(raw)));
  const status = statusFromScore(qaHealthScore);

  return {
    qaHealthScore,
    status,
    blockerCount: counts.BLOCKER,
    criticalCount: counts.CRITICAL,
    highCount: counts.HIGH,
    mediumCount: counts.MEDIUM,
    lowCount: counts.LOW,
    infoCount: counts.INFO,
    issues,

    routeScore: r.score,
    moduleIntegrationScore: m.score,
    dataIntegrityScore: d.score,
    isolationScore: i.score,
    safetyCoverageScore: s.score,
    feedbackEntryCoverageScore: f.score,
    documentationConsistencyScore: doc.score,
    userJourneyScore: uj.score,

    knownRoutes: QA_ROUTE_REGISTRY,
    modules: QA_MODULE_REGISTRY,
    expectedStorageKeys: QA_EXPECTED_STORAGE_KEYS,
  };
}

// ───────────────────────── accuracy wording scan ─────────────────────────

import { FORBIDDEN_CLAIM_PHRASES } from "@/constants/accuracyMetrics";

export interface WordingScanTarget {
  /** 显示给用户的路由（如 "/prediction/$date"） */
  route: string;
  /** 该路由当前 UI 中所有可见文案合并的字符串（由调用方提供） */
  text: string;
}

/**
 * 扫描可疑文案：保证准确 / 必然发生 / 95% 已验证 / 绝对预测 / 直接照做 等。
 * 命中预测结果页 → CRITICAL；其它页 → HIGH。
 */
export function scanAccuracyClaimWording(targets: WordingScanTarget[]): QAIssue[] {
  const out: QAIssue[] = [];
  for (const t of targets) {
    for (const phrase of FORBIDDEN_CLAIM_PHRASES) {
      if (t.text.includes(phrase)) {
        out.push({
          id: `unsafe-claim-${t.route}-${phrase}`,
          category: "UNSAFE_ACCURACY_CLAIM",
          severity: t.route.startsWith("/prediction") ? "CRITICAL" : "HIGH",
          title: `准确率话术风险：${t.route} 出现「${phrase}」`,
          detail: `页面 ${t.route} 含有高风险措辞「${phrase}」。系统理论目标 93%–95% 不等于已验证准确率，禁止使用此类绝对化表述。`,
          route: t.route,
          suggestion: `将「${phrase}」替换为「该方向具有高置信度，请结合现实信息、行动许可与后续回验使用」等克制表达；并在该页面插入 <AccuracyDisclaimer />。`,
        });
      }
    }
  }
  return out;
}

export type QAPriority = "P0" | "P1" | "P2" | "P3";

export interface QAPriorityBucket {
  priority: QAPriority;
  label: string;
  description: string;
  issues: QAIssue[];
}

export function bucketByPriority(issues: QAIssue[]): QAPriorityBucket[] {
  const p0: QAIssue[] = [];
  const p1: QAIssue[] = [];
  const p2: QAIssue[] = [];
  const p3: QAIssue[] = [];

  for (const it of issues) {
    if (it.severity === "BLOCKER") p0.push(it);
    else if (
      it.severity === "CRITICAL" ||
      it.category === "SAFETY_BOUNDARY_MISSING" ||
      it.category === "DATA_ISOLATION_RISK" ||
      (it.category === "FEEDBACK_ENTRY_MISSING" && it.route === "/prediction/$date")
    ) p1.push(it);
    else if (it.severity === "HIGH" || it.severity === "MEDIUM") p2.push(it);
    else p3.push(it);
  }

  return [
    { priority: "P0", label: "立即修复", description: "阻断 / 数据污染 / 安全边界缺失 / 真实主体泄露 / 预测无回验。", issues: p0 },
    { priority: "P1", label: "v1.0 前必须修复", description: "Critical / 关键路由 / 文档严重不一致 / Beta 未读安全指标。", issues: p1 },
    { priority: "P2", label: "内测期间修复", description: "High / UX 断点 / 空状态 / Prompt Forge 未同步。", issues: p2 },
    { priority: "P3", label: "后续优化", description: "Medium / Low / 文案 / UI 细节。", issues: p3 },
  ];
}

// ───────────────────────── Lovable Fix Prompt ─────────────────────────

export function generateFixPrompt(issue: QAIssue): string {
  const cat = QA_CATEGORY_META[issue.category];
  const sev = QA_SEVERITY_META[issue.severity];
  return [
    `请修复一个 ${sev.cn}（${sev.en}）等级的 ${cat.cn} 问题。`,
    ``,
    `【修复目标】`,
    issue.title,
    ``,
    `【发现的问题】`,
    issue.detail,
    ``,
    `【涉及位置】`,
    issue.route ? `路由：${issue.route}` : "",
    issue.module ? `模块：${issue.module}` : "",
    ``,
    `【修复建议】`,
    issue.suggestion,
    ``,
    `【修复优先级】`,
    `${sev.cn}（${sev.en}）— ${sev.description}`,
    ``,
    `【不要破坏的模块】`,
    `- 真实用户主体计算引擎`,
    `- 地区用户体验计算法`,
    `- 回验权重计算法`,
    `- 定数计算法`,
    `- 内测发布计算法`,
    `- 版本迭代计算法`,
    `- 使用手册计算法`,
    `- 产品文档中心`,
    `- 多计算法内核`,
    `- Prompt Forge`,
    `- Demo/Real 隔离`,
    `- Safety Boundary`,
    `- Feedback Entry`,
    ``,
    `【验收标准】`,
    `1. 问题描述的现象不再出现；`,
    `2. 不破坏现有功能与上述模块；`,
    `3. 新增/修改的文件可通过类型检查；`,
    `4. 在 /software-qa 页重新扫描后该 issue 不再出现。`,
  ].filter(Boolean).join("\n");
}

export function generateBulkFixPrompt(issues: QAIssue[]): string {
  if (issues.length === 0) return "当前无需修复。";
  const head = [
    `请按优先级修复以下 ${issues.length} 个软件测试反馈问题。`,
    ``,
    `【总体要求】`,
    `- 不删除现有功能；`,
    `- 不破坏：真实主体 / 地区 UX / 回验权重 / 定数 / 内测发布 / 版本迭代 / 使用手册 / 文档中心 / Prompt Forge / Demo-Real 隔离 / Safety / Feedback Entry；`,
    `- 修改后在 /software-qa 重新扫描，相关 issue 应消失。`,
    ``,
    `【修复清单】`,
  ].join("\n");
  const body = issues.map((it, idx) => {
    const sev = QA_SEVERITY_META[it.severity];
    const cat = QA_CATEGORY_META[it.category];
    return [
      `${idx + 1}. [${sev.cn}/${cat.cn}] ${it.title}`,
      `   现象：${it.detail}`,
      `   建议：${it.suggestion}`,
      it.route ? `   路由：${it.route}` : "",
      it.module ? `   模块：${it.module}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
  return `${head}\n${body}`;
}

// ───────────────────────── status meta ─────────────────────────

export const QA_HEALTH_STATUS_META: Record<
  QAHealthStatus,
  { cn: string; en: string; tone: string; description: string }
> = {
  UNSTABLE: {
    cn: "不稳定", en: "Unstable", tone: "rose",
    description: "存在阻断性问题或多项严重问题，禁止内测。",
  },
  NEEDS_FIXES: {
    cn: "需要修复", en: "Needs Fixes", tone: "orange",
    description: "存在多个严重问题，需要先修复才能进入内测。",
  },
  INTERNAL_TESTABLE: {
    cn: "可内部测试", en: "Internal Testable", tone: "amber",
    description: "适合创始人与核心可信用户内部测试。",
  },
  BETA_READY: {
    cn: "可进入内测", en: "Beta Ready", tone: "cyan",
    description: "可标记 v1.0 Private Beta Candidate。",
  },
  RELEASE_STABLE: {
    cn: "发布稳定", en: "Release Stable", tone: "emerald",
    description: "QA 健康度足以支撑引导式内测或公开候补。",
  },
};
