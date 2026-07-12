// Dashboard Layout Engine
import { UI_MODULE_CATEGORIES } from "@/constants/ui-update/uiModuleCategories";
import { UI_MODULE_REGISTRY, listModulesByCategory, type UIRequiredUserMode } from "./uiModuleRegistry";

export interface DashboardSection {
  sectionId: string;
  title: string;
  description: string;
  modules: { moduleId: string; chineseName: string; route: string }[];
}

export interface DashboardLayout {
  audience: UIRequiredUserMode;
  sections: DashboardSection[];
}

const SECTION_LABELS: Record<string, { title: string; desc: string }> = {
  START:        { title: "当前主体 · 快速开始",     desc: "切换 Demo / Light20 / Full60，并启动随便问、问数列 AI、查看示例" },
  CREATE:       { title: "核心创作动作",             desc: "分析、建模、生成世界、写剧情、写声乐提示词、翻译、导出" },
  WORLD_ENGINE: { title: "世界引擎",                 desc: "世界模拟、生长、社会、文明、表现层" },
  SYSTEM:       { title: "系统层",                   desc: "常数宇宙、系统宪法、世界知识、压缩、数列货币、QA、Recalculation" },
  QUALITY:      { title: "质量与界面",               desc: "QA、Recalculation、Interface Audit" },
  FOUNDER:      { title: "Founder 专属",             desc: "Founder Terminal、Constitution Amendments、Constant Lock、Full Trace" },
};

export function generateDashboardLayout(audience: UIRequiredUserMode): DashboardLayout {
  const visibleCategoryOrder: number[] =
    audience === "PUBLIC" ? [1, 2, 3] :
    audience === "ADVANCED" ? [1, 2, 3, 4, 5] :
    [1, 2, 3, 4, 5, 6];

  const sections: DashboardSection[] = UI_MODULE_CATEGORIES
    .filter((c) => visibleCategoryOrder.includes(c.order))
    .map((c) => {
      const modules = listModulesByCategory(c.id)
        .filter((m) => m.dashboardEligible && (audience === "FOUNDER" || m.requiredUserMode !== "FOUNDER"))
        .filter((m) => audience !== "PUBLIC" || m.requiredUserMode === "PUBLIC")
        .map((m) => ({ moduleId: m.moduleId, chineseName: m.chineseName, route: m.route }));
      const label = SECTION_LABELS[c.id];
      return { sectionId: c.id, title: label.title, description: label.desc, modules };
    });

  return { audience, sections };
}

export function dashboardCoverage(layout: DashboardLayout): number {
  const total = UI_MODULE_REGISTRY.filter((m) => m.dashboardEligible).length;
  const shown = new Set<string>();
  for (const s of layout.sections) for (const m of s.modules) shown.add(m.moduleId);
  return total === 0 ? 100 : Math.round((shown.size / total) * 100);
}
