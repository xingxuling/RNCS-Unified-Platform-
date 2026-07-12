// Text Registry — central registration of all app text entries (see spec §2)
import type { TextType } from "@/constants/text-dynamic/textTypes";
import type { TextScope } from "@/constants/text-dynamic/textScopes";
import type { TextAudienceMode } from "@/constants/text-dynamic/textAudienceModes";
import type { TextToneProfile } from "@/constants/text-dynamic/textToneProfiles";
import type { TextLocale } from "@/constants/text-dynamic/textLocalizationLocales";
import type { TextUpdatePriority } from "@/constants/text-dynamic/textUpdatePriorities";

export type SubjectModeSensitivity =
  | "NONE" | "DEMO_AWARE" | "REAL_AWARE" | "FULL60_AWARE" | "FOUNDER_AWARE";

export interface TextEntry {
  textId: string;
  key: string;
  textType: TextType;
  scope: TextScope;
  moduleId: string;
  route?: string;
  audienceMode: TextAudienceMode;
  subjectModeSensitivity: SubjectModeSensitivity;
  currentText: string;
  generatedText?: string;
  locale: TextLocale;
  toneProfile: TextToneProfile;
  dependencyIds: string[];
  relatedConstants: string[];
  relatedArticles: string[];
  relatedRoutes: string[];
  stale: boolean;
  staleReason?: string;
  priority: TextUpdatePriority;
  version: string;
  lastUpdatedAt: string;
}

const NOW = "2026-05-24T00:00:00Z";

function t(
  textId: string, key: string, textType: TextType, scope: TextScope,
  moduleId: string, audienceMode: TextAudienceMode, currentText: string,
  opts: Partial<TextEntry> = {},
): TextEntry {
  return {
    textId, key, textType, scope, moduleId, audienceMode, currentText,
    route: opts.route,
    subjectModeSensitivity: opts.subjectModeSensitivity ?? "NONE",
    locale: opts.locale ?? "zh-CN",
    toneProfile: opts.toneProfile
      ?? (audienceMode === "FOUNDER" ? "FOUNDER_GOVERNANCE"
        : audienceMode === "ADVANCED" ? "ADVANCED_STRUCTURED"
        : "PUBLIC_FRIENDLY"),
    dependencyIds: opts.dependencyIds ?? [],
    relatedConstants: opts.relatedConstants ?? [],
    relatedArticles: opts.relatedArticles ?? [],
    relatedRoutes: opts.relatedRoutes ?? (opts.route ? [opts.route] : []),
    stale: opts.stale ?? false,
    staleReason: opts.staleReason,
    priority: opts.priority ?? "MEDIUM",
    version: opts.version ?? "v1.0.0",
    lastUpdatedAt: opts.lastUpdatedAt ?? NOW,
  };
}

