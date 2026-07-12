// 50 个领域定义 · Prompt Domains
export type UserLanguageLevelKey =
  | "RAW_SYSTEM" | "PROFESSIONAL" | "USER_FRIENDLY"
  | "ACTION_ORIENTED" | "ENTERPRISE_SAFE" | "EDUCATIONAL" | "MICROCOPY";

export interface PromptDomain {
  id: string;
  name: string;        // 中文
  en: string;          // English
  description: string;
  commonGoals: string[];
  requiredVariables: string[];
  commonOutputs: string[];
  riskFactors: string[];
  recommendedTemplateFamilies: Array<
    "FOUNDATION" | "EXPANSION" | "DEBUG_REPAIR" | "UX_USER_FACING" | "STRATEGY" | "VALIDATION_FEEDBACK"
  >;
  userLanguageLevel: UserLanguageLevelKey;
}

const ALL_FAMILIES = ["FOUNDATION","EXPANSION","DEBUG_REPAIR","UX_USER_FACING","STRATEGY","VALIDATION_FEEDBACK"] as const;

function make(
  id: string, name: string, en: string, description: string,
  goals: string[], outputs: string[], risks: string[],
  level: UserLanguageLevelKey = "PROFESSIONAL",
): PromptDomain {
  return {
    id, name, en, description,
    commonGoals: goals,
    requiredVariables: ["productName","goal","constraints","desiredOutput","doNotBreak"],
    commonOutputs: outputs,
    riskFactors: risks,
    recommendedTemplateFamilies: [...ALL_FAMILIES],
    userLanguageLevel: level,
  };
}

