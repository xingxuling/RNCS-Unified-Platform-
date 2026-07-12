export type FreeIntentId =
  | "ASK" | "ANALYZE" | "SOLVE" | "GENERATE" | "REWRITE"
  | "TRANSLATE" | "EXPLAIN" | "COMPARE" | "SIMULATE" | "EXPORT"
  | "DEBUG" | "PLAN" | "SUMMARIZE" | "CLASSIFY" | "MODEL"
  | "ROUTE" | "SAVE" | "AUDIT";

export interface FreeIntentDef {
  id: FreeIntentId;
  label: string;
  keywords: string[];
  targetEngine: string;
}

export const FREE_INTENTS: FreeIntentDef[] = [
  { id: "ASK",        label: "提问",     keywords: ["怎么办","该不该","要不要","是不是","？","?"], targetEngine: "sequenceAI" },
  { id: "ANALYZE",    label: "分析",     keywords: ["分析","看看","看清","拆解","analyze"],       targetEngine: "thingItselfCalculus" },
  { id: "SOLVE",      label: "破解",     keywords: ["解决","破解","卡","瓶颈","stuck","solve"],   targetEngine: "universalBreakthrough" },
  { id: "GENERATE",   label: "生成",     keywords: ["生成","做一个","帮我做","create","generate"], targetEngine: "modelGeneration" },
  { id: "REWRITE",    label: "改写",     keywords: ["改写","润色","rewrite","重写"],              targetEngine: "copywritingGeneration" },
  { id: "TRANSLATE",  label: "翻译",     keywords: ["翻译","翻成","英文","日文","韩文","法文","繁体","translate"], targetEngine: "translationEngine" },
  { id: "EXPLAIN",    label: "解释",     keywords: ["是什么","解释","定义","explain"],            targetEngine: "productEncyclopedia" },
  { id: "COMPARE",    label: "比较",     keywords: ["比较","对比","vs","compare"],                targetEngine: "thingItselfCalculus" },
  { id: "SIMULATE",   label: "模拟",     keywords: ["模拟","推演","simulate"],                    targetEngine: "virtualLife" },
  { id: "EXPORT",     label: "导出",     keywords: ["导出","json","unity","godot","export"],      targetEngine: "engineExport" },
  { id: "DEBUG",      label: "调试",     keywords: ["bug","报错","调试","debug","错"],            targetEngine: "softwareQA" },
  { id: "PLAN",       label: "计划",     keywords: ["计划","步骤","plan","路线","路径"],          targetEngine: "universalBreakthrough" },
  { id: "SUMMARIZE",  label: "总结",     keywords: ["总结","摘要","summarize"],                   targetEngine: "sequenceAI" },
  { id: "CLASSIFY",   label: "分类",     keywords: ["分类","归类","classify"],                    targetEngine: "modelGeneration" },
  { id: "MODEL",      label: "建模",     keywords: ["模型","schema","结构","字段","model"],       targetEngine: "modelGeneration" },
  { id: "ROUTE",      label: "路由",     keywords: ["该用哪个","哪个模块","route"],               targetEngine: "sequenceAI" },
  { id: "SAVE",       label: "保存",     keywords: ["保存","入库","归档","save"],                 targetEngine: "productEncyclopedia" },
  { id: "AUDIT",      label: "审计",     keywords: ["检查","审计","验收","缺什么","audit"],       targetEngine: "softwareQA" },
];

export const FREE_INPUT_EXAMPLES: string[] = [
  "我现在该怎么办？",
  "帮我看看这个想法。",
  "这个项目该不该继续做？",
  "用户看不懂我的产品怎么办？",
  "解释 55555。",
  "运行 BLOCK 49..60。",
  "把这个想法写成 Lovable 提示词。",
  "帮我生成一个模型。",
  "给蓝天机写一段漫画脚本。",
  "把歌词生成 Suno prompt。",
  "把这段话翻译成日文。",
  "生成今天的虚拟生活。",
  "用我的数列生成一个 NPC。",
  "导出 Godot JSON。",
  "帮我检查系统缺什么。",
  "这个术语普通用户怎么看得懂？",
  "帮我写小红书文案。",
  "帮我打包安卓 App。",
  "帮我把这个功能做成使用示例。",
  "我脑子很乱，但想继续推进。",
];