// Seed registry. Real apps would auto-scan UI Registry; we register representative entries for each scope.
export const TEXT_REGISTRY: TextEntry[] = [
  // home.hero
  t("home.hero.title.public", "home.hero.title", "HERO_COPY", "home.hero", "home", "PUBLIC",
    "Aetherworld｜数列宇宙首页", { route: "/", priority: "HIGH" }),
  t("home.hero.subtitle.public", "home.hero.subtitle", "HERO_COPY", "home.hero", "home", "PUBLIC",
    "用一组数列，描述你的世界、人物、行动与命运。", { route: "/", priority: "HIGH" }),

  // home.quickstart
  t("home.quickstart.title.public", "home.quickstart.title", "QUICK_START_TEXT", "home.quickstart", "home", "PUBLIC",
    "快速开始", { route: "/", priority: "MEDIUM" }),
  t("home.quickstart.title.advanced", "home.quickstart.title", "QUICK_START_TEXT", "home.quickstart", "home", "ADVANCED",
    "高阶快速入口", { route: "/", priority: "MEDIUM" }),
  t("home.quickstart.title.founder", "home.quickstart.title", "QUICK_START_TEXT", "home.quickstart", "home", "FOUNDER",
    "Founder · 治理快速入口", { route: "/", priority: "MEDIUM" }),

  // sidebar.labels (representative)
  t("sidebar.learn.label.public", "sidebar.learn.label", "BUTTON_LABEL", "sidebar.labels", "learn", "PUBLIC",
    "学习中心", { route: "/learn", priority: "LOW" }),
  t("sidebar.ui-update.label.advanced", "sidebar.ui-update.label", "BUTTON_LABEL", "sidebar.labels", "ui-update-engine", "ADVANCED",
    "UI 界面更新引擎", { route: "/ui-update-engine", priority: "LOW" }),
  t("sidebar.text-dynamic.label.advanced", "sidebar.text-dynamic.label", "BUTTON_LABEL", "sidebar.labels", "text-dynamic-update", "ADVANCED",
    "文本更新", { route: "/text-dynamic-update", priority: "LOW" }),
  t("sidebar.text-dynamic.label.founder", "sidebar.text-dynamic.label", "BUTTON_LABEL", "sidebar.labels", "text-dynamic-update", "FOUNDER",
    "Text Dynamic Update Engine", { route: "/text-dynamic-update", priority: "LOW" }),

  // quickstart.public / advanced / founder
  t("quickstart.public.free-input", "quickstart.free-input.desc", "QUICK_START_TEXT", "quickstart.public", "free-input", "PUBLIC",
    "把心里的问题直接输入，让数列人工智能给出参考。", { route: "/free-input", priority: "HIGH" }),
  t("quickstart.public.sequence-ai", "quickstart.sequence-ai.desc", "QUICK_START_TEXT", "quickstart.public", "sequence-ai", "PUBLIC",
    "用一组数列向 Sequence AI 询问下一步动作建议。", { route: "/sequence-ai", priority: "HIGH",
      subjectModeSensitivity: "DEMO_AWARE" }),
  t("quickstart.public.subject-mode", "quickstart.subject-mode.desc", "QUICK_START_TEXT", "quickstart.public", "subject-mode", "PUBLIC",
    "切换主体模式：Demo 体验、Light20 轻量真实、Full60 完整真实。", { route: "/subject-mode", priority: "CRITICAL",
      subjectModeSensitivity: "REAL_AWARE" }),
  t("quickstart.advanced.msl", "quickstart.msl.desc", "QUICK_START_TEXT", "quickstart.advanced", "msl", "ADVANCED",
    "进入 MSL 控制台，按 BLOCK 解析数列结构。", { route: "/msl-console", priority: "HIGH" }),
  t("quickstart.advanced.terminal", "quickstart.terminal.desc", "QUICK_START_TEXT", "quickstart.advanced", "sequence-terminal", "ADVANCED",
    "在 Sequence Terminal 运行 parse / compile / qa.run 等命令。", { route: "/sequence-terminal", priority: "HIGH" }),
  t("quickstart.founder.constitution", "quickstart.constitution.desc", "QUICK_START_TEXT", "quickstart.founder", "system-constitution", "FOUNDER",
    "查看系统宪法、Founder Locked 条款与违规登记。", { route: "/constitution", priority: "HIGH" }),

  // emptyStates.core
  t("empty.sequence-ai.public", "empty.sequence-ai", "EMPTY_STATE", "emptyStates.core", "sequence-ai", "PUBLIC",
    "还没有提问。试着先选择一个主体模式，再向 Sequence AI 询问下一步动作。", { route: "/sequence-ai", priority: "MEDIUM" }),
  t("empty.free-input.public", "empty.free-input", "EMPTY_STATE", "emptyStates.core", "free-input", "PUBLIC",
    "在上面输入你想问的事情，越具体越好。", { route: "/free-input", priority: "MEDIUM" }),

  // safetyNotes.core
  t("safety.sequence-currency", "safety.sequence-currency", "SAFETY_NOTE", "safetyNotes.core", "sequence-currency", "PUBLIC",
    "数列货币为系统内部积分单位，仅用于回验、贡献与权益记账，不可提现、不可兑换现实货币、不构成投资建议。", {
      route: "/currency", priority: "CRITICAL", toneProfile: "SAFETY_NEUTRAL",
    }),
  t("safety.world-presentation", "safety.world-presentation", "SAFETY_NOTE", "safetyNotes.core", "world-presentation", "PUBLIC",
    "世界引擎输出为虚拟世界的表现层，不等于现实物理渲染，不构成对现实事件的预测。", {
      route: "/world-presentation", priority: "HIGH", toneProfile: "SAFETY_NEUTRAL",
    }),
  t("safety.full60-privacy", "safety.full60-privacy", "SAFETY_NOTE", "safetyNotes.core", "real-subject-setup", "PUBLIC",
    "Full60 完整真实主体数据默认仅在本地保存，未经你授权不会上传或同步。", {
      route: "/real-subject-setup", priority: "CRITICAL", toneProfile: "SAFETY_NEUTRAL",
      subjectModeSensitivity: "FULL60_AWARE",
    }),

  // subjectMode.badges
  t("subjectMode.badge.demo", "subjectMode.badge.demo", "SUBJECT_MODE_NOTE", "subjectMode.badges", "subject-mode", "PUBLIC",
    "当前为 Demo 演示模式，结果不基于你的真实主体数列。", { priority: "HIGH", subjectModeSensitivity: "DEMO_AWARE" }),
  t("subjectMode.badge.light20", "subjectMode.badge.light20", "SUBJECT_MODE_NOTE", "subjectMode.badges", "subject-mode", "PUBLIC",
    "当前为 Light20 轻量真实主体模式。", { priority: "HIGH", subjectModeSensitivity: "REAL_AWARE" }),
  t("subjectMode.badge.full60", "subjectMode.badge.full60", "SUBJECT_MODE_NOTE", "subjectMode.badges", "subject-mode", "PUBLIC",
    "当前为 Full60 完整真实主体模式，默认仅本地保存。", { priority: "HIGH", subjectModeSensitivity: "FULL60_AWARE" }),
  t("subjectMode.badge.founder", "subjectMode.badge.founder", "SUBJECT_MODE_NOTE", "subjectMode.badges", "subject-mode", "FOUNDER",
    "当前为 Founder Subject，可查看高阶 trace 与治理入口。", { priority: "MEDIUM", subjectModeSensitivity: "FOUNDER_AWARE" }),

  // sequenceAi.headers
  t("sequenceAi.header.public", "sequenceAi.header", "PAGE_TITLE", "sequenceAi.headers", "sequence-ai", "PUBLIC",
    "数列人工智能｜Sequence AI", { route: "/sequence-ai", priority: "MEDIUM" }),

  // worldEngine.descriptions
  t("worldEngine.desc.v06", "worldEngine.desc.v06", "MODULE_DESCRIPTION", "worldEngine.descriptions", "sequence-world-v06", "PUBLIC",
    "世界引擎 v0.6：表现层输出，用于把数列结果以可读形式呈现，不等于现实渲染。", {
      route: "/sequence-world-v06", priority: "MEDIUM",
    }),

  // currency.boundaries
  t("currency.boundary.public", "currency.boundary", "MODULE_DESCRIPTION", "currency.boundaries", "sequence-currency", "PUBLIC",
    "数列货币是系统内部记账单位，用于回验与贡献结算；不是现实货币、不可兑换、不构成投资。", {
      route: "/currency", priority: "CRITICAL", toneProfile: "SAFETY_NEUTRAL",
    }),

  // constitution.descriptions
  t("constitution.desc.public", "constitution.desc", "MODULE_DESCRIPTION", "constitution.descriptions", "system-constitution", "PUBLIC",
    "系统宪法是 Aetherworld 内部规则集合，用于约束引擎输出与权限，不具有现实法律效力。", {
      route: "/constitution", priority: "HIGH",
    }),

  // constantUniverse.descriptions
  t("constantUniverse.desc.public", "constantUniverse.desc", "MODULE_DESCRIPTION", "constantUniverse.descriptions", "constant-universe", "PUBLIC",
    "常数宇宙是系统内部用于计算与解释的参数集合，不是现实自然定律。", { route: "/constants-universe", priority: "HIGH" }),

  // learningDocs.summaries
  t("learning.summary.public", "learning.summary", "TUTORIAL_SUMMARY", "learningDocs.summaries", "learn", "PUBLIC",
    "学习中心提供新手教程、模块文档、FAQ 与术语表。", { route: "/learn", priority: "MEDIUM" }),

  // audit.explanations
  t("audit.explanation.public", "audit.explanation", "AUDIT_EXPLANATION", "audit.explanations", "software-qa", "PUBLIC",
    "审计结果用于提示哪些模块、入口或文案需要更新，不代表对现实事件的判断。", {
      route: "/software-qa", priority: "MEDIUM",
    }),

  // export.descriptions
  t("export.description.public", "export.description", "EXPORT_DESCRIPTION", "export.descriptions", "engine-export", "PUBLIC",
    "导出内容仅包含系统内部结构与数列结果，请遵循各引擎的安全边界。", {
      route: "/engine-export", priority: "MEDIUM",
    }),

  // permission.notes
  t("permission.note.public", "permission.note", "PERMISSION_NOTE", "permission.notes", "permissions", "PUBLIC",
    "部分功能仅对高阶用户或 Founder 开放。", { priority: "LOW" }),

  // tooltip.core
  t("tooltip.subject-mode.public", "tooltip.subject-mode", "TOOLTIP", "tooltip.core", "subject-mode", "PUBLIC",
    "主体模式决定结果是否基于你的真实数列。", { priority: "LOW" }),

  // errorMessages.core
  t("error.network.public", "error.network", "ERROR_MESSAGE", "errorMessages.core", "system", "PUBLIC",
    "网络异常，请稍后再试。", { priority: "LOW" }),
  t("success.saved.public", "success.saved", "SUCCESS_MESSAGE", "errorMessages.core", "system", "PUBLIC",
    "已保存。", { priority: "LOW" }),
];

