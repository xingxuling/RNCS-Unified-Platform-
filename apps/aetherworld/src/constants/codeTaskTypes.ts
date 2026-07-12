// 代码任务类型 Code Task Types
export interface CodeTaskType {
  id: string;
  name: string;
  enName: string;
  description: string;
  primaryTargets: string[]; // CodeTarget ids
  defaultScope: "PATCH" | "MODULE" | "BULK" | "REFACTOR" | "SYSTEM_LAYER";
  typicalDoNotBreak: string[];
}

export const CODE_TASK_TYPES: CodeTaskType[] = [
  { id: "NEW_PAGE", name: "新增页面", enName: "New Page",
    description: "新增一个路由页面。", primaryTargets: ["route", "component"],
    defaultScope: "MODULE", typicalDoNotBreak: ["现有路由", "侧边栏分组"] },
  { id: "NEW_COMPONENT", name: "新增组件", enName: "New Component",
    description: "新增可复用组件。", primaryTargets: ["component"],
    defaultScope: "PATCH", typicalDoNotBreak: ["现有 props 接口"] },
  { id: "NEW_ENGINE", name: "新增计算引擎", enName: "New Engine",
    description: "新增一个计算/分析引擎。", primaryTargets: ["lib"],
    defaultScope: "MODULE", typicalDoNotBreak: ["Constant Universe", "现有计算法"] },
  { id: "NEW_CONSTANTS", name: "新增常数表", enName: "New Constants",
    description: "新增一组常数定义。", primaryTargets: ["constants"],
    defaultScope: "PATCH", typicalDoNotBreak: ["Constant Universe 已有常数"] },
  { id: "DATA_MODEL_EXPANSION", name: "扩展数据结构", enName: "Data Model Expansion",
    description: "扩展现有数据结构。", primaryTargets: ["lib", "storage"],
    defaultScope: "MODULE", typicalDoNotBreak: ["已存数据", "向后兼容"] },
  { id: "UI_REFACTOR", name: "UI重构", enName: "UI Refactor",
    description: "重构 UI 结构。", primaryTargets: ["ui", "component"],
    defaultScope: "REFACTOR", typicalDoNotBreak: ["业务逻辑", "现有功能入口"] },
  { id: "BUG_FIX", name: "修复 Bug", enName: "Bug Fix",
    description: "针对具体 bug 的修复。", primaryTargets: ["component", "lib"],
    defaultScope: "PATCH", typicalDoNotBreak: ["不在 bug 范围的功能"] },
  { id: "QA_FIX", name: "QA 修复", enName: "QA Fix",
    description: "根据 Software QA 报告修复问题。", primaryTargets: ["qa", "component", "lib"],
    defaultScope: "PATCH", typicalDoNotBreak: ["QA 报告外的功能"] },
  { id: "RECALCULATION_SYNC", name: "重算同步", enName: "Recalculation Sync",
    description: "把新模块接入重算中心。", primaryTargets: ["recalculation", "lib"],
    defaultScope: "PATCH", typicalDoNotBreak: ["已有重算条目"] },
  { id: "DOCS_SYNC", name: "文档同步", enName: "Docs Sync",
    description: "同步产品文档。", primaryTargets: ["docs"],
    defaultScope: "PATCH", typicalDoNotBreak: ["现有章节顺序"] },
  { id: "ENCYCLOPEDIA_ENTRY_SYNC", name: "百科同步", enName: "Encyclopedia Sync",
    description: "新增/更新百科条目。", primaryTargets: ["encyclopedia"],
    defaultScope: "PATCH", typicalDoNotBreak: ["已有 entry id"] },
  { id: "FOUNDER_PROTECTED_FEATURE", name: "创始人保护功能", enName: "Founder Protected Feature",
    description: "Founder 权限保护功能。", primaryTargets: ["founder", "route"],
    defaultScope: "MODULE", typicalDoNotBreak: ["权限矩阵"] },
  { id: "PROMPT_FORGE_TEMPLATE", name: "Prompt Forge 模板", enName: "Prompt Forge Template",
    description: "新增 Prompt Forge 模板。", primaryTargets: ["promptForge"],
    defaultScope: "PATCH", typicalDoNotBreak: ["已有模板"] },
  { id: "EVENT_LIBRARY_COMPLETION", name: "事件库补全", enName: "Event Library Completion",
    description: "批量补全事件库。", primaryTargets: ["constants", "lib"],
    defaultScope: "BULK", typicalDoNotBreak: ["已有 eventId"] },
  { id: "WORLD_GENERATION_MODULE", name: "虚拟世界模块", enName: "World Generation Module",
    description: "扩展 Virtual World OS。", primaryTargets: ["lib", "component", "route"],
    defaultScope: "MODULE", typicalDoNotBreak: ["Virtual World 主入口"] },
  { id: "COPY_LAYER_UPDATE", name: "文案层更新", enName: "Copy Layer Update",
    description: "更新产品文案层。", primaryTargets: ["component"],
    defaultScope: "PATCH", typicalDoNotBreak: ["核心 CTA"] },
  { id: "PLATFORM_INTEGRATION", name: "平台传播模块", enName: "Platform Integration",
    description: "接入小红书等平台模块。", primaryTargets: ["lib", "constants"],
    defaultScope: "MODULE", typicalDoNotBreak: ["Constant Universe Platform"] },
  { id: "TESTING_CHECKLIST", name: "测试清单", enName: "Testing Checklist",
    description: "生成测试 / 检查清单。", primaryTargets: ["test", "qa"],
    defaultScope: "PATCH", typicalDoNotBreak: [] },
  { id: "EXPORT_FEATURE", name: "导出功能", enName: "Export Feature",
    description: "新增导出功能。", primaryTargets: ["export", "component"],
    defaultScope: "PATCH", typicalDoNotBreak: ["现有导出格式"] },
  { id: "SAFETY_BOUNDARY_PATCH", name: "安全边界修复", enName: "Safety Boundary Patch",
    description: "补全/修复 Safety Boundary。", primaryTargets: ["safety"],
    defaultScope: "PATCH", typicalDoNotBreak: ["Safety Note 已有文本"] },
];

export function getCodeTaskType(id: string): CodeTaskType | undefined {
  return CODE_TASK_TYPES.find(t => t.id === id);
}
