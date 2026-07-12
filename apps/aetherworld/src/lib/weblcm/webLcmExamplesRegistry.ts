import type { AetherConcept } from "./webLcmTypes";

export interface WebLcmExample {
  id: string;
  title: string;
  description: string;
  sourceType: AetherConcept["sourceType"];
  sampleText: string;
}

export const WEB_LCM_EXAMPLES: WebLcmExample[] = [
  { id: "ex-intent",     title: "用户输入 → Intent Concept",          description: "把用户输入压缩为意图概念。", sourceType: "USER_INPUT",            sampleText: "我想做一个番茄钟网页，能开始、暂停、重置。" },
  { id: "ex-app-idea",   title: "App idea → App Concept Chain",       description: "把应用想法压缩成概念链。",   sourceType: "USER_INPUT",            sampleText: "做一个团队任务看板，支持拖拽与状态过滤。" },
  { id: "ex-app-proj",   title: "App Project → Concept Graph",         description: "应用对象生成概念图谱。",    sourceType: "APP_PROJECT_OBJECT",    sampleText: "App Project: 番茄钟，包含计时器、任务列表、开始按钮、状态管理。" },
  { id: "ex-error",      title: "Code Run Log → Error Concept Chain", description: "错误日志生成错误概念链。",  sourceType: "CODE_RUN_LOG",          sampleText: "IMPORT_NOT_FOUND: 找不到模块 '@/components/Foo'；文件路径错误。" },
  { id: "ex-patch",      title: "Error Concept → Patch Concept",       description: "错误概念生成补丁概念。",    sourceType: "ERROR_SUMMARY_OBJECT",  sampleText: "缺失文件 Foo.tsx；建议补建文件或修正导入路径。" },
  { id: "ex-world",      title: "World Object → World Concept Graph",  description: "世界对象生成概念图谱。",    sourceType: "WORLD_OBJECT",          sampleText: "风暴文明：流动信仰、风系声乐、漂泊聚落、雷电祭司。" },
  { id: "ex-npc",        title: "NPC → Character Concept",             description: "NPC 抽取为角色概念。",       sourceType: "NPC_OBJECT",            sampleText: "夜雨 · 北境游吟，性格忧郁、擅长低音咏唱，背负家族秘密。" },
  { id: "ex-quest",      title: "Quest Event → Narrative Concept Chain", description: "事件生成叙事概念链。",    sourceType: "QUEST_EVENT_OBJECT",    sampleText: "失落的钟塔：村庄钟声消失，玩家追溯断裂线索，触发祭司冲突。" },
  { id: "ex-song",       title: "Song Object → Vocal Concept Chain",   description: "歌曲对象生成声乐概念链。",  sourceType: "SONG_OBJECT",           sampleText: "角色主题曲：低音男声、风系曲风、悲怆向坚定推进。" },
  { id: "ex-calculus",   title: "Calculus Entry → Calculus Concept",    description: "计算法条目概念化。",         sourceType: "CALCULUS_ENTRY",        sampleText: "Cross-Functional Calculus：对象 × 计算法 × 计算法 → 新输出。" },
  { id: "ex-constant",   title: "Constant Entry → Constant Concept",    description: "常数条目概念化。",           sourceType: "CONSTANT_ENTRY",        sampleText: "母体常数：原始数列恒定，不外泄、不可商业化。" },
  { id: "ex-expand",     title: "Concept Chain → WebLLM Expansion Prompt", description: "概念链生成 WebLLM 展开 Prompt。", sourceType: "SEQUENCE_AI_OUTPUT", sampleText: "意图 → 应用 → 架构 → 文件树 → 代码草案。" },
];

export function getExample(id: string): WebLcmExample | undefined {
  return WEB_LCM_EXAMPLES.find(e => e.id === id);
}
