import type { DigitalRoleTaskType } from "@/constants/digital-roles/digitalRoleTaskTypes";

export interface DigitalRoleExample {
  exampleId: string;
  title: string;
  description: string;
  taskType: DigitalRoleTaskType;
  exampleInput: string;
}

export const DIGITAL_ROLE_EXAMPLES: DigitalRoleExample[] = [
  { exampleId: "ex-1", title: "把一个想法拆成 MVP", description: "数字产品经理主导。", taskType: "IDEA_TO_PRODUCT", exampleInput: "把这个想法做成产品 MVP" },
  { exampleId: "ex-2", title: "设计 Aetherworld 新模块", description: "数字架构师主导。", taskType: "SYSTEM_ARCHITECTURE", exampleInput: "设计一个新的 Calculus 模块架构" },
  { exampleId: "ex-3", title: "生成代码实现计划", description: "数字程序员主导。", taskType: "CODE_IMPLEMENTATION_PLAN", exampleInput: "把这个架构转成代码实现计划" },
  { exampleId: "ex-4", title: "QA 检查一个功能", description: "数字 QA 主导。", taskType: "QA_AND_AUDIT", exampleInput: "QA 检查 Vocabulary 模块" },
  { exampleId: "ex-5", title: "治理审查数列货币边界", description: "数字治理官主导。", taskType: "GOVERNANCE_REVIEW", exampleInput: "治理审查：数列货币是否被金融化" },
  { exampleId: "ex-6", title: "蓝天机角色曲企划", description: "数字策划主导。", taskType: "CREATIVE_PLANNING", exampleInput: "策划蓝天机角色曲" },
  { exampleId: "ex-7", title: "Suno Prompt", description: "数字音乐总监主导。", taskType: "MUSIC_DIRECTION", exampleInput: "生成蓝天机角色曲的 Suno Prompt" },
  { exampleId: "ex-8", title: "扩展世界观", description: "数字世界构筑师主导。", taskType: "WORLD_BUILDING", exampleInput: "扩展 Aetherworld 主世界观" },
  { exampleId: "ex-9", title: "包装一个 Demo", description: "数字增长官主导。", taskType: "GROWTH_AND_SHOWCASE", exampleInput: "包装现有 Demo 作为对外展示" },
  { exampleId: "ex-10", title: "写使用教程", description: "数字文档员主导。", taskType: "DOCS_AND_TUTORIALS", exampleInput: "为 Digital Role Calculus 写使用教程" },
  { exampleId: "ex-11", title: "判断下一步缺层", description: "数字系统战略官主导。", taskType: "VERSION_UPGRADE", exampleInput: "判断 Aetherworld 下一步缺层" },
  { exampleId: "ex-12", title: "完整产品构建链", description: "全数字团队执行。", taskType: "IDEA_TO_PRODUCT", exampleInput: "用数字团队跑一遍完整产品构建链" },
];

export function listDigitalRoleExamples() {
  return DIGITAL_ROLE_EXAMPLES;
}
