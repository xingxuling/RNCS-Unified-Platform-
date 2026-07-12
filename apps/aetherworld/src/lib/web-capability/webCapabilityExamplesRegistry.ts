import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

export interface WebCapabilityExample {
  exampleId: string;
  capabilityId: WebCapabilityId;
  title: string;
  task: string;
  expectedOutputs: string[];
}

export const WEB_CAPABILITY_EXAMPLES: WebCapabilityExample[] = [
  { exampleId: "EX-01", capabilityId: "WEB_CODE_M",     title: "生成 React 组件草案",         task: "为番茄钟生成一个 React 计时器组件草案", expectedOutputs: ["CODE_PLAN_OBJECT", "CODE_DRAFT_OBJECT"] },
  { exampleId: "EX-02", capabilityId: "WEB_CODE_M",     title: "解释 import 错误",             task: "解释 React 组件里 import 报错的可能原因", expectedOutputs: ["REPAIR_SUGGESTION_OBJECT"] },
  { exampleId: "EX-03", capabilityId: "WEB_PRODUCT_M",  title: "把想法拆成 MVP",               task: "把一个学习追踪工具的想法拆成 MVP",       expectedOutputs: ["PRODUCT_REQUIREMENT_OBJECT", "MVP_SCOPE_OBJECT"] },
  { exampleId: "EX-04", capabilityId: "WEB_DESIGN_M",   title: "生成页面布局",                 task: "为产品着陆页生成布局与组件层级",          expectedOutputs: ["UI_LAYOUT_OBJECT", "DESIGN_PROMPT_OBJECT"] },
  { exampleId: "EX-05", capabilityId: "WEB_MUSIC_M",    title: "生成角色歌 prompt",            task: "为蓝天机生成一首角色歌 prompt",           expectedOutputs: ["VOCAL_PROMPT_OBJECT", "LYRIC_OBJECT"] },
  { exampleId: "EX-06", capabilityId: "WEB_STORY_M",    title: "生成剧情片段",                 task: "生成一段以太世界的开场剧情片段",          expectedOutputs: ["SCENE_OBJECT"] },
  { exampleId: "EX-07", capabilityId: "WEB_RESEARCH_M", title: "整理本地知识报告",             task: "基于本地知识整理 WebLLM 与 WebLCM 区别报告", expectedOutputs: ["RESEARCH_REPORT_OBJECT"] },
  { exampleId: "EX-08", capabilityId: "WEB_BIZ_M",      title: "生成 PoC 方案",                task: "为 Aetherworld 起草一个 B 端 PoC 方案",   expectedOutputs: ["POC_PLAN_OBJECT"] },
  { exampleId: "EX-09", capabilityId: "WEB_TEACH_M",    title: "生成学习路径",                 task: "为新用户生成学习 Aetherworld 的路径",     expectedOutputs: ["LEARNING_PATH_OBJECT"] },
  { exampleId: "EX-10", capabilityId: "WEB_OPS_M",      title: "生成版本更新公告",             task: "为 v0.7 生成一份更新公告草案",            expectedOutputs: ["RELEASE_NOTE_OBJECT"] },
  { exampleId: "EX-11", capabilityId: "WEB_STRATEGY_M", title: "判断下一步系统跃迁",           task: "判断 Aetherworld 下一步该补什么",         expectedOutputs: ["NEXT_ACTION_OBJECT", "ROADMAP_OBJECT"] },
  { exampleId: "EX-12", capabilityId: "WEB_GAME_M",     title: "生成任务事件设计",             task: "为 Aetherworld 生成一个开场任务设计",     expectedOutputs: ["QUEST_DESIGN_OBJECT"] },
  { exampleId: "EX-13", capabilityId: "WEB_AGENT_M",    title: "生成 Agent Binding Profile",   task: "为代码助手生成 Agent Binding Profile",    expectedOutputs: ["AGENT_BINDING_PROFILE_OBJECT"] },
];

export function listWebCapabilityExamples() { return WEB_CAPABILITY_EXAMPLES.slice(); }
