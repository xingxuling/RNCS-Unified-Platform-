// WebCodeM 任务分类器 — 把用户原始指令分到 8 类任务

import type { WebCodeMTaskType } from "./webCodeMTypes";

const CODE_KEYWORDS = [
  /做.*(网页|应用|app|页面|工具)/i,
  /(生成|搭建|创建|新建|帮我做).*(应用|代码|页面|工具|网页|网站)/i,
  /(应用|代码|页面|工具|网页|网站).*(生成|搭建|创建|做|实现)/i,
  /(番茄钟|todo|任务管理|笔记|计算器|时钟|prompt).*?(工具|应用|网页|页面)?/i,
  /\bweb ?code ?m\b/i,
  /代码能力/i,
];

export function isWebCodeMRelated(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (/检查.*(代码|项目|应用)|修复.*(代码|应用|项目|bug|错误)|解释.*(错误|报错|error)|patch|codex|cursor.*?包|交接包|handoff|继续.*(完善|迭代).*应用/i.test(t)) return true;
  return CODE_KEYWORDS.some((rx) => rx.test(t));
}

export function classifyWebCodeMTask(raw: string): WebCodeMTaskType {
  const t = raw.trim();
  if (/(codex.*包|cursor.*包|交接包|handoff)/i.test(t)) return "GENERATE_HANDOFF";
  if (/(patch|补丁草案)/i.test(t)) return "GENERATE_PATCH";
  if (/修复.*(代码|应用|项目|bug|错误|问题)/i.test(t)) return "REPAIR_CODE";
  if (/解释.*(错误|报错|error|失败)/i.test(t)) return "EXPLAIN_ERROR";
  if (/检查.*(代码|项目|应用|质量)/i.test(t)) return "CHECK_PROJECT";
  if (/继续.*(完善|迭代|扩展).*应用|完善.*这个.*应用/i.test(t)) return "IMPROVE_APP";
  if (/^(写|生成).*(代码|函数|组件|类)/i.test(t)) return "GENERATE_CODE";
  return "CREATE_APP";
}
