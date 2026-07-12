// Multi-Client UI Fit Evaluation Engine · 多用户端 UI 适评算法
import {
  CLIENT_PROFILES, getClientProfile, MODULES, type ClientProfile,
} from "@/constants/clientProfiles";
import {
  DEVICE_PROFILES, getDeviceProfile, type DeviceProfile,
} from "@/constants/deviceProfiles";
import { densityIndex, type UIDensityLevel } from "@/constants/uiDensityLevels";
import {
  UI_FIT_FACTORS, FIT_LEVELS, getFitLevel, type FitLevelId,
} from "@/constants/uiFitFactors";
import {
  EXPOSURE_RISKS, ENTERPRISE_SAFE_LEXICON, MISLEADING_COPY_KEYWORDS,
  type ExposureLevel,
} from "@/constants/uiExposureRules";
import { getRoleRule } from "@/constants/roleBasedUIRules";

export interface UIFitFactorScore {
  id: string;
  cn: string;
  kind: "positive" | "negative";
  value: number; // 0-100
}

export interface ExposureRiskHit {
  id: string;
  cn: string;
  en: string;
  level: ExposureLevel;
  affectedClient: string;
  affectedDevice: string;
  recommendedFix: string;
}

export interface UIFitResult {
  clientProfile: string;
  clientProfileCN: string;
  deviceProfile: string;
  deviceProfileCN: string;
  uiFitScore: number;          // 0-100
  fitLevel: FitLevelId;
  fitLevelCN: string;
  fitLevelTone: string;
  recommendedDensity: UIDensityLevel;
  actualDensity: UIDensityLevel;
  factorScores: UIFitFactorScore[];
  overloadedAreas: string[];
  hiddenRecommended: string[];
  exposedRiskModules: string[];
  missingCTAs: string[];
  navigationIssues: string[];
  safetyVisibilityScore: number;       // 0-100
  feedbackAccessibilityScore: number;  // 0-100
  exposureRisks: ExposureRiskHit[];
  recommendations: string[];
  enterpriseSafeMode: boolean;
}

export interface UIFitContext {
  /** 当前页面包含的额外文案（用于扫描误导性词、命运化词） */
  pageCopySamples?: string[];
  /** 是否已显示 SafetyBoundaryBanner */
  hasSafetyBanner?: boolean;
  /** 是否已显示 FeedbackEntryCard / 等回验入口 */
  hasFeedbackEntry?: boolean;
  /** 是否已显示 Demo/Real Badge */
  hasDemoRealBadge?: boolean;
  /** 当前侧栏总项数（默认 25） */
  sidebarItemCount?: number;
  /** 是否在该端开放 Full 60 编辑（用于 mobile_small 检测） */
  exposesFull60Editor?: boolean;
}

const DEFAULT_CTX: Required<UIFitContext> = {
  pageCopySamples: [],
  hasSafetyBanner: true,
  hasFeedbackEntry: true,
  hasDemoRealBadge: true,
  sidebarItemCount: 25,
  exposesFull60Editor: false,
};

// ---------- 工具 ----------
function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function deviceDensityFit(
  client: ClientProfile,
  device: DeviceProfile,
): { actual: UIDensityLevel; recommended: UIDensityLevel; score: number } {
  // 小屏手机最多 MEDIUM，除非用户显式 Expert
  const cappedRecommended: UIDensityLevel =
    device.id === "mobile_small" && client.uiDensity !== "EXPERT"
      ? "LOW"
      : device.id === "mobile_large" && densityIndex(client.uiDensity) > densityIndex("MEDIUM")
        ? "MEDIUM"
        : client.uiDensity;

  const actual = client.uiDensity;
  const diff = Math.abs(densityIndex(actual) - densityIndex(device.recommendedDensity));
  // diff 0→100，1→75，2→50，3→20
  const score = [100, 75, 50, 20][Math.min(diff, 3)];
  return { actual, recommended: cappedRecommended, score };
}

