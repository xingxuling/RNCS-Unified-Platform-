import type { UserLearningLevel } from "./userLearningLevels";
import type { TutorialType } from "./tutorialTypes";

export interface TutorialStep {
  stepId: string;
  title: string;
  instruction: string;
  targetRoute?: string;
  exampleInput?: string;
  expectedResult?: string;
  warning?: string;
}

export interface TutorialDefinition {
  tutorialId: string;
  title: string;
  chineseTitle: string;
  type: TutorialType;
  level: UserLearningLevel;
  targetModules: string[];
  estimatedMinutes: number;
  prerequisites: string[];
  steps: TutorialStep[];
  exampleInputs: string[];
  expectedOutputs: string[];
  safetyNotes: string[];
  routeLinks: string[];
  version: string;
  lastUpdatedAt: string;
}

const NOW = "2026-05-24";

export const LESSON_TEMPLATES: TutorialDefinition[] = [
  {
    tutorialId: "quick_start_10min",
    title: "10-Minute Quick Start: from Demo to your first answer",
    chineseTitle: "10 分钟快速开始：从 Demo 到第一次提问",
    type: "QUICK_START",
    level: "BEGINNER",
    targetModules: ["subject-mode", "free-input", "sequence-ai"],
    estimatedMinutes: 10,
    prerequisites: [],
    steps: [
      { stepId: "s1", title: "进入学习中心", instruction: "从侧边栏点击「学习中心」。", targetRoute: "/learn" },
      { stepId: "s2", title: "确认主体模式", instruction: "顶部确认当前是 Demo / Light20 / Full60。", targetRoute: "/subject-mode", warning: "Full60 默认仅本地保存。" },
      { stepId: "s3", title: "试一次随便问", instruction: "进入随便问，输入任何问题。", targetRoute: "/free-answer", exampleInput: "我现在该不该推进这个项目？", expectedResult: "得到一个结构化结论 + 下一步 + 验证点。" },
      { stepId: "s4", title: "查看 Sequence AI", instruction: "进入数列 AI 重新提问。", targetRoute: "/sequence-ai" },
      { stepId: "s5", title: "保存或重算", instruction: "点击保存或运行 Recalculation。", targetRoute: "/recalculation" },
    ],
    exampleInputs: ["我现在该不该推进这个项目？"],
    expectedOutputs: ["结构化结论 + 下一步 + 验证点 + 安全提示"],
    safetyNotes: ["这是结构推演，不替代专业判断。"],
    routeLinks: ["/learn", "/free-answer", "/sequence-ai", "/recalculation"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
  {
    tutorialId: "input_light20_full60",
    title: "How to input Light20 / Full60",
    chineseTitle: "如何输入 Light20 / Full60",
    type: "STEP_BY_STEP",
    level: "BEGINNER",
    targetModules: ["subject-mode", "free-input"],
    estimatedMinutes: 5,
    prerequisites: [],
    steps: [
      { stepId: "s1", title: "打开主体模式", instruction: "进入主体模式页面。", targetRoute: "/subject-mode" },
      { stepId: "s2", title: "选择 Light20 或 Full60", instruction: "Light20 = 简化版；Full60 = 完整真实主体。", warning: "Full60 默认仅本地保存，不上云。" },
      { stepId: "s3", title: "填入数列", instruction: "依据指引填入数字。" },
    ],
    exampleInputs: ["Light20: 1991 06 30 ..."],
    expectedOutputs: ["主体模式状态变为 Light20 / Full60。"],
    safetyNotes: ["Full60 私有，仅本地。"],
    routeLinks: ["/subject-mode"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
  {
    tutorialId: "world_generate_55555",
    title: "Generate a world from 55555",
    chineseTitle: "如何用 55555 生成一个虚拟世界",
    type: "WORKFLOW",
    level: "CREATOR",
    targetModules: ["world-engine", "world-simulation"],
    estimatedMinutes: 15,
    prerequisites: ["quick_start_10min"],
    steps: [
      { stepId: "s1", title: "打开世界引擎", instruction: "进入世界引擎。", targetRoute: "/world-engine" },
      { stepId: "s2", title: "选择 Demo / Full60", instruction: "新手请先用 Demo。" },
      { stepId: "s3", title: "输入数列 55555", instruction: "在主输入框输入 55555。", exampleInput: "55555" },
      { stepId: "s4", title: "Generate World", instruction: "点击 Generate World。" },
      { stepId: "s5", title: "查看世界结构", instruction: "查看区域、NPC、任务、状态。" },
      { stepId: "s6", title: "Run Simulation", instruction: "运行模拟。", targetRoute: "/world-simulation" },
      { stepId: "s7", title: "导出 Godot JSON", instruction: "导出。", warning: "这是虚拟世界，不是现实预测。" },
    ],
    exampleInputs: ["55555"],
    expectedOutputs: ["world snapshot + tick events"],
    safetyNotes: ["虚拟世界 ≠ 现实预测。"],
    routeLinks: ["/world-engine", "/world-simulation"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
  {
    tutorialId: "msl_terminal_usage",
    title: "Using the Sequence Terminal",
    chineseTitle: "如何使用数列终端",
    type: "ADVANCED_GUIDE",
    level: "ADVANCED",
    targetModules: ["sequence-terminal", "msl"],
    estimatedMinutes: 20,
    prerequisites: ["quick_start_10min"],
    steps: [
      { stepId: "s1", title: "打开终端", instruction: "进入数列终端。", targetRoute: "/sequence-terminal" },
      { stepId: "s2", title: "运行 help", instruction: "输入 help 查看命令。", exampleInput: "help" },
      { stepId: "s3", title: "解析数列", instruction: "运行 parse 55555。", exampleInput: "parse 55555" },
      { stepId: "s4", title: "编译到世界", instruction: "运行 compile 55555 --to world。", exampleInput: "compile 55555 --to world" },
    ],
    exampleInputs: ["help", "parse 55555", "compile 55555 --to world"],
    expectedOutputs: ["STRUCTURED 输出"],
    safetyNotes: ["高阶命令需要权限。"],
    routeLinks: ["/sequence-terminal"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
  {
    tutorialId: "founder_governance",
    title: "Founder governance path",
    chineseTitle: "Founder 系统治理路径",
    type: "FOUNDER_MANUAL",
    level: "FOUNDER",
    targetModules: ["system-constitution", "constants-universe", "interface-audit"],
    estimatedMinutes: 30,
    prerequisites: [],
    steps: [
      { stepId: "s1", title: "检查宪法", instruction: "进入系统宪法。", targetRoute: "/system-constitution" },
      { stepId: "s2", title: "检查常数宇宙", instruction: "进入常数宇宙。", targetRoute: "/constants-universe" },
      { stepId: "s3", title: "界面审计", instruction: "运行界面审计。", targetRoute: "/interface-audit" },
      { stepId: "s4", title: "软件 QA", instruction: "运行 Software QA。", targetRoute: "/software-qa" },
      { stepId: "s5", title: "重新计算", instruction: "运行 Recalculation。", targetRoute: "/recalculation" },
    ],
    exampleInputs: [],
    expectedOutputs: ["完整治理报告"],
    safetyNotes: ["Founder 操作受 Founder Locked 保护。"],
    routeLinks: ["/system-constitution", "/constants-universe", "/interface-audit", "/software-qa", "/recalculation"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
  {
    tutorialId: "currency_not_real",
    title: "Why Sequence Currency is NOT real money",
    chineseTitle: "如何理解数列货币不是现实货币",
    type: "SAFETY_GUIDE",
    level: "BEGINNER",
    targetModules: ["sequence-currency"],
    estimatedMinutes: 3,
    prerequisites: [],
    steps: [
      { stepId: "s1", title: "打开数列货币", instruction: "进入页面。", targetRoute: "/sequence-currency" },
      { stepId: "s2", title: "阅读说明", instruction: "数列货币是内部积分、贡献、虚拟资源，不可提现、不可交易、不可投资。", warning: "禁止金融化。" },
    ],
    exampleInputs: [],
    expectedOutputs: [],
    safetyNotes: ["数列货币 ≠ 现实货币。"],
    routeLinks: ["/sequence-currency"],
    version: "0.1",
    lastUpdatedAt: NOW,
  },
];