export function listTexts(filter?: Partial<Pick<TextEntry, "audienceMode" | "scope" | "moduleId" | "textType" | "stale">>): TextEntry[] {
  let xs = TEXT_REGISTRY;
  if (filter?.audienceMode) xs = xs.filter((x) => x.audienceMode === filter.audienceMode);
  if (filter?.scope) xs = xs.filter((x) => x.scope === filter.scope);
  if (filter?.moduleId) xs = xs.filter((x) => x.moduleId === filter.moduleId);
  if (filter?.textType) xs = xs.filter((x) => x.textType === filter.textType);
  if (filter?.stale !== undefined) xs = xs.filter((x) => x.stale === filter.stale);
  return xs;
}

export function getText(textId: string): TextEntry | undefined {
  return TEXT_REGISTRY.find((x) => x.textId === textId);
}

export function getRegistrySummary() {
  const total = TEXT_REGISTRY.length;
  const byScope: Record<string, number> = {};
  const byAudience: Record<string, number> = { PUBLIC: 0, ADVANCED: 0, FOUNDER: 0 };
  let staleCount = 0;
  for (const x of TEXT_REGISTRY) {
    byScope[x.scope] = (byScope[x.scope] ?? 0) + 1;
    byAudience[x.audienceMode] += 1;
    if (x.stale) staleCount += 1;
  }
  return { total, byScope, byAudience, staleCount };
}
