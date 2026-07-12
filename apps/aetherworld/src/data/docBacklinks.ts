// 产品文档 · 回链表（Backlinks）
// 章节 ↔ 在产品中的实际承载（路由 / 组件 / 算法文件）
export interface DocBacklink {
  section: string;          // docs 章节 id
  routes: string[];         // 对应的产品页面路由
  modules: string[];        // 对应的核心实现文件
  consumers: string[];      // 下游消费方（哪些模块依赖它）
}

export const DOC_BACKLINKS: DocBacklink[] = [
  {
    section: "overview",
    routes: ["/", "/onboarding"],
    modules: ["src/routes/index.tsx", "src/components/SimplifiedHome.tsx"],
    consumers: ["AppSidebar", "FirstMinuteFlow"],
  },
  {
    section: "manual",
    routes: ["/onboarding", "/calendar", "/prediction/$date"],
    modules: ["src/lib/manualCalculus.ts", "src/components/ContextualManualHint.tsx"],
    consumers: ["Prediction Detail", "Dashboard", "Calendar"],
  },
  {
    section: "isolation",
    routes: ["/subject", "/real-subject"],
    modules: ["src/constants/demoRealIsolationRules.ts", "src/lib/realSubjectStore.ts", "src/components/DemoRealIsolationBadge.tsx"],
    consumers: ["All real-subject readers", "Feedback Center", "Calendar"],
  },
  {
    section: "feedbackEntry",
    routes: ["/feedback", "/feedback-weights", "/prediction/$date"],
    modules: ["src/constants/feedbackEntryRules.ts", "src/components/FeedbackEntryCard.tsx", "src/lib/feedbackWeightEngine.ts"],
    consumers: ["Recalculation Engine", "Accuracy Stats", "Software QA"],
  },
  {
    section: "softwareQA",
    routes: ["/software-qa"],
    modules: ["src/lib/softwareQAFeedbackCalculus.ts", "src/constants/qaTestCategories.ts"],
    consumers: ["Beta Launch", "Version Iteration"],
  },
  {
    section: "accuracy",
    routes: ["/accuracy"],
    modules: ["src/lib/predictionAccuracyCalculator.ts", "src/constants/accuracyMetrics.ts"],
    consumers: ["Feedback Weights", "Recalculation"],
  },
  {
    section: "recalculation",
    routes: ["/recalculation"],
    modules: ["src/lib/globalRecalculationEngine.ts", "src/constants/recalculationTriggers.ts"],
    consumers: ["All calculus modules"],
  },
  {
    section: "uiFit",
    routes: ["/ui-fit"],
    modules: ["src/lib/multiClientUIFitEngine.ts", "src/constants/uiFitFactors.ts"],
    consumers: ["Beta Launch", "Onboarding"],
  },
  {
    section: "dimensionEvent",
    routes: ["/prediction-dimensions", "/event-algorithms"],
    modules: ["src/lib/predictionDimensionEngine.ts", "src/lib/eventAlgorithmEngine.ts"],
    consumers: ["Prediction Detail", "Calendar"],
  },
  {
    section: "languageFit",
    routes: ["/language-fit"],
    modules: ["src/lib/productUserLanguageEngine.ts", "src/constants/userLanguageLevels.ts", "src/constants/languageRewriteRules.ts"],
    consumers: ["All user-facing copy"],
  },
  {
    section: "abstractPromptForge",
    routes: ["/abstract-prompt-forge", "/prompt-forge"],
    modules: ["src/lib/abstractTransferPromptCalculus.ts", "src/lib/promptTemplateCompiler.ts", "src/constants/promptTemplateFamilies.ts"],
    consumers: ["Prompt Forge", "Event Algorithm Prompt Generator"],
  },
  {
    section: "eventLibraryAudit",
    routes: ["/event-library-audit"],
    modules: ["src/lib/eventLibraryAudit.ts", "src/lib/eventDeduplicationEngine.ts", "src/lib/eventGapAnalyzer.ts"],
    consumers: ["Event Algorithms", "Prediction Detail"],
  },
  {
    section: "calculus",
    routes: ["/branch-collapse", "/signal", "/resonance", "/vitality", "/geo"],
    modules: ["src/lib/branchCollapse.ts", "src/lib/signalPurification.ts", "src/lib/resonanceLock.ts", "src/lib/pressureRebound.ts", "src/lib/domainFolding.ts"],
    consumers: ["Determinant Number", "Prediction Detail"],
  },
  {
    section: "determinant",
    routes: ["/prediction/$date"],
    modules: ["src/lib/determinantNumber.ts", "src/constants/determinationStates.ts"],
    consumers: ["Dashboard", "Calendar"],
  },
  {
    section: "constants",
    routes: ["/constants", "/constitution"],
    modules: ["src/constants/numberConstants.ts", "src/lib/constantValueEngine.ts"],
    consumers: ["All calculus"],
  },
  {
    section: "safety",
    routes: ["/usage-safety"],
    modules: ["src/constants/safetyBoundaryRules.ts", "src/components/SafetyBoundaryBanner.tsx"],
    consumers: ["All user-facing surfaces"],
  },
  {
    section: "roadmap",
    routes: ["/beta-launch", "/version-iteration"],
    modules: ["src/lib/betaLaunchCalculus.ts", "src/lib/versionIterationCalculus.ts"],
    consumers: ["Release Gate", "Software QA"],
  },
];