export const PROMPT_DOMAINS: PromptDomain[] = [
  make("product_design",   "产品设计",       "Product Design",        "产品概念、结构、功能定义。", ["定义 MVP","结构化模块","裁剪范围"], ["规格文档","模块清单","验收点"], ["范围漂移","过度设计"]),
  make("ux_ui",            "用户体验与界面", "UX/UI",                 "界面、交互、信息架构。",     ["简化主路径","降低术语密度"], ["页面流程","组件清单"], ["认知过载","炫技"], "USER_FRIENDLY"),
  make("software_dev",     "软件开发",       "Software Development",  "架构、模块、接口实现。",     ["新增模块","重构","集成"], ["代码方案","接口定义"], ["回归","技术债"]),
  make("qa_testing",       "软件测试",       "QA Testing",            "测试、回归、回验。",         ["扫描缺失","修复优先级"], ["测试矩阵","修复清单"], ["漏测","误报"]),
  make("prompt_engineering","提示词工程",    "Prompt Engineering",    "提示词结构与策略。",         ["提示词分层","注入变量"], ["提示词模板","示例"], ["范围漂移","幻觉"]),
  make("ai_agent_workflow","AI Agent 工作流","AI Agent Workflow",     "多步 Agent 协作。",          ["编排","责任划分"], ["工作流图","角色定义"], ["失控","死循环"]),
  make("business_strategy","商业战略",       "Business Strategy",     "市场、定位、路径。",         ["定位","路径","资源"], ["战略简报","路线图"], ["主观假设","信息不全"]),
  make("startup_planning", "创业规划",       "Startup Planning",      "0→1 创业结构。",             ["MVP→系统","团队结构"], ["阶段计划","里程碑"], ["现金流","过度承诺"]),
  make("fundraising",      "融资路演",       "Fundraising",           "BP、路演、投资人沟通。",     ["叙事","数据","风险"], ["BP 大纲","Q&A"], ["夸大","合规"]),
  make("market_research",  "市场研究",       "Market Research",       "用户、市场、竞争分析。",     ["规模估算","竞品矩阵"], ["调研报告","矩阵图"], ["数据老旧","样本偏差"]),
  make("branding",         "品牌定位",       "Branding",              "品牌叙事、视觉、语言。",     ["叙事","调性","视觉系统"], ["品牌手册","Tone"], ["跟风","同质化"]),
  make("copywriting",      "文案写作",       "Copywriting",           "短文案、CTA、营销文案。",    ["CTA","落地页文案"], ["文案集","版本对比"], ["夸大","虚假"], "USER_FRIENDLY"),
  make("content_creation", "内容创作",       "Content Creation",      "图文、专栏、长内容。",       ["选题","结构","节奏"], ["大纲","稿件"], ["搬运","低质"]),
  make("music_creation",   "音乐创作",       "Music Creation",        "曲式、歌词、编曲方向。",     ["主题","结构","情绪"], ["曲式","和声方向"], ["版权","跑题"]),
  make("fiction_writing",  "小说创作",       "Fiction Writing",       "人物、情节、节奏。",         ["人物","冲突","节奏"], ["大纲","章节"], ["注水","逻辑漏洞"]),
  make("worldbuilding",    "世界观构建",     "Worldbuilding",         "设定、规则、势力。",         ["规则","派系","历史"], ["世界设定文档"], ["不一致","过载"]),
  make("character_design", "角色设计",       "Character Design",      "角色弧、动机、关系。",       ["动机","关系","弧线"], ["角色卡","关系图"], ["脸谱化","失真"]),
  make("game_design",      "游戏设计",       "Game Design",           "玩法、循环、平衡。",         ["核心循环","乐趣点"], ["机制清单","平衡表"], ["失衡","破玩法"]),
  make("comic_manga",      "漫画企划",       "Comic / Manga Planning","分镜、章节、连载。",         ["分镜节奏","角色辨识度"], ["分镜","章节计划"], ["节奏崩","连载失续"]),
  make("video_animation",  "视频与动画企划", "Video / Animation Planning","脚本、镜头、节奏。",     ["开场","钩子","节奏"], ["脚本","镜头表"], ["节奏拖","信息量过载"]),
  make("education_planning","教育规划",      "Education Planning",    "课程结构与路径。",           ["目标","路径","评估"], ["大纲","学习路径"], ["难度错配"]),
  make("study_application","升学申请",       "Study Application",     "申请材料与策略。",           ["定位","材料","时间表"], ["材料清单","时间线"], ["夸大","遗漏"]),
  make("career_planning",  "职业规划",       "Career Planning",       "职业路径与切换。",           ["定位","技能差距"], ["路径","行动清单"], ["盲目跳槽"], "USER_FRIENDLY"),
  make("personal_productivity","个人效率",   "Personal Productivity", "GTD、节奏、专注。",          ["节奏","清空","聚焦"], ["日 / 周 / 月计划"], ["假忙碌","过载"], "USER_FRIENDLY"),
  make("cognitive_recovery","认知恢复",      "Cognitive Recovery",    "脑力恢复与节律。",           ["睡眠","净化","节律"], ["恢复方案","节律表"], ["医疗化","误指导"], "USER_FRIENDLY"),
  make("neuroplasticity",  "大脑可塑性",     "Neuroplasticity",       "训练与可塑结构。",           ["训练设计","渐进负荷"], ["训练计划"], ["伪科学","过训练"]),
  make("health_routine",   "健康习惯",       "Health Routine",        "日常健康节奏。",             ["睡眠","饮食","活动"], ["节奏表","清单"], ["医疗化"], "USER_FRIENDLY"),
  make("fitness_planning", "运动规划",       "Fitness Planning",      "训练计划与周期。",           ["周期","目标","恢复"], ["训练表"], ["伤病","过训练"]),
  make("relationship_analysis","关系分析",   "Relationship Analysis", "关系结构与节奏。",           ["结构","动机","边界"], ["关系图","行动"], ["操控","越界"], "USER_FRIENDLY"),
  make("social_strategy",  "社交策略",       "Social Strategy",       "社交位势与节奏。",           ["位势","切入点","节奏"], ["策略清单"], ["失真","操控"]),
  make("finance_planning", "财务规划",       "Finance Planning",      "现金、储备、配置。",         ["现金流","储备","配置"], ["规划表"], ["保证收益","越界"], "ENTERPRISE_SAFE"),
  make("legal_admin",      "制度与手续准备", "Legal/Admin Preparation","合规与文书准备。",           ["材料","流程","时间表"], ["材料清单","时间线"], ["越界给法律结论"], "ENTERPRISE_SAFE"),
  make("location_analysis","地理 / 选址分析","Location Analysis",     "区位、动线、客流。",         ["动线","客群","成本"], ["选址矩阵"], ["数据老旧"]),
  make("real_estate_site", "门店选址",       "Real Estate / Store Site Selection","门店级选址。", ["租金","动线","品类"], ["对比表"], ["租约风险"]),
  make("enterprise_decision","企业决策",     "Enterprise Decision",   "企业级判断与节奏。",         ["利弊","风险","路径"], ["决策简报"], ["越权","信息缺"], "ENTERPRISE_SAFE"),
  make("sales_strategy",   "销售策略",       "Sales Strategy",        "销售路径与节奏。",           ["客户分层","节奏"], ["流程图","脚本"], ["过度承诺"]),
  make("marketing_campaign","营销活动",      "Marketing Campaign",    "投放、节奏、内容。",         ["主题","渠道","节奏"], ["排期","素材"], ["合规","数据"]),
  make("operations",       "运营管理",       "Operations",            "日常运营节奏。",             ["流程","SOP","指标"], ["SOP","看板"], ["官僚化"]),
  make("project_management","项目管理",      "Project Management",    "WBS、节奏、里程碑。",        ["WBS","里程碑","风险"], ["甘特","RACI"], ["延期","漏项"]),
  make("research_paper",   "论文与白皮书",   "Research Paper / Whitepaper","研究与白皮书。",        ["问题","方法","结论"], ["大纲","稿件"], ["夸大","引用"]),
  make("data_analysis",    "数据分析",       "Data Analysis",         "口径、清洗、建模。",         ["口径","建模","解读"], ["报告","图表"], ["口径错","误读"]),
  make("dashboard_design", "仪表盘设计",     "Dashboard Design",      "指标、布局、阅读路径。",     ["指标层级","布局"], ["原型","指标表"], ["过载"]),
  make("system_architecture","系统架构",     "System Architecture",   "服务、模块、边界。",         ["边界","可演进性"], ["架构图","ADR"], ["过度抽象"]),
  make("knowledge_management","知识管理",   "Knowledge Management",   "知识沉淀与检索。",           ["分类","检索","沉淀"], ["知识库结构"], ["信息腐烂"]),
  make("personal_os",      "个人操作系统",   "Personal OS",           "个人节奏、模块、回验。",     ["节奏","模块","回验"], ["个人 OS"], ["僵化"], "USER_FRIENDLY"),
  make("prediction_forecast","预测系统",     "Prediction / Forecasting","预测模型与回验。",         ["维度","事件","回验"], ["预测报告"], ["绝对化","越界"]),
  make("ritual_symbol",    "仪式与符号系统", "Ritual / Symbol System","象征、仪式、节律。",         ["象征","节律","边界"], ["仪式手册"], ["迷信化"], "EDUCATIONAL"),
  make("philosophy_method","哲学与方法论",   "Philosophy / Methodology","结构与方法论。",           ["公理","推导","边界"], ["论文式输出"], ["独断"]),
  make("localization",     "本地化",         "Localization",          "地区语言与制度。",           ["语言","制度","支付"], ["地区差异表"], ["失真"]),
  make("documentation",    "产品文档",       "Documentation",         "产品文档结构与维护。",       ["结构","术语","回链"], ["文档树"], ["术语过密","老旧"]),
];

export function findDomain(id: string) {
  return PROMPT_DOMAINS.find((d) => d.id === id);
}