function roleVisibilityFit(client: ClientProfile, exposedModules: string[]) {
  // exposedModules：当前给该角色暴露的模块集合
  const overexposed = exposedModules.filter(m => client.hiddenModules.includes(m));
  const allowed = client.allowedModules;
  const missing = allowed.filter(m => !exposedModules.includes(m));
  const overPenalty = overexposed.length * 8;
  const missPenalty = missing.length * 2;
  return {
    score: clamp(100 - overPenalty - missPenalty),
    overexposed,
    missing,
  };
}

function detectExposureRisks(
  client: ClientProfile,
  device: DeviceProfile,
  ctx: Required<UIFitContext>,
  exposedModules: string[],
): ExposureRiskHit[] {
  const hits: ExposureRiskHit[] = [];
  const push = (id: string, level: ExposureLevel) => {
    const def = EXPOSURE_RISKS.find(r => r.id === id)!;
    hits.push({
      id: def.id, cn: def.cn, en: def.en, level,
      affectedClient: client.name,
      affectedDevice: device.name,
      recommendedFix: def.recommendedFix,
    });
  };

  // 高级功能过早暴露
  const advancedSensitive = [MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.FEEDBACK_WEIGHTS];
  const advanced = advancedSensitive.filter(m => exposedModules.includes(m) && client.hiddenModules.includes(m));
  if (advanced.length) push("advanced_overexposure", advanced.length >= 2 ? "HIGH" : "MEDIUM");

  // Full 60 隐私暴露
  if (
    exposedModules.includes(MODULES.REAL_SUBJECT) &&
    (client.id === "demo_visitor" || client.id === "mobile_casual")
  ) {
    push("full60_privacy_overexposure", "HIGH");
  }
  if (device.id === "mobile_small" && ctx.exposesFull60Editor) {
    push("full60_privacy_overexposure", "HIGH");
  }

  // 命运化语言（企业模式）
  if (client.id === "enterprise_user") {
    const copy = ctx.pageCopySamples.join(" ");
    const hasMystic = ENTERPRISE_SAFE_LEXICON.some(x => copy.includes(x.from));
    if (hasMystic) push("mystic_language_exposure", "HIGH");
  }

  // 安全上下文缺失（高风险用户/页面）
  if (!ctx.hasSafetyBanner && client.safetyLevel === "HIGH") {
    push("missing_safety_context", "HIGH");
  }

  // 回验入口隐藏
  if (!ctx.hasFeedbackEntry && client.feedbackNeed !== "LOW") {
    push("feedback_path_hidden", "HIGH");
  }

  // 导航过载
  const expectedNav = client.allowedModules.length;
  if (ctx.sidebarItemCount > Math.ceil(expectedNav * 1.5)) {
    push("navigation_overload", "MEDIUM");
  }

  // 移动端密集矩阵
  if (
    (device.id === "mobile_small" || device.id === "mobile_large") &&
    densityIndex(client.uiDensity) >= densityIndex("HIGH")
  ) {
    push("dense_matrix_on_mobile", "HIGH");
  }

  // Demo/Real 不分
  if (!ctx.hasDemoRealBadge && (client.id === "demo_visitor" || client.id === "full_subject_user" || client.id === "light_user")) {
    push("demo_real_ambiguity", "HIGH");
  }

  // Prompt Forge 过早
  if (exposedModules.includes(MODULES.PROMPT_FORGE) && (client.id === "demo_visitor" || client.id === "mobile_casual")) {
    push("prompt_forge_premature", "MEDIUM");
  }

  // 误导性文案
  const copy = ctx.pageCopySamples.join(" ");
  if (MISLEADING_COPY_KEYWORDS.some(k => copy.includes(k))) {
    push("docs_underexposure", "LOW"); // 借用 LOW 槽位作为辅助提示
  }

  return hits;
}

