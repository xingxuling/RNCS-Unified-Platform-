import type { DigitalRoleTaskType } from "@/constants/digital-roles/digitalRoleTaskTypes";

const PATTERNS: { type: DigitalRoleTaskType; keywords: RegExp }[] = [
  { type: "IDEA_TO_PRODUCT", keywords: /(做成产品|产品化|MVP|product)/i },
  { type: "SYSTEM_ARCHITECTURE", keywords: /(架构|系统设计|architecture)/i },
  { type: "IDEA_TO_SYSTEM", keywords: /(做成系统|搭系统|系统化)/i },
  { type: "CODE_IMPLEMENTATION_PLAN", keywords: /(代码|实现|implement|coding)/i },
  { type: "WORLD_BUILDING", keywords: /(世界观|世界构建|world)/i },
  { type: "NARRATIVE_DESIGN", keywords: /(剧情|故事|叙事|narrative)/i },
  { type: "MUSIC_DIRECTION", keywords: /(歌曲|声乐|音乐|suno|udio|music)/i },
  { type: "RESEARCH_AND_EVIDENCE", keywords: /(查资料|研究|证据|research)/i },
  { type: "QA_AND_AUDIT", keywords: /(QA|质量|审计|audit)/i },
  { type: "DOCS_AND_TUTORIALS", keywords: /(教程|文档|tutorial|docs)/i },
  { type: "GROWTH_AND_SHOWCASE", keywords: /(包装|宣传|demo|增长|growth)/i },
  { type: "GOVERNANCE_REVIEW", keywords: /(治理|宪法|governance)/i },
  { type: "VERSION_UPGRADE", keywords: /(跃迁|版本|升级|version)/i },
  { type: "CLM_REVIEW", keywords: /(生命周期|CLM)/i },
  { type: "CROSS_FUNCTIONAL_WORKFLOW", keywords: /(跨功能|跨域|cross[- ]?function)/i },
  { type: "OBJECT_COMPILATION", keywords: /(对象|object)/i },
  { type: "CREATIVE_PLANNING", keywords: /(策划|企划|planning)/i },
  { type: "PRODUCT_REQUIREMENTS", keywords: /(需求|requirement)/i },
];

export function resolveDigitalRoleTaskType(input: string): DigitalRoleTaskType {
  for (const p of PATTERNS) {
    if (p.keywords.test(input)) return p.type;
  }
  return "IDEA_TO_PRODUCT";
}

export function explainTaskResolution(input: string): { taskType: DigitalRoleTaskType; matched: string } {
  for (const p of PATTERNS) {
    if (p.keywords.test(input)) return { taskType: p.type, matched: p.keywords.source };
  }
  return { taskType: "IDEA_TO_PRODUCT", matched: "default" };
}
