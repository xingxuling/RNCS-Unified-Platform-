// 代码任务规划器
import { getCodeTaskType } from "@/constants/codeTaskTypes";

export interface PlannedFile {
  path: string;
  intent: "create" | "edit";
  reason: string;
}

export interface PlanCodeTaskInput {
  taskTypeId: string;
  targetFeature: string;
  requiredFiles: string[];
  scopeMode: string;
}

const SLUG = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "feature";

export function planCodeTask(i: PlanCodeTaskInput): PlannedFile[] {
  const task = getCodeTaskType(i.taskTypeId);
  const slug = SLUG(i.targetFeature);
  const out: PlannedFile[] = [];

  const add = (path: string, intent: PlannedFile["intent"], reason: string) =>
    out.push({ path, intent, reason });

  switch (i.taskTypeId) {
    case "NEW_PAGE":
      add(`src/routes/${slug}.tsx`, "create", "新页面路由文件。");
      add(`src/components/${capitalize(slug)}Panel.tsx`, "create", "新页面主面板组件。");
      add(`src/components/AppSidebar.tsx`, "edit", "在侧边栏新增入口。");
      break;
    case "NEW_COMPONENT":
      add(`src/components/${capitalize(slug)}.tsx`, "create", "新组件文件。");
      break;
    case "NEW_ENGINE":
      add(`src/lib/${slug}Engine.ts`, "create", "新计算引擎实现。");
      add(`src/constants/${slug}Constants.ts`, "create", "引擎配套常数表。");
      break;
    case "NEW_CONSTANTS":
      add(`src/constants/${slug}.ts`, "create", "新常数表。");
      break;
    case "ENCYCLOPEDIA_ENTRY_SYNC":
      add(`src/constants/encyclopediaSeedEntries.ts`, "edit", "新增/更新百科条目。");
      break;
    case "QA_FIX":
      add(`src/routes/software-qa.tsx`, "edit", "新增/更新 QA 检查项。");
      break;
    case "RECALCULATION_SYNC":
      add(`src/routes/recalculation.tsx`, "edit", "把新模块接入重算中心。");
      break;
    case "DOCS_SYNC":
      add(`src/routes/docs.tsx`, "edit", "同步产品文档章节。");
      break;
    case "PROMPT_FORGE_TEMPLATE":
      add(`src/routes/prompt-forge.tsx`, "edit", "新增 Prompt Forge 模板。");
      break;
    case "EVENT_LIBRARY_COMPLETION":
      add(`src/constants/eventLibraryExtension.ts`, "edit", "补全事件库扩展。");
      add(`src/lib/eventBulkFieldFiller.ts`, "edit", "批量字段填充逻辑。");
      break;
    case "WORLD_GENERATION_MODULE":
      add(`src/lib/${slug}Engine.ts`, "create", "新增虚拟世界子模块。");
      add(`src/components/${capitalize(slug)}Panel.tsx`, "create", "对应面板。");
      break;
    case "FOUNDER_PROTECTED_FEATURE":
      add(`src/routes/${slug}.tsx`, "create", "新页面路由（含 FounderGate）。");
      add(`src/components/${capitalize(slug)}Panel.tsx`, "create", "对应面板。");
      add(`src/constants/founderProtectedModules.ts`, "edit", "注册受保护模块。");
      break;
    case "EXPORT_FEATURE":
      add(`src/components/${capitalize(slug)}ExportPanel.tsx`, "create", "导出面板组件。");
      break;
    case "SAFETY_BOUNDARY_PATCH":
      add(`src/constants/${slug}SafetyRules.ts`, "create", "新增/更新安全规则文件。");
      break;
    default:
      add(`src/lib/${slug}.ts`, "create", `${task?.name ?? "任务"} 主实现。`);
  }
  for (const f of i.requiredFiles) {
    if (!out.find(x => x.path === f)) {
      add(f, "edit", "用户指定的必需文件。");
    }
  }
  return out;
}

function capitalize(s: string): string {
  return s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}
