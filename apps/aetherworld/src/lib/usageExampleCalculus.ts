import { EXAMPLE_USER_TYPES } from "@/constants/exampleUserTypes";
import { EXAMPLE_SCENARIO_TYPES } from "@/constants/exampleScenarioTypes";
import { MODULE_EXAMPLE_GUIDES } from "@/constants/exampleModuleTypes";
import { visibleLevels, type ExampleComplexityLevel } from "@/constants/exampleComplexityLevels";
import { guardExample } from "./exampleSafetyGuard";

export interface UsageExample {
  id: string;
  title: string;
  userType: string;
  scenarioType: string;
  moduleId: string;
  complexityLevel: ExampleComplexityLevel;
  userQuestion: string;
  exampleInput: string;
  exampleOutputSummary: string;
  exampleOutputDetailed?: string;
  nextActions: string[];
  validationPoint: string;
  safetyNote?: string;
  copyablePrompt?: string;
}

export const USAGE_EXAMPLES: UsageExample[] = [
  { id: "ex-001", title: "我不知道该不该行动", userType: "BEGINNER_USER", scenarioType: "SHOULD_I_ACT", moduleId: "reality-solver", complexityLevel: "LEVEL_1_BEGINNER",
    userQuestion: "我有一个机会但不确定推不推进", exampleInput: "我现在有一个机会，但不确定要不要推进。背景是：我有兴趣，但资源还没完全准备好，也担心做错。",
    exampleOutputSummary: "拆出：是否定型 / 缺失变量 / 适合进守转断 / 24h-7d 内验证方式",
    nextActions: ["选一个最小行动", "设置 24 小时验证点"], validationPoint: "执行后是否出现更清晰反馈",
    safetyNote: "不替代专业建议", copyablePrompt: "请用问题拆解器分析：我现在有一个机会……" },
  { id: "ex-002", title: "用户看不懂我的产品", userType: "PRODUCT_BUILDER_USER", scenarioType: "PRODUCT_UNCLEAR", moduleId: "software-qa", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "用户说流程太复杂", exampleInput: "用户反馈：流程太复杂，不知道怎么开始。",
    exampleOutputSummary: "诊断：入门过长 / 术语过多 / 缺 Demo-first / 缺示例 / 是否需新手模式",
    nextActions: ["生成 3 个新手示例", "首页 CTA 改成「先试一个问题」"], validationPoint: "7 天后新用户首步完成率是否提升" },
  { id: "ex-003", title: "生成我今天的虚拟生活", userType: "DEMO_USER", scenarioType: "VIRTUAL_LIFE_DAY", moduleId: "virtual-life", complexityLevel: "LEVEL_1_BEGINNER",
    userQuestion: "今天给我一个虚拟一天", exampleInput: "根据我的当前状态，生成今天在虚拟世界里的一天，并给我一个现实锚点。",
    exampleOutputSummary: "醒来地点 / 主区域 / 任务 / NPC / 现实锚点 / 晚间反思",
    nextActions: ["完成一个现实小任务", "保存日记"], validationPoint: "晚间是否完成现实锚点",
    safetyNote: "虚拟生活不替代真实生活" },
  { id: "ex-004", title: "新产品先算可行性", userType: "PRODUCT_BUILDER_USER", scenarioType: "CREATION_SIMULATION", moduleId: "virtual-creation", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "低成本 MR 设备能不能做", exampleInput: "想做低成本 MR 设备，摄像头+AI芯片+塑料/铝结构，对标苹果与微软 MR 的部分体验。",
    exampleOutputSummary: "工程可行性 / 生物舒适度 / 成本压力 / MVP / 砍功能建议",
    nextActions: ["先做窄版原型"], validationPoint: "原型在 4 周内能否点亮一个核心场景" },
  { id: "ex-005", title: "把想法变成 Lovable 提示词", userType: "CREATOR_USER", scenarioType: "PROJECT_DECISION", moduleId: "prompt-forge", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "把这个新模块变成 Prompt", exampleInput: "我想新增使用示例计算法，让用户更容易上手。",
    exampleOutputSummary: "模块定义 / 文件结构 / 页面 / 数据 / 组件 / 验收标准",
    nextActions: ["复制到 Lovable"], validationPoint: "Prompt 能否一次跑通" },
  { id: "ex-006", title: "小红书帖子没热度", userType: "CREATOR_USER", scenarioType: "CONTENT_SPREAD", moduleId: "copy-generator", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "为什么没热度", exampleInput: "标题：xxx；标签：xxx；@大V；点赞/收藏/评论：x/x/x",
    exampleOutputSummary: "首图停留 / 钩子 / 标签池 / 大V叠加 / 评论钩子 / 平台权重 / 产品露出节奏",
    nextActions: ["改标题", "做 follow-up 帖"], validationPoint: "重发 48 小时数据" },
  { id: "ex-007", title: "保存一个新的计算法", userType: "FOUNDER_USER", scenarioType: "FOUNDER_CONTROL", moduleId: "founder-console", complexityLevel: "LEVEL_5_FOUNDER",
    userQuestion: "我新生成了一个算法", exampleInput: "新算法叫虚拟生活计算法。",
    exampleOutputSummary: "判断：立即开发 / 进百科 / 封存 / 高阶模块 / 安全边界",
    nextActions: ["写入百科", "标记版本"], validationPoint: "Audit Log 是否记录",
    safetyNote: "本地口令并非服务器级安全" },
  { id: "ex-008", title: "从 Demo 切到真实主体", userType: "DEMO_USER", scenarioType: "PROJECT_DECISION", moduleId: "real-subject", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "想输入自己的 60 组数列", exampleInput: "我想升级，但担心隐私。",
    exampleOutputSummary: "Demo / Light 20 / Full 60 区别；Full 60 仅本地；可随时清除；不混用",
    nextActions: ["先 Light 20", "再决定 Full 60"], validationPoint: "7 天后是否需要 Full 60",
    safetyNote: "Full 60 数据敏感，仅本地保存" },
  { id: "ex-009", title: "让系统帮我写文案", userType: "CREATOR_USER", scenarioType: "CONTENT_SPREAD", moduleId: "copy-generator", complexityLevel: "LEVEL_1_BEGINNER",
    userQuestion: "小红书风介绍工具", exampleInput: "帮我用小红书风介绍这个工具，但不要太玄。",
    exampleOutputSummary: "低术语 / 强痛点 / 产品露出 / CTA 四版本",
    nextActions: ["挑一版发布"], validationPoint: "48 小时互动率" },
  { id: "ex-010", title: "扫描产品 Bug", userType: "FOUNDER_USER", scenarioType: "BUG_OR_FEEDBACK", moduleId: "software-qa", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "扫描入口/路由/隔离", exampleInput: "扫描入口缺失、路由缺失、Demo/Real 混乱。",
    exampleOutputSummary: "Critical / High / Medium / Low + 修复建议 + Lovable Prompt",
    nextActions: ["先修 Critical"], validationPoint: "重新扫描分数提升" },
  { id: "ex-011", title: "生成一个个人世界", userType: "DEEP_MODE_USER", scenarioType: "PERSONAL_WORLD", moduleId: "virtual-world", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "给我做个人世界", exampleInput: "基于我的主体模型生成个人世界，包括区域、角色、任务、主线。",
    exampleOutputSummary: "世界名 / 区域 / NPC / 主线 / 初始事件",
    nextActions: ["保存世界种子"], validationPoint: "世界是否可继续生成事件" },
  { id: "ex-012", title: "现实问题转虚拟任务", userType: "SELF_REFLECTION_USER", scenarioType: "VIRTUAL_LIFE_DAY", moduleId: "virtual-life", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "卡在产品入口设计", exampleInput: "现实中卡在产品入口设计，请转成虚拟任务。",
    exampleOutputSummary: "任务名 / NPC 提示 / 现实行动 / 验证点",
    nextActions: ["完成现实任务", "记录回验"], validationPoint: "现实任务是否完成" },
  { id: "ex-013", title: "判断一个关系信号", userType: "RELATIONSHIP_USER", scenarioType: "RELATIONSHIP_SIGNAL", moduleId: "reality-solver", complexityLevel: "LEVEL_1_BEGINNER",
    userQuestion: "对方主动但信号不直接", exampleInput: "对方最近主动找我，但信号不够直接。",
    exampleOutputSummary: "行为信号 / 噪声 / 约束 / 行动许可 / 不脑补",
    nextActions: ["小步沟通"], validationPoint: "对方下一步是否回应",
    safetyNote: "不替代心理咨询" },
  { id: "ex-014", title: "做内测发布", userType: "PRODUCT_BUILDER_USER", scenarioType: "PROJECT_DECISION", moduleId: "software-qa", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "怎么开始内测", exampleInput: "功能很多，给第一批用户试用。",
    exampleOutputSummary: "目标 / 用户类型 / 反馈表 / 风险 / 隔离",
    nextActions: ["邀请 5–20 个高理解用户"], validationPoint: "7 天反馈数 ≥ 10" },
  { id: "ex-015", title: "这个功能现在该不该做", userType: "PRODUCT_BUILDER_USER", scenarioType: "PROJECT_DECISION", moduleId: "universal-breakthrough", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "新模块要不要立刻做", exampleInput: "想加一个新模块，但担心复杂。",
    exampleOutputSummary: "现实价值 / 用户理解度 / 实现成本 / 是否进百科",
    nextActions: ["标记 立即做/封存/未来版本"], validationPoint: "决策后 14 天复盘" },
  { id: "ex-016", title: "打包 Android App", userType: "FOUNDER_USER", scenarioType: "PROJECT_DECISION", moduleId: "code-generator", complexityLevel: "LEVEL_5_FOUNDER",
    userQuestion: "用 Capacitor 打包", exampleInput: "把当前 Lovable Web 用 Capacitor 打包成 Android App。",
    exampleOutputSummary: "安装步骤 / Android 配置 / Gradle 命令 / APK 路径 / 图标启动页",
    nextActions: ["交给 Codex"], validationPoint: "APK 是否启动",
    copyablePrompt: "用 Capacitor 把当前 Web 打包成 Android APK" },
  { id: "ex-017", title: "理解一个预测结果", userType: "STUDENT_USER", scenarioType: "EVENT_FORECAST", moduleId: "encyclopedia", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "守中待转 是什么意思", exampleInput: "系统输出：守中待转。",
    exampleOutputSummary: "现在不重压推进，但也不是放弃；等关键变量出现再转",
    nextActions: ["设验证点"], validationPoint: "变量出现日是否到来" },
  { id: "ex-018", title: "生成角色 / 神明原型", userType: "CREATOR_USER", scenarioType: "CREATIVE_WORLD", moduleId: "virtual-world", complexityLevel: "LEVEL_3_STRUCTURED",
    userQuestion: "做神明原型", exampleInput: "根据风、归档、审判、星海生成神明原型。",
    exampleOutputSummary: "神名 / 权柄 / 象征 / 禁忌 / 与世界关系 / 安全边界",
    nextActions: ["保存世界百科"], validationPoint: "原型是否可被剧情调用" },
  { id: "ex-019", title: "降低理解门槛", userType: "BEGINNER_USER", scenarioType: "PRODUCT_UNCLEAR", moduleId: "usage-examples", complexityLevel: "LEVEL_1_BEGINNER",
    userQuestion: "用户看不懂术语", exampleInput: "99% 用户看不懂，帮我降维。",
    exampleOutputSummary: "万物破解→问题拆解器；虚拟生活→今天的虚拟任务；主体数列→个人模型；回验→事后记录",
    nextActions: ["生成新手词典", "改首页文案"], validationPoint: "新手首步完成率" },
  { id: "ex-020", title: "今天状态归档", userType: "SELF_REFLECTION_USER", scenarioType: "RECOVERY_AND_ENERGY", moduleId: "bio-evolution", complexityLevel: "LEVEL_2_GUIDED",
    userQuestion: "归档今天生成的内容", exampleInput: "今天生成了很多算法，帮我归档并判断明天该做什么。",
    exampleOutputSummary: "今日内容 / 立即做 / 进百科 / 封存 / 明日主任务",
    nextActions: ["保存日记", "降低负载"], validationPoint: "明天首步是否清晰" },
];

