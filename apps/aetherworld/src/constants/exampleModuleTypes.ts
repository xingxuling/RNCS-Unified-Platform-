export interface ModuleExampleGuide {
  moduleId: string;
  moduleName: string;
  route: string;
  oneLineUse: string;
  whenToUse: string[];
  whenNotToUse: string[];
  exampleInputs: string[];
  exampleOutputs: string[];
  nextActions: string[];
  beginnerExplanation: string;
  advancedExplanation: string;
}

export const MODULE_EXAMPLE_GUIDES: ModuleExampleGuide[] = [
  { moduleId: "reality-solver", moduleName: "万物破解 / 问题拆解器", route: "/reality-solver", oneLineUse: "把一个模糊问题拆成可执行的下一步", whenToUse: ["有机会但犹豫", "信号难判断", "需要行动许可"], whenNotToUse: ["需要医疗/法律/金融决断"], exampleInputs: ["我现在有一个机会但不确定要不要推进"], exampleOutputs: ["定型度、缺失变量、行动许可"], nextActions: ["执行最小验证"], beginnerExplanation: "你描述问题，它告诉你下一步做什么。", advancedExplanation: "调用五域映射 + 阻力矩阵 + 验证路径生成。" },
  { moduleId: "virtual-life", moduleName: "虚拟生活", route: "/virtual-life", oneLineUse: "生成今天的虚拟生活与现实锚点", whenToUse: ["想用虚拟方式过一天", "需要现实小任务"], whenNotToUse: ["把虚拟世界当成现实替代品"], exampleInputs: ["根据我现在状态生成今天虚拟一天"], exampleOutputs: ["地点、任务、NPC、锚点"], nextActions: ["执行现实锚点任务"], beginnerExplanation: "给你今天一个有故事感的安排。", advancedExplanation: "Virtual Life Calculus 调用世界种子 × 角色 × 节奏 × NPC。" },
  { moduleId: "virtual-world", moduleName: "虚拟世界 OS", route: "/virtual-world", oneLineUse: "生成你的个人世界", whenToUse: ["创作世界观"], whenNotToUse: ["需要现实数据"], exampleInputs: ["生成我的个人世界"], exampleOutputs: ["区域、NPC、主线"], nextActions: ["保存世界种子"], beginnerExplanation: "你的虚拟世界从这里开始。", advancedExplanation: "World Generator + Memory + Causality Chain。" },
  { moduleId: "virtual-creation", moduleName: "虚拟创造物计算法", route: "/virtual-creation", oneLineUse: "评估一个创造物的可行性", whenToUse: ["想做产品/设备"], whenNotToUse: ["医疗器械直接落地决策"], exampleInputs: ["低成本 MR 设备"], exampleOutputs: ["可行性雷达、风险、MVP 路径"], nextActions: ["做窄版原型"], beginnerExplanation: "看看你的点子能不能做。", advancedExplanation: "10 域加权 + 风险扣减。" },
  { moduleId: "encyclopedia", moduleName: "产品百科", route: "/encyclopedia", oneLineUse: "查模块定义", whenToUse: ["术语不懂"], whenNotToUse: [], exampleInputs: ["什么是回验"], exampleOutputs: ["条目"], nextActions: ["跳转模块"], beginnerExplanation: "全部模块的说明书。", advancedExplanation: "Encyclopedia Engine + Glossary。" },
  { moduleId: "prompt-forge", moduleName: "Prompt Forge", route: "/prompt-forge", oneLineUse: "把想法变成可用 Prompt", whenToUse: ["要发给 AI 执行"], whenNotToUse: [], exampleInputs: ["新增使用示例计算法"], exampleOutputs: ["Lovable / Codex Prompt"], nextActions: ["复制到工具"], beginnerExplanation: "帮你写 AI 指令。", advancedExplanation: "Prompt Calculus + Variable Injector。" },
  { moduleId: "code-generator", moduleName: "代码生成", route: "/code-generator", oneLineUse: "生成代码任务清单", whenToUse: ["要落地实现"], whenNotToUse: ["未启用 Founder Mode"], exampleInputs: ["打包 Android App"], exampleOutputs: ["文件、依赖、验收"], nextActions: ["执行"], beginnerExplanation: "（仅创始人）", advancedExplanation: "Founder-only Code Calculus。" },
  { moduleId: "copy-generator", moduleName: "文案生成", route: "/copy-generator", oneLineUse: "多版本文案", whenToUse: ["发布内容"], whenNotToUse: ["医疗/金融建议"], exampleInputs: ["小红书风格介绍这个工具"], exampleOutputs: ["3 版本"], nextActions: ["发布"], beginnerExplanation: "帮你写文案。", advancedExplanation: "Copy Calculus + Safety Guard。" },
  { moduleId: "bio-evolution", moduleName: "Bio Evolution", route: "/bio-evolution", oneLineUse: "App 自进化", whenToUse: ["想让 App 学习你"], whenNotToUse: [], exampleInputs: ["根据偏好进化"], exampleOutputs: ["进化建议"], nextActions: ["接受/回滚"], beginnerExplanation: "App 会越用越懂你。", advancedExplanation: "Mutation Planner + Rollback。" },
  { moduleId: "software-qa", moduleName: "Software QA", route: "/software-qa", oneLineUse: "扫描产品问题", whenToUse: ["发布前", "用户反馈"], whenNotToUse: [], exampleInputs: ["扫描入口缺失"], exampleOutputs: ["问题清单"], nextActions: ["修 Critical"], beginnerExplanation: "产品体检。", advancedExplanation: "QA Health Score。" },
  { moduleId: "recalculation", moduleName: "Recalculation", route: "/recalculation", oneLineUse: "重算因更新而失效的内容", whenToUse: ["模块更新后"], whenNotToUse: [], exampleInputs: ["重算示例"], exampleOutputs: ["stale 列表"], nextActions: ["执行重算"], beginnerExplanation: "更新过的就重新算。", advancedExplanation: "Global Recalculation Engine。" },
  { moduleId: "founder-console", moduleName: "创始人控制台", route: "/founder-console", oneLineUse: "管理高级权限", whenToUse: ["创始人"], whenNotToUse: ["普通用户"], exampleInputs: ["保存新计算法"], exampleOutputs: ["权限/审计"], nextActions: ["写入 Audit"], beginnerExplanation: "仅限创始人。", advancedExplanation: "Founder Gate + Audit。" },
  { moduleId: "constants-universe", moduleName: "常数宇宙", route: "/constants-universe", oneLineUse: "看 / 调常数", whenToUse: ["高阶"], whenNotToUse: [], exampleInputs: ["查看常数"], exampleOutputs: ["常数列表"], nextActions: ["调整"], beginnerExplanation: "数学常数库。", advancedExplanation: "Constant Universe Engine。" },
  { moduleId: "event-algorithms", moduleName: "事件宇宙", route: "/event-algorithms", oneLineUse: "事件类型与算法", whenToUse: ["高阶"], whenNotToUse: [], exampleInputs: ["查事件"], exampleOutputs: ["事件库"], nextActions: ["选择匹配"], beginnerExplanation: "事件目录。", advancedExplanation: "Event Algorithm Engine。" },
  { moduleId: "real-subject", moduleName: "真实主体", route: "/real-subject", oneLineUse: "升级到 Full 60", whenToUse: ["愿意输入完整数据"], whenNotToUse: ["不信任本地保存"], exampleInputs: ["从 Demo 切真实"], exampleOutputs: ["主体模式"], nextActions: ["选择 Light/Full"], beginnerExplanation: "你的私人模型。", advancedExplanation: "Real Subject Store + Privacy。" },
  { moduleId: "regional-ux", moduleName: "地区体验", route: "/regional-ux", oneLineUse: "语言/地区适配", whenToUse: ["跨地区发布"], whenNotToUse: [], exampleInputs: ["看地区差异"], exampleOutputs: ["适配表"], nextActions: ["发布"], beginnerExplanation: "你在哪用都顺。", advancedExplanation: "Regional User Calculus。" },
  { moduleId: "usage-examples", moduleName: "使用示例计算法", route: "/usage-examples", oneLineUse: "教你怎么用", whenToUse: ["第一次", "不会用"], whenNotToUse: [], exampleInputs: ["我是新手"], exampleOutputs: ["匹配示例"], nextActions: ["跳转模块"], beginnerExplanation: "不会用就看这里。", advancedExplanation: "Usage Example Calculus Engine。" },
];

export function getModuleGuide(moduleId: string) {
  return MODULE_EXAMPLE_GUIDES.find((m) => m.moduleId === moduleId);
}
