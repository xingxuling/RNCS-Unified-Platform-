export interface ModelTypeDefinition {
  id: string;
  name: string;
  userFriendlyName: string;
  purpose: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultWeights: string[];
  validationFields: string[];
  exportTargets: string[];
  safetyNotes: string[];
}

export const MODEL_TYPES: ModelTypeDefinition[] = [
  { id: "SUBJECT_MODEL", name: "Subject Model", userFriendlyName: "主体模型", purpose: "描述一个人 / 用户 / 角色的结构画像",
    requiredFields: ["id","displayName","traits","preferences"], optionalFields: ["history","goals"],
    defaultWeights: ["认知风格","行动倾向","风险承受","信任路径"], validationFields: ["traits","preferences"],
    exportTargets: ["JSON","TS_INTERFACE","ZOD","MARKDOWN","PROMPT"], safetyNotes: ["不得作为心理诊断"] },
  { id: "OBJECT_MODEL", name: "Object Model", userFriendlyName: "对象模型", purpose: "描述任意事物本身",
    requiredFields: ["name","essence","boundary","invariants"], optionalFields: ["dynamicVariables","relations"],
    defaultWeights: ["本质清晰度","边界明确性","自洽度"], validationFields: ["essence","boundary"],
    exportTargets: ["JSON","TS_INTERFACE","MARKDOWN"], safetyNotes: ["不输出绝对本质断言"] },
  { id: "PRODUCT_MODEL", name: "Product Model", userFriendlyName: "产品模型", purpose: "描述产品定位、用户、功能、商业路径",
    requiredFields: ["name","targetUsers","coreValue","trustPath","monetizationPath"], optionalFields: ["riskFlags","channels"],
    defaultWeights: ["用户理解度","信任路径","功能完成度","回验能力","商业闭环","安全边界"],
    validationFields: ["coreValue","trustPath","monetizationPath"], exportTargets: ["JSON","TS_INTERFACE","ZOD","MARKDOWN","PROMPT","ENCYCLOPEDIA"],
    safetyNotes: ["不保证商业成功"] },
  { id: "FEATURE_MODEL", name: "Feature Model", userFriendlyName: "功能模型", purpose: "描述一个功能的输入、输出、边界和状态",
    requiredFields: ["name","inputs","outputs","states","boundaries"], optionalFields: ["dependencies"],
    defaultWeights: ["输入完备性","输出清晰度","状态可观察性"], validationFields: ["inputs","outputs","states"],
    exportTargets: ["JSON","TS_INTERFACE","ZOD","CODE"], safetyNotes: [] },
  { id: "WORLD_MODEL", name: "World Model", userFriendlyName: "世界模型", purpose: "描述虚拟世界、区域、规则、NPC、事件",
    requiredFields: ["worldName","zones","rules"], optionalFields: ["npcs","events","timeline"],
    defaultWeights: ["规则一致性","区域可探索性","事件密度"], validationFields: ["rules","zones"],
    exportTargets: ["JSON","UNITY_CS","GODOT_GD","MARKDOWN"], safetyNotes: ["虚拟世界不等于现实"] },
  { id: "NPC_MODEL", name: "NPC Model", userFriendlyName: "NPC 模型", purpose: "描述角色行为、关系、任务倾向",
    requiredFields: ["npcName","traits","likelyActions"], optionalFields: ["relations","backstory"],
    defaultWeights: ["信任","冲突","任务亲和","关系距离","信息透明度","行动主动性"],
    validationFields: ["likelyActions"], exportTargets: ["JSON","UNITY_CS","GODOT_GD"], safetyNotes: [] },
  { id: "EVENT_MODEL", name: "Event Model", userFriendlyName: "事件模型", purpose: "描述触发条件、过程、结果、回验",
    requiredFields: ["name","triggers","process","outcomes","validation"], optionalFields: ["risks"],
    defaultWeights: ["触发明确度","过程可观察性","结果可回验"], validationFields: ["outcomes","validation"],
    exportTargets: ["JSON","TS_INTERFACE","MARKDOWN"], safetyNotes: [] },
  { id: "RELATIONSHIP_MODEL", name: "Relationship Model", userFriendlyName: "关系模型", purpose: "描述两方关系、信任、距离、张力、行动许可",
    requiredFields: ["partyA","partyB","trust","distance","tension","permissions"], optionalFields: [],
    defaultWeights: ["信任","距离","张力","透明度"], validationFields: ["trust","permissions"],
    exportTargets: ["JSON","MARKDOWN"], safetyNotes: ["不替代真实人际判断"] },
  { id: "DECISION_MODEL", name: "Decision Model", userFriendlyName: "决策模型", purpose: "描述问题、变量、风险、行动选项",
    requiredFields: ["problem","variables","options","risks"], optionalFields: ["criteria"],
    defaultWeights: ["问题清晰","变量充分","风险覆盖"], validationFields: ["options","risks"],
    exportTargets: ["JSON","MARKDOWN","PROMPT"], safetyNotes: ["不替代专业决策"] },
  { id: "VOCAL_MODEL", name: "Vocal Model", userFriendlyName: "声线模型", purpose: "描述音域、情绪、唱法、语言适配",
    requiredFields: ["voiceType","range","emotionProfile","languageAdaptation"], optionalFields: ["techniques","risks"],
    defaultWeights: ["音域匹配","情绪密度","语言适配","嗓音风险","角色一致性","平台适配"],
    validationFields: ["range","emotionProfile"], exportTargets: ["JSON","TS_INTERFACE","PROMPT"], safetyNotes: ["不建议硬顶高音"] },
  { id: "RENDER_MODEL", name: "Render Model", userFriendlyName: "渲染模型", purpose: "描述颜色、光照、材质、符号、视觉密度",
    requiredFields: ["palette","lighting","materials","density"], optionalFields: ["symbols"],
    defaultWeights: ["对比度","可读性","风格一致"], validationFields: ["palette","lighting"],
    exportTargets: ["JSON","UNITY_CS","GODOT_GD"], safetyNotes: [] },
  { id: "PHYSICS_MODEL", name: "Semantic Physics Model", userFriendlyName: "语义物理模型", purpose: "描述阻力、动量、吸引、收束、相变",
    requiredFields: ["friction","momentum","attraction","convergence","phaseShift"], optionalFields: [],
    defaultWeights: ["动量","阻力","吸引"], validationFields: ["momentum"], exportTargets: ["JSON","UNITY_CS","GODOT_GD"], safetyNotes: ["语义物理非真实物理"] },
  { id: "ANIMATION_MODEL", name: "Animation Model", userFriendlyName: "动画模型", purpose: "描述动作风格、镜头节奏、转场、姿态",
    requiredFields: ["style","cameraRhythm","transitions","poses"], optionalFields: [],
    defaultWeights: ["节奏","可读性","风格一致"], validationFields: ["style"], exportTargets: ["JSON","UNITY_CS","GODOT_GD"], safetyNotes: [] },
  { id: "BUSINESS_MODEL", name: "Business Model", userFriendlyName: "商业模型", purpose: "描述用户、价值、价格、渠道、成本、收益",
    requiredFields: ["users","value","price","channels","costs","revenue"], optionalFields: ["risks"],
    defaultWeights: ["闭环度","可验证","可扩展"], validationFields: ["revenue","channels"],
    exportTargets: ["JSON","MARKDOWN","PROMPT","ENCYCLOPEDIA"], safetyNotes: ["不保证商业成功"] },
  { id: "PROMPT_MODEL", name: "Prompt Model", userFriendlyName: "提示词模型", purpose: "Prompt 的目标、输入、输出、约束、验收标准",
    requiredFields: ["goal","inputs","outputs","constraints","acceptanceCriteria"], optionalFields: [],
    defaultWeights: ["目标清晰","约束明确","验收可测"], validationFields: ["acceptanceCriteria"],
    exportTargets: ["JSON","MARKDOWN","PROMPT","LOVABLE_PROMPT","CODEX_PROMPT"], safetyNotes: [] },
  { id: "CODE_MODEL", name: "Code Model", userFriendlyName: "代码生成模型", purpose: "描述文件结构、接口、组件、数据层、测试",
    requiredFields: ["fileStructure","interfaces","components"], optionalFields: ["dataLayer","tests"],
    defaultWeights: ["结构清晰","可维护","可测试"], validationFields: ["interfaces"], exportTargets: ["TS_INTERFACE","ZOD","MARKDOWN","CODE"], safetyNotes: [] },
  { id: "TRANSLATION_MODEL", name: "Translation Model", userFriendlyName: "翻译模型", purpose: "源含义、目标语言、术语表、安全边界",
    requiredFields: ["sourceMeaning","targetLanguage","terminology","safetyBoundaries"], optionalFields: [],
    defaultWeights: ["术语一致","语义保真","安全合规"], validationFields: ["terminology"], exportTargets: ["JSON","MARKDOWN"], safetyNotes: [] },
  { id: "QA_MODEL", name: "QA Model", userFriendlyName: "质量保证模型", purpose: "检查项、严重度、修复建议",
    requiredFields: ["checks","severity","repairSuggestions"], optionalFields: [],
    defaultWeights: ["覆盖度","可执行","严重度准确"], validationFields: ["checks"], exportTargets: ["JSON","MARKDOWN"], safetyNotes: [] },
  { id: "RECALCULATION_MODEL", name: "Recalculation Model", userFriendlyName: "重算模型", purpose: "stale 条件、重算范围、依赖",
    requiredFields: ["staleConditions","scope","dependencies"], optionalFields: [],
    defaultWeights: ["敏感度","范围合理"], validationFields: ["staleConditions"], exportTargets: ["JSON","MARKDOWN"], safetyNotes: [] },
  { id: "OMNI_ROUTE_MODEL", name: "Omni Route Model", userFriendlyName: "全域路由模型", purpose: "输入识别、主引擎、辅助引擎、校验引擎",
    requiredFields: ["inputClassifier","primaryEngine","auxiliaryEngines","validationEngine"], optionalFields: [],
    defaultWeights: ["路由准确","回退合理"], validationFields: ["inputClassifier"], exportTargets: ["JSON","MARKDOWN"], safetyNotes: [] },
];

export function getModelType(id: string): ModelTypeDefinition | undefined {
  return MODEL_TYPES.find(m => m.id === id);
}