export interface ExampleQuery {
  userType?: string;
  scenarioType?: string;
  moduleId?: string;
  beginner?: boolean;
  founder?: boolean;
  search?: string;
}

export function queryExamples(q: ExampleQuery = {}): UsageExample[] {
  const allowed = new Set(visibleLevels({ beginner: !!q.beginner, founder: !!q.founder }));
  return USAGE_EXAMPLES.filter((e) => {
    if (!allowed.has(e.complexityLevel)) return false;
    if (q.userType && e.userType !== q.userType) return false;
    if (q.scenarioType && e.scenarioType !== q.scenarioType) return false;
    if (q.moduleId && e.moduleId !== q.moduleId) return false;
    if (q.search) {
      const s = q.search.toLowerCase();
      if (!`${e.title} ${e.userQuestion} ${e.exampleInput}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });
}

export function getExampleById(id: string) {
  return USAGE_EXAMPLES.find((e) => e.id === id);
}

export function moduleExampleCoverage(): { moduleId: string; count: number }[] {
  const map = new Map<string, number>();
  USAGE_EXAMPLES.forEach((e) => map.set(e.moduleId, (map.get(e.moduleId) ?? 0) + 1));
  return MODULE_EXAMPLE_GUIDES.map((m) => ({ moduleId: m.moduleId, count: map.get(m.moduleId) ?? 0 }));
}

export function computeFitScore(example: UsageExample): number {
  const safe = guardExample(example);
  const base =
    (example.exampleInput.length > 10 ? 1 : 0.6) *
    (example.nextActions.length > 0 ? 1 : 0.5) *
    (example.validationPoint ? 1 : 0.5) *
    (safe.ok ? 1 : 0.4);
  return Math.round(base * 100);
}

export { EXAMPLE_USER_TYPES, EXAMPLE_SCENARIO_TYPES, MODULE_EXAMPLE_GUIDES };