// ---------- 主入口 ----------
export function evaluateUIFit(
  clientId: string,
  deviceId: string,
  context: UIFitContext = {},
): UIFitResult {
  const client = getClientProfile(clientId);
  const device = getDeviceProfile(deviceId);
  const ctx = { ...DEFAULT_CTX, ...context };

  // 该角色默认应暴露的模块集合
  const role = getRoleRule(client.id);
  const exposedModules = role.show;

  const density = deviceDensityFit(client, device);
  const vis = roleVisibilityFit(client, exposedModules);
  const risks = detectExposureRisks(client, device, ctx, exposedModules);

  // 各因子分（0-100）
  const factor = (id: string, value: number, kind: "positive" | "negative" = "positive"): UIFitFactorScore => {
    const def = UI_FIT_FACTORS.find(f => f.id === id)!;
    return { id, cn: def.cn, kind: def.kind ?? kind, value: clamp(Math.round(value)) };
  };

  const cogScore = clamp(100 - (densityIndex(client.uiDensity) - densityIndex(device.recommendedDensity)) * 18);
  const safetyVis = clamp(
    (ctx.hasSafetyBanner ? 70 : 30) +
    (client.safetyLevel === "HIGH" && ctx.hasDemoRealBadge ? 20 : 0) +
    (risks.some(r => r.id === "missing_safety_context") ? -25 : 10),
  );
  const feedbackAcc = clamp(
    (ctx.hasFeedbackEntry ? 80 : 30) +
    (risks.some(r => r.id === "feedback_path_hidden") ? -30 : 10),
  );
  const navClarity = clamp(100 - Math.max(0, ctx.sidebarItemCount - client.allowedModules.length) * 3);
  const featurePriority = clamp(exposedModules.includes(client.defaultHome) ? 90 : 60);
  const regionalUx = 75; // 由 RegionalUX 接入；这里给中性基线
  const permFit = vis.score;

  const positives: UIFitFactorScore[] = [
    factor("device_fit", density.score),
    factor("role_fit", vis.score),
    factor("permission_fit", permFit),
    factor("cognitive_load_fit", cogScore),
    factor("regional_ux_fit", regionalUx),
    factor("feature_priority_fit", featurePriority),
    factor("safety_visibility", safetyVis),
    factor("feedback_accessibility", feedbackAcc),
    factor("navigation_clarity", navClarity),
  ];

  // 负向因子
  const overload = clamp(
    (densityIndex(client.uiDensity) > densityIndex(device.recommendedDensity) ? 60 : 15) +
    (risks.filter(r => r.id === "dense_matrix_on_mobile").length * 25),
  );
  const exposureRisk = clamp(
    risks.filter(r => r.level === "HIGH").length * 30 +
    risks.filter(r => r.level === "MEDIUM").length * 15 +
    risks.filter(r => r.level === "LOW").length * 5,
  );
  const misleading = clamp(
    MISLEADING_COPY_KEYWORDS.some(k => ctx.pageCopySamples.join(" ").includes(k)) ? 70 : 5,
  );
  const friction = clamp(
    (ctx.sidebarItemCount > 18 ? 30 : 10) +
    (client.id === "mobile_casual" && exposedModules.length > 6 ? 25 : 0),
  );
  const negatives: UIFitFactorScore[] = [
    factor("ui_overload", overload, "negative"),
    factor("feature_exposure_risk", exposureRisk, "negative"),
    factor("misleading_copy", misleading, "negative"),
    factor("interaction_friction", friction, "negative"),
  ];

  // 综合分：正向加权平均 - 负向惩罚
  const posWeights = positives.map(p => UI_FIT_FACTORS.find(f => f.id === p.id)!.weight);
  const posAvg =
    positives.reduce((acc, p, i) => acc + p.value * posWeights[i], 0) /
    posWeights.reduce((a, b) => a + b, 0);
  const negWeights = negatives.map(n => UI_FIT_FACTORS.find(f => f.id === n.id)!.weight);
  const negAvg =
    negatives.reduce((acc, n, i) => acc + n.value * negWeights[i], 0) /
    negWeights.reduce((a, b) => a + b, 0);

  const uiFitScore = clamp(Math.round(posAvg - negAvg * 0.5));
  const level = getFitLevel(uiFitScore);

  // 建议
  const recommendations: string[] = [];
  if (density.score < 75) recommendations.push(`将 UI 密度调整为 ${density.recommended}（当前 ${density.actual}）。`);
  if (vis.overexposed.length) recommendations.push(`隐藏不该暴露的模块：${vis.overexposed.join("、")}。`);
  if (vis.missing.length) recommendations.push(`补充该角色常用模块入口：${vis.missing.slice(0, 4).join("、")}。`);
  if (!ctx.hasSafetyBanner && client.safetyLevel === "HIGH") recommendations.push("在高风险页面顶部加入 SafetyBoundaryBanner。");
  if (!ctx.hasFeedbackEntry && client.feedbackNeed !== "LOW") recommendations.push("在预测结果区域增加 FeedbackEntryCard。");
  if (!ctx.hasDemoRealBadge) recommendations.push("在主标题旁显示 DemoRealIsolationBadge。");
  if (risks.some(r => r.id === "mystic_language_exposure")) recommendations.push("启用 Enterprise Safe Mode，替换命运化词汇为情境化表达。");
  if (risks.some(r => r.id === "dense_matrix_on_mobile")) recommendations.push("移动端将矩阵改为分段卡片或只读摘要。");
  if (device.id === "mobile_small" && ctx.exposesFull60Editor) recommendations.push("小屏手机禁用 Full 60 编辑，仅保留只读摘要。");
  if (recommendations.length === 0) recommendations.push("当前组合适配良好，可保持现状并持续回验。");

  // 缺失 CTA
  const missingCTAs: string[] = [];
  if (!exposedModules.includes(client.defaultHome)) missingCTAs.push(`默认首页：${client.defaultHome}`);
  if (client.feedbackNeed === "HIGH" && !ctx.hasFeedbackEntry) missingCTAs.push("回验主 CTA");
  if (client.safetyLevel === "HIGH" && !ctx.hasSafetyBanner) missingCTAs.push("安全边界提示");

  // 导航问题
  const navigationIssues: string[] = [];
  if (ctx.sidebarItemCount > Math.ceil(client.allowedModules.length * 1.5)) {
    navigationIssues.push(`侧栏 ${ctx.sidebarItemCount} 项，建议按角色折叠到约 ${client.allowedModules.length} 项。`);
  }

  return {
    clientProfile: client.nameEn,
    clientProfileCN: client.name,
    deviceProfile: device.nameEn,
    deviceProfileCN: device.name,
    uiFitScore,
    fitLevel: level.id,
    fitLevelCN: level.cn,
    fitLevelTone: level.tone,
    recommendedDensity: density.recommended,
    actualDensity: density.actual,
    factorScores: [...positives, ...negatives],
    overloadedAreas: device.forbiddenPatterns,
    hiddenRecommended: vis.overexposed,
    exposedRiskModules: vis.overexposed,
    missingCTAs,
    navigationIssues,
    safetyVisibilityScore: safetyVis,
    feedbackAccessibilityScore: feedbackAcc,
    exposureRisks: risks,
    recommendations,
    enterpriseSafeMode: role.enterpriseSafeMode === true,
  };
}

