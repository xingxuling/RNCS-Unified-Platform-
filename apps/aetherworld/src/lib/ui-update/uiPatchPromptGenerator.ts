// UI Patch Prompt Generator — Lovable 修复提示词
import type { UIStaleItem } from "./uiStaleDetector";
import { getModule } from "./uiModuleRegistry";

export interface UIPatchPrompt {
  id: string;
  title: string;
  prompt: string;
  affectedFiles: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

function makeId(seed: string) {
  return `patch_${seed.replace(/[^a-z0-9]+/gi, "_")}_${Math.random().toString(36).slice(2, 6)}`;
}

export function generatePatchPrompts(items: UIStaleItem[]): UIPatchPrompt[] {
  return items.map((s) => {
    const mod = getModule(s.moduleId);
    const name = mod?.chineseName ?? s.moduleId;
    switch (s.itemType) {
      case "ROUTE":
        return {
          id: makeId(s.moduleId + "-route"),
          title: `修复路由：${name}`,
          prompt: `请在 src/routes/ 下创建 ${mod?.route ?? "/" + s.moduleId}.tsx，使用 createFileRoute 注册，并加上中文标题、描述、og:title、og:description；不要重写已有业务逻辑。`,
          affectedFiles: [`src/routes${mod?.route ?? "/" + s.moduleId}.tsx`, "src/routeTree.gen.ts"],
          priority: s.severity,
        };
      case "QUICK_START":
        return {
          id: makeId(s.moduleId + "-qs"),
          title: `补充 Quick Start：${name}`,
          prompt: `请在 src/constants/ui-update/quickStartTemplates.ts 中为模块 ${s.moduleId}（${name}）补充对应用户层的 QuickStartTemplate 条目，并设置合理的 priority、exampleInput、expectedOutput；不要删除现有项。`,
          affectedFiles: ["src/constants/ui-update/quickStartTemplates.ts"],
          priority: s.severity,
        };
      case "EMPTY_STATE":
        return {
          id: makeId(s.moduleId + "-empty"),
          title: `补充空状态：${name}`,
          prompt: `请在 src/constants/ui-update/emptyStateTemplates.ts 中为 ${s.moduleId} 增加 EmptyStateDefinition，包含 title、description、primaryAction、exampleInput，必要时补 safetyNote。`,
          affectedFiles: ["src/constants/ui-update/emptyStateTemplates.ts"],
          priority: s.severity,
        };
      case "USAGE_EXAMPLE":
        return {
          id: makeId(s.moduleId + "-ex"),
          title: `补充使用示例：${name}`,
          prompt: `请在 src/lib/ui-update/examplePromptBinder.ts EXAMPLE_BINDINGS 中为 ${s.moduleId} 增加至少 3 个示例输入。`,
          affectedFiles: ["src/lib/ui-update/examplePromptBinder.ts"],
          priority: s.severity,
        };
      case "SAFETY_NOTE":
        return {
          id: makeId(s.moduleId + "-safety"),
          title: `补充 Safety Note：${name}`,
          prompt: `请为模块 ${name} 的页面添加 Safety Note 组件（虚拟世界 / Full60 / 货币 / Founder 边界提示），并在 uiModuleRegistry 中将 hasSafetyNote 置为 true。`,
          affectedFiles: [`src/routes${mod?.route ?? ""}.tsx`, "src/lib/ui-update/uiModuleRegistry.ts"],
          priority: s.severity,
        };
      case "SUBJECT_BADGE":
        return {
          id: makeId(s.moduleId + "-badge"),
          title: `补充 SubjectModeBadge：${name}`,
          prompt: `请在 ${name} 页面顶部加入 SubjectModeBadge，并在 uiModuleRegistry 中将 hasSubjectModeBadge 置为 true。`,
          affectedFiles: [`src/routes${mod?.route ?? ""}.tsx`, "src/lib/ui-update/uiModuleRegistry.ts"],
          priority: s.severity,
        };
      case "SIDEBAR":
      default:
        return {
          id: makeId(s.moduleId + "-side"),
          title: `修复侧边栏：${name}`,
          prompt: `请在 src/components/AppSidebar.tsx 对应分组中加入 ${name}（${s.moduleId}）入口，注意 PUBLIC / ADVANCED / FOUNDER 三档显示规则。`,
          affectedFiles: ["src/components/AppSidebar.tsx"],
          priority: s.severity,
        };
    }
  });
}
