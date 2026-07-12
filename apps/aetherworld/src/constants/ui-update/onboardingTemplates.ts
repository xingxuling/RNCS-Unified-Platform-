// UI Update Engine — Onboarding Templates
export interface OnboardingStep {
  stepId: string;
  title: string;
  description: string;
  primaryAction: string;
  targetRoute: string;
}

export interface OnboardingFlow {
  flowId: string;
  audience: "PUBLIC" | "ADVANCED" | "FOUNDER";
  chineseName: string;
  steps: OnboardingStep[];
}

export const ONBOARDING_FLOWS: OnboardingFlow[] = [
  {
    flowId: "ob-public", audience: "PUBLIC", chineseName: "普通用户新手流程",
    steps: [
      { stepId: "ob-pub-1", title: "选择模式",        description: "先试 Demo，或输入 Light20 / Full60。",                       primaryAction: "去设置主体",   targetRoute: "/real-subject-setup" },
      { stepId: "ob-pub-2", title: "选择目标",        description: "分析、建模、生成世界、写剧情、生成音乐提示词、翻译、开发。", primaryAction: "去随便问",     targetRoute: "/free-input" },
      { stepId: "ob-pub-3", title: "运行第一个示例",  description: "选择一个示例输入跑通流程。",                                   primaryAction: "查看示例",     targetRoute: "/usage-examples" },
      { stepId: "ob-pub-4", title: "查看结果",        description: "结论、下一步、验证点、可继续操作。",                           primaryAction: "查看输出",     targetRoute: "/free-answer" },
      { stepId: "ob-pub-5", title: "保存 / 导出",     description: "保存结果或重新计算。",                                         primaryAction: "去记录中心",   targetRoute: "/feedback" },
    ],
  },
  {
    flowId: "ob-advanced", audience: "ADVANCED", chineseName: "高阶用户流程",
    steps: [
      { stepId: "ob-adv-1", title: "导入 Full60",            description: "导入深度主体。",                              primaryAction: "导入",   targetRoute: "/real-subject-setup" },
      { stepId: "ob-adv-2", title: "运行 MSL",               description: "用母体数列语言运行程序。",                    primaryAction: "打开 MSL", targetRoute: "/msl-console" },
      { stepId: "ob-adv-3", title: "运行 Sequence Terminal", description: "终端驱动 Aetherworld。",                     primaryAction: "打开终端", targetRoute: "/sequence-terminal" },
      { stepId: "ob-adv-4", title: "生成世界或模型",         description: "运行世界引擎或模型生成。",                    primaryAction: "去世界引擎", targetRoute: "/sequence-world" },
      { stepId: "ob-adv-5", title: "运行 QA / Recalculation", description: "确保系统一致性。",                            primaryAction: "运行 QA", targetRoute: "/software-qa" },
    ],
  },
  {
    flowId: "ob-founder", audience: "FOUNDER", chineseName: "Founder 流程",
    steps: [
      { stepId: "ob-fnd-1", title: "检查 System Constitution", description: "查看核心治理条款。", primaryAction: "查看",     targetRoute: "/system-constitution" },
      { stepId: "ob-fnd-2", title: "检查 Constant Universe",   description: "查看系统常数。",     primaryAction: "查看",     targetRoute: "/constants-universe" },
      { stepId: "ob-fnd-3", title: "运行全系统 QA",            description: "运行 system.audit。", primaryAction: "QA",      targetRoute: "/software-qa" },
      { stepId: "ob-fnd-4", title: "运行 UI Audit",            description: "运行 UI 界面审计。", primaryAction: "UI 审计", targetRoute: "/interface-audit" },
      { stepId: "ob-fnd-5", title: "导出系统报告",             description: "导出完整系统报告。", primaryAction: "导出",     targetRoute: "/founder-console" },
    ],
  },
];