// ---------- 矩阵：所有客户端 × 所有设备 ----------
export interface MatrixCell {
  clientId: string;
  deviceId: string;
  score: number;
  level: FitLevelId;
  density: UIDensityLevel;
  openFull60: boolean;
  openAdvanced: boolean;
  openPromptForge: boolean;
  showSafety: boolean;
  showFeedback: boolean;
}

export function buildFitMatrix(context: UIFitContext = {}): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (const c of CLIENT_PROFILES) {
    for (const d of DEVICE_PROFILES) {
      const r = evaluateUIFit(c.id, d.id, context);
      cells.push({
        clientId: c.id,
        deviceId: d.id,
        score: r.uiFitScore,
        level: r.fitLevel,
        density: r.recommendedDensity,
        openFull60: c.allowedModules.includes(MODULES.REAL_SUBJECT) && d.id !== "mobile_small",
        openAdvanced: c.allowedModules.includes(MODULES.ADVANCED_CORE) && d.id !== "mobile_small" && d.id !== "mobile_large",
        openPromptForge: c.allowedModules.includes(MODULES.PROMPT_FORGE) && d.id !== "mobile_small",
        showSafety: c.safetyLevel !== "LOW",
        showFeedback: c.feedbackNeed !== "LOW",
      });
    }
  }
  return cells;
}

