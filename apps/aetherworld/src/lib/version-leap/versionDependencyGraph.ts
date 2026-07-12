export interface VersionDependency {
  sourceChange: string;
  affectedSystems: string[];
  requiredUpdates: string[];
  updateStatus: "PENDING" | "DONE" | "FAILED" | "SKIPPED";
}

const GRAPH: VersionDependency[] = [
  {
    sourceChange: "新增 Text Dynamic Update Engine",
    affectedSystems: ["UI Update Engine", "Learning Docs", "Software QA", "Recalculation", "Terminal", "Sidebar", "System Constitution"],
    requiredUpdates: ["更新 Quick Start", "更新 Docs", "运行 Text Audit", "更新 Recalculation stale 规则"],
    updateStatus: "DONE",
  },
  {
    sourceChange: "新增 Version Leap Engine",
    affectedSystems: ["Software QA", "Recalculation", "Terminal", "Sidebar", "Release Pipeline"],
    requiredUpdates: ["新增 Version QA 检查", "新增 version stale 规则", "新增 version.* 终端命令"],
    updateStatus: "PENDING",
  },
  {
    sourceChange: "UI Update Engine 模板补齐",
    affectedSystems: ["Quick Start", "Empty States", "Safety Notes", "Usage Examples"],
    requiredUpdates: ["重新运行 UI Audit", "Recalculate stale"],
    updateStatus: "DONE",
  },
  {
    sourceChange: "Collapsible Sub-Router System",
    affectedSystems: ["Sidebar", "Routes", "Permission Guard"],
    requiredUpdates: ["更新 sidebar 持久化", "更新 route audit"],
    updateStatus: "DONE",
  },
  {
    sourceChange: "Learning & Documentation Engine",
    affectedSystems: ["Docs", "Glossary", "FAQ", "Module Docs", "Sidebar"],
    requiredUpdates: ["生成模块文档", "更新教程路径", "运行 Docs Audit"],
    updateStatus: "DONE",
  },
];

export function listVersionDependencies(): VersionDependency[] {
  return [...GRAPH];
}

export function dependenciesForChange(label: string): VersionDependency[] {
  return GRAPH.filter((d) => d.sourceChange.includes(label));
}

export function pendingDependencies(): VersionDependency[] {
  return GRAPH.filter((d) => d.updateStatus === "PENDING");
}
