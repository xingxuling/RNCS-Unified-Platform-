export interface MissingLayerExample {
  exampleId: string;
  title: string;
  problem: string;
  recommendation: string;
  recommendationType: string;
}

export const MISSING_LAYER_EXAMPLES: MissingLayerExample[] = [
  { exampleId: "ex-1", title: "声乐引擎缺跨域接入", problem: "Vocal Engine 独立运行，未与角色/世界对接", recommendation: "新增 Cross-Functional Bridge：character → vocal", recommendationType: "BRIDGE_EXISTING_MODULES" },
  { exampleId: "ex-2", title: "剧情输出不能复用", problem: "Narrative 输出仅为文本，无法跨域调用", recommendation: "对象化为 STORY_OBJECT", recommendationType: "OBJECTIZE_OUTPUT" },
  { exampleId: "ex-3", title: "普通用户看不懂", problem: "页面多但缺新手引导", recommendation: "补 Docs + Demo Showcase", recommendationType: "ADD_DOCS" },
  { exampleId: "ex-4", title: "模型不能直接生成代码", problem: "Model Generation 与 Code Generation 缺桥", recommendation: "新增 Model → Code Bridge", recommendationType: "BRIDGE_EXISTING_MODULES" },
  { exampleId: "ex-5", title: "世界不能保存", problem: "World Engine 输出未进入 Workspace", recommendation: "新增 WORLD_OBJECT 持久化", recommendationType: "OBJECTIZE_OUTPUT" },
  { exampleId: "ex-6", title: "对象无生命周期", problem: "Object Layer 未接 CLM", recommendation: "接入 CLM Review", recommendationType: "ARCHIVE_OR_CLM_REVIEW" },
  { exampleId: "ex-7", title: "引擎多但无统一执行链", problem: "多引擎缺统一调度", recommendation: "接入 Runtime Spine", recommendationType: "INTEGRATE_RUNTIME" },
  { exampleId: "ex-8", title: "数列货币缺安全边界", problem: "缺乏 Constitution 限制", recommendation: "补 System Constitution + QA", recommendationType: "ADD_GOVERNANCE" },
  { exampleId: "ex-9", title: "词汇百科教程未更新", problem: "Text Dynamic 未触发", recommendation: "补 Docs + Text Dynamic", recommendationType: "ADD_DOCS" },
  { exampleId: "ex-10", title: "产品原型缺展示路径", problem: "缺 Commercial Showcase", recommendation: "补 Demo Showcase 与 Pitch", recommendationType: "ADD_DEMO_SHOWCASE" },
  { exampleId: "ex-11", title: "系统过度扩张", problem: "功能与页面增长过快", recommendation: "暂停新增并整合", recommendationType: "PAUSE_AND_INTEGRATE" },
  { exampleId: "ex-12", title: "系统功能重复", problem: "多个模块解决同一问题", recommendation: "合并 / 桥接 / 归档", recommendationType: "PAUSE_AND_INTEGRATE" },
];

export function listMissingLayerExamples() {
  return MISSING_LAYER_EXAMPLES;
}