// ---------- 用户旅程 ----------
const JOURNEYS: Record<string, string[]> = {
  demo_visitor:      ["首页 Demo", "触发日历", "预测详情", "快速回验", "创建 Light 20"],
  light_user:        ["主控台", "创建 Light 20", "触发日历", "预测详情", "回验", "预测有效率"],
  full_subject_user: ["隐私确认", "Full 60 输入", "循环分析", "完整扫描", "定数", "回验权重"],
  creator_user:      ["产品活性", "提示词锻造", "发布窗口", "复制提示词", "回验"],
  research_user:     ["文档中心", "计算法文档", "回验协议", "Demo 分析", "导出笔记"],
  enterprise_user:   ["Decision Overview", "Scenario Trigger", "Risk Window", "Review Node", "导出摘要"],
  beta_tester:       ["内测发布", "使用指引", "提交反馈", "问题报告", "版本状态"],
  admin_founder:     ["QA", "重算中心", "版本迭代", "内测发布", "提示词锻造", "文档"],
  mobile_casual:     ["今日定数", "今日行动许可", "触发日历摘要", "快速回验"],
  power_user:        ["高级内核", "Full 60", "提示词锻造", "回验权重", "回验"],
};

export function getClientJourney(clientId: string): string[] {
  return JOURNEYS[clientId] ?? JOURNEYS.light_user;
}

// ---------- Prompt 生成 ----------
export type FitPromptKind =
  | "MOBILE_SIMPLIFY"
  | "ENTERPRISE_SAFE_UI"
  | "DEMO_ONBOARDING"
  | "FULL60_PRIVACY_UI"
  | "ADMIN_CONSOLE"
  | "NAV_CLEANUP"
  | "FEEDBACK_VISIBILITY"
  | "DOC_EXPOSURE";

const PROMPT_TITLES: Record<FitPromptKind, string> = {
  MOBILE_SIMPLIFY: "Mobile Simplification Prompt · 移动端简化",
  ENTERPRISE_SAFE_UI: "Enterprise Safe UI Prompt · 企业安全模式",
  DEMO_ONBOARDING: "Demo Visitor Onboarding Prompt · Demo 新用户引导",
  FULL60_PRIVACY_UI: "Full 60 Privacy UI Prompt · 隐私体验",
  ADMIN_CONSOLE: "Admin Console Layout Prompt · 管理员控制台",
  NAV_CLEANUP: "Navigation Cleanup Prompt · 导航整理",
  FEEDBACK_VISIBILITY: "Feedback Entry Visibility Prompt · 回验入口可见",
  DOC_EXPOSURE: "Documentation Exposure Prompt · 文档入口强化",
};

