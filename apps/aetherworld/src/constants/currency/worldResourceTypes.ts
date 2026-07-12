export interface WorldResourceDef {
  id: string;
  name: string;
  description: string;
  relatedDigit: string;
  relatedDomain: string;
  earnedBy: string[];
  usedFor: string[];
}

export const WORLD_RESOURCES: WorldResourceDef[] = [
  { id: "WIND_CRYSTAL",     name: "风晶",       description: "对应变化、行动、触发。",          relatedDigit: "5", relatedDomain: "行动 / 变化",        earnedBy: ["完成行动类任务", "推进剧情节点"],     usedFor: ["触发剧情分支", "加速世界推演"] },
  { id: "ARCHIVE_SHARD",    name: "档案碎片",   description: "对应知识、记录、归档。",          relatedDigit: "0", relatedDomain: "归档 / 清算",        earnedBy: ["新增知识条目", "运行知识审计"],       usedFor: ["标记重要知识", "封存敏感数据"] },
  { id: "STAR_DUST",        name: "星尘",       description: "对应世界生成、灵感、神话感。",    relatedDigit: "7", relatedDomain: "探索 / 神秘",        earnedBy: ["生成世界", "新增宇宙观元素"],         usedFor: ["生成新区域", "解锁神秘剧情"] },
  { id: "RULE_STONE",       name: "规则石",     description: "对应结构、边界、秩序。",          relatedDigit: "4", relatedDomain: "规则 / 审计",        earnedBy: ["运行 QA", "修复审计问题"],            usedFor: ["升级模型", "稳定世界规则"] },
  { id: "LIFE_SEED",        name: "生命种",     description: "对应恢复、承载、生长。",          relatedDigit: "6", relatedDomain: "恢复 / 承载",        earnedBy: ["完成虚拟生活任务", "回验生活节奏"],   usedFor: ["恢复主体能量", "成长支线"] },
  { id: "VOID_TOKEN",       name: "虚空印记",   description: "对应暂停、归零、封存。",          relatedDigit: "0", relatedDomain: "封存 / VOID",        earnedBy: ["主动归档", "切换 VOID 状态"],         usedFor: ["封存资产", "暂停剧情线"] },
  { id: "RELATION_THREAD",  name: "关系线",     description: "对应 NPC、关系、社群。",          relatedDigit: "2", relatedDomain: "关系 / 社群",        earnedBy: ["生成 NPC 关系", "完成社群任务"],      usedFor: ["NPC 关系网", "群像剧情"] },
  { id: "EXPRESSION_INK",   name: "表达墨",     description: "对应剧情、声乐、文本、翻译。",    relatedDigit: "3", relatedDomain: "表达 / 语言",        earnedBy: ["生成剧情", "生成声乐", "完成翻译"],   usedFor: ["剧情扩写", "声乐风格分支"] },
];

export function getWorldResource(id: string): WorldResourceDef | undefined {
  return WORLD_RESOURCES.find((r) => r.id === id);
}
