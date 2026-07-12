// 代码验收标准生成器
import type { PlannedFile } from "./codeTaskPlanner";
import { getCodeTaskType } from "@/constants/codeTaskTypes";

export interface AcceptanceInput {
  taskTypeId: string;
  plannedFiles: PlannedFile[];
  extra: string[];
}

export function generateAcceptanceCriteria(i: AcceptanceInput): string[] {
  const task = getCodeTaskType(i.taskTypeId);
  const base = [
    "项目能够通过类型检查。",
    "不破坏现有路由与侧边栏。",
    "保留 Demo/Real 隔离与 Safety Boundary 文案。",
  ];
  const byTask: string[] = [];
  switch (i.taskTypeId) {
    case "NEW_PAGE": byTask.push("新路由可访问，且 head meta 完整。", "侧边栏新增入口可见。"); break;
    case "NEW_ENGINE": byTask.push("引擎函数有完整类型签名。", "至少被一个页面或组件消费。"); break;
    case "FOUNDER_PROTECTED_FEATURE": byTask.push("普通用户不可见。", "高风险操作含二次确认。"); break;
    case "EXPORT_FEATURE": byTask.push("导出文件包含 Safety Boundary 文本。"); break;
    case "ENCYCLOPEDIA_ENTRY_SYNC": byTask.push("条目三层解释完整。", "条目可被搜索命中。"); break;
    case "EVENT_LIBRARY_COMPLETION": byTask.push("不覆盖已有 eventId。", "事件字段完整度提升。"); break;
    case "WORLD_GENERATION_MODULE": byTask.push("生成结果可保存到 worldMemoryEngine。", "包含 NPC 安全说明。"); break;
    case "QA_FIX": byTask.push("QA 列表已新增/更新对应检查。"); break;
    case "RECALCULATION_SYNC": byTask.push("新模块可被重算中心标记 stale。"); break;
  }
  const tcr = task?.typicalDoNotBreak.map(d => `不破坏：${d}`) ?? [];
  return Array.from(new Set([...base, ...byTask, ...tcr, ...i.extra]));
}