export function generateFitPrompt(
  kind: FitPromptKind,
  result: UIFitResult,
): string {
  const lock = [
    "真实用户主体计算引擎",
    "地区用户体验计算法",
    "回验权重计算法",
    "定数计算法",
    "内测发布计算法",
    "版本迭代计算法",
    "使用手册计算法",
    "软件测试反馈计算法",
    "总重新计算算法",
    "产品文档中心",
    "多计算法内核",
    "Prompt Forge",
    "Demo/Real 隔离",
    "Safety Boundary",
    "Feedback Entry",
  ];

  const header =
`【${PROMPT_TITLES[kind]}】

目标用户端：${result.clientProfileCN}（${result.clientProfile}）
目标设备端：${result.deviceProfileCN}（${result.deviceProfile}）
当前 UI Fit Score：${result.uiFitScore}/100 · ${result.fitLevelCN}
推荐 UI 密度：${result.recommendedDensity}（实际：${result.actualDensity}）

当前问题：
${[
  ...result.exposureRisks.map(r => `- [${r.level}] ${r.cn}：${r.recommendedFix}`),
  ...result.navigationIssues.map(i => `- 导航：${i}`),
  ...result.missingCTAs.map(c => `- 缺失：${c}`),
].slice(0, 12).join("\n") || "- 无显式问题，建议常规复核"}

修复目标：
${result.recommendations.slice(0, 8).map(r => "- " + r).join("\n")}

不要破坏：
${lock.map(l => "- " + l).join("\n")}

验收标准：
- 修复后 UI Fit Score ≥ 70（GOOD_FIT）
- 不引入 HIGH 级 ExposureRisk
- Demo / Real 模式仍清晰区分
- 移动端无密集矩阵与 Full 60 编辑
- 高风险页面仍保留安全边界与回验入口
`;

  const tail: Record<FitPromptKind, string> = {
    MOBILE_SIMPLIFY:
`最终提示词：
请在移动端（Mobile Large / Mobile Small）上对 ${result.clientProfileCN} 优化：
1. 隐藏 Full 60 编辑、高级内核、QA 矩阵、60组表格；
2. 顶部展示今日定数 + 今日行动许可 + 触发日历摘要；
3. 添加底部 Tab：今日 / 日历 / 回验 / 我；
4. 所有矩阵改为分段卡片；保留 SafetyBoundaryBanner 与 DemoRealIsolationBadge。`,

    ENTERPRISE_SAFE_UI:
`最终提示词：
请为企业用户启用 Enterprise Safe Mode：
1. 隐藏：主体数列、Full 60、风域奇点、命运化文案、Prompt Forge、Resonance、Branch Collapse；
2. 替换词：${ENTERPRISE_SAFE_LEXICON.map(x => `${x.from} → ${x.to}`).join("；")}；
3. 显示：Decision Timing / Scenario Trigger / Risk Window / Review Node / Action Permission / Signal Quality / Feedback Loop；
4. 所有页面顶部保留风险边界文案，不出现“保证准确 / 必然发生”。`,

    DEMO_ONBOARDING:
`最终提示词：
请为 Demo Visitor 强化首次进入体验：
1. 顶部 3 入口：今日 · 触发日历 · 使用与安全；
2. 主标题旁强制显示「Demo Persona」徽章；
3. 主 CTA：开始 Demo 体验；次 CTA：升级到 Light 20；
4. 默认隐藏：Full 60、高级内核、QA、重算、版本迭代；
5. 在 Demo 卡片底部加入「这是模拟主体，不代表真实预测」提示。`,

    FULL60_PRIVACY_UI:
`最终提示词：
请优化 Full Subject User 的 Full 60 隐私体验：
1. 进入 /real-subject 前必须二次确认；
2. 默认显示本地隔离声明与隐私状态徽章；
3. 移动端禁用编辑，只显示只读摘要 + 「建议在桌面端编辑」提示；
4. Full 60 提交后立即引导到回验权重 + 回验中心。`,

    ADMIN_CONSOLE:
`最终提示词：
请优化 Admin / Founder 的控制台布局：
1. 顶部快速入口：QA · 重算 · 版本 · 内测 · Prompt Forge · Full 60；
2. 桌面宽屏使用 2-3 列布局，避免空白浪费；
3. 显示当前系统：UI Fit / QA Health / Recalc Status / Version Stage；
4. 保留所有现有模块入口。`,

    NAV_CLEANUP:
`最终提示词：
请按当前角色（${result.clientProfileCN}）折叠侧栏：
1. 仅显示该角色 allowedModules 中的项，其余折叠到「更多」；
2. 默认首页：${getClientProfile(/*hack*/"").defaultHome ? "" : ""}遵循角色 defaultHome；
3. 侧栏项数控制在 ${Math.max(8, Math.ceil(result.factorScores.length))} 内；
4. 不要删除现有路由，只调整可见性。`,

    FEEDBACK_VISIBILITY:
`最终提示词：
请确保 ${result.clientProfileCN} 在 ${result.deviceProfileCN} 上能看到回验入口：
1. 预测详情顶部 + 底部各显示一个 FeedbackEntryCard；
2. 触发日历的日期弹窗内显示 compact 回验；
3. 移动端在底部 Tab 固定「回验」入口；
4. 提交回验后引导到预测有效率页面。`,

    DOC_EXPOSURE:
`最终提示词：
请强化文档入口：
1. 在 Full 60、Prompt Forge、QA、重算等复杂页面顶部加 ContextualManualHint；
2. 侧栏「产品文档」分组始终可达；
3. 复杂矩阵旁加「查看说明」链接跳到对应章节；
4. 不修改文档实际内容，只调整入口与可见性。`,
  };

  return header + "\n" + tail[kind];
}

// ---------- 接入辅助 ----------

/** Software QA 接入：转化为 issue 级别 */
export function uiFitToQAIssues(result: UIFitResult) {
  const issues: Array<{ category: string; severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; message: string }> = [];
  if (result.uiFitScore < 50) {
    issues.push({ category: "UX_HIGH", severity: "HIGH", message: `${result.clientProfileCN} × ${result.deviceProfileCN} UI Fit ${result.uiFitScore} < 50` });
  }
  for (const r of result.exposureRisks) {
    if (r.id === "full60_privacy_overexposure") {
      issues.push({ category: "UX_HIGH", severity: "CRITICAL", message: `移动端 Full 60 暴露：${r.recommendedFix}` });
    } else if (r.id === "mystic_language_exposure") {
      issues.push({ category: "UX_HIGH", severity: "HIGH", message: `企业模式仍出现命运化文案` });
    } else if (r.id === "advanced_overexposure") {
      issues.push({ category: "UX_HIGH", severity: "MEDIUM", message: `${result.clientProfileCN} 可见高级内核 / QA / 重算` });
    } else if (r.id === "feedback_path_hidden") {
      issues.push({ category: "UX_HIGH", severity: "HIGH", message: `${result.deviceProfileCN} 上回验入口不可见` });
    }
  }
  return issues;
}

/** Beta Launch 接入 */
export function uiFitGatesForBeta(matrix: MatrixCell[]) {
  const findScore = (cid: string, did: string) =>
    matrix.find(c => c.clientId === cid && c.deviceId === did)?.score ?? 0;

  return {
    openPublicDemo: findScore("demo_visitor", "laptop_standard") > 75,
    openCreatorAlpha: findScore("creator_user", "laptop_standard") > 70,
    blockEnterpriseUnlessSafeMode: findScore("enterprise_user", "laptop_standard") < 60,
    blockMobileSmall: findScore("mobile_casual", "mobile_small") < 50,
  };
}

/** Version Iteration 接入 */
export function uiFitGatesForVersion(matrix: MatrixCell[]) {
  const core = ["demo_visitor", "light_user", "full_subject_user", "beta_tester"];
  const minCore = Math.min(...core.map(c => matrix.find(m => m.clientId === c && m.deviceId === "laptop_standard")?.score ?? 0));
  const demoLightPaths = [
    matrix.find(m => m.clientId === "demo_visitor" && m.deviceId === "laptop_standard")?.score ?? 0,
    matrix.find(m => m.clientId === "light_user" && m.deviceId === "laptop_standard")?.score ?? 0,
  ];
  return {
    minCoreScore: minCore,
    canGuidedBeta: minCore >= 70,
    boostsV1Readiness: demoLightPaths.every(s => s >= 75),
  };
}
