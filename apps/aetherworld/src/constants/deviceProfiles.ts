// 设备画像 · Device Profiles
export interface DeviceProfile {
  id: string;
  name: string;
  nameEn: string;
  minWidth: number;
  maxWidth?: number;
  layoutMode: string;
  recommendedDensity: "LOW" | "MEDIUM" | "HIGH" | "EXPERT";
  forbiddenPatterns: string[];
  recommendedComponents: string[];
}

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: "desktop_wide",
    name: "桌面宽屏",
    nameEn: "Desktop Wide",
    minWidth: 1440,
    layoutMode: "3-column dashboard / matrix",
    recommendedDensity: "EXPERT",
    forbiddenPatterns: ["bottom-nav", "single-column-only"],
    recommendedComponents: ["DeviceFitMatrix", "RoleUIAccessMatrix", "RecalculationDependencyGraph", "FullSequenceInput"],
  },
  {
    id: "laptop_standard",
    name: "标准笔记本",
    nameEn: "Laptop Standard",
    minWidth: 1024,
    maxWidth: 1439,
    layoutMode: "2-column with sidebar",
    recommendedDensity: "HIGH",
    forbiddenPatterns: ["bottom-nav"],
    recommendedComponents: ["sidebar", "tabs", "cards"],
  },
  {
    id: "tablet",
    name: "平板",
    nameEn: "Tablet",
    minWidth: 768,
    maxWidth: 1023,
    layoutMode: "collapsible sidebar / segmented cards",
    recommendedDensity: "MEDIUM",
    forbiddenPatterns: ["dense 7+ column matrix", "tiny tap targets"],
    recommendedComponents: ["collapsible-sidebar", "segmented-cards", "touch-buttons"],
  },
  {
    id: "mobile_large",
    name: "大屏手机",
    nameEn: "Mobile Large",
    minWidth: 414,
    maxWidth: 767,
    layoutMode: "single column, bottom nav",
    recommendedDensity: "LOW",
    forbiddenPatterns: ["wide matrix", "multi-column dashboards", "horizontal scroll tables"],
    recommendedComponents: ["bottom-nav", "today-card", "quick-feedback"],
  },
  {
    id: "mobile_small",
    name: "小屏手机",
    nameEn: "Mobile Small",
    minWidth: 0,
    maxWidth: 413,
    layoutMode: "minimal single column",
    recommendedDensity: "LOW",
    forbiddenPatterns: ["any matrix", "Full 60 editor", "60-row table", "complex prompt forge"],
    recommendedComponents: ["today-determination", "today-action", "calendar-summary", "quick-feedback", "safety-banner"],
  },
  {
    id: "presentation",
    name: "展示 / 路演",
    nameEn: "Embedded / Presentation",
    minWidth: 1200,
    layoutMode: "single-focus, large type, no controls",
    recommendedDensity: "LOW",
    forbiddenPatterns: ["edit controls", "input forms", "dev panels"],
    recommendedComponents: ["hero-card", "single-chart", "headline-metric"],
  },
  {
    id: "print_export",
    name: "导出 / 打印",
    nameEn: "Print / Export",
    minWidth: 800,
    layoutMode: "linear report, no interaction",
    recommendedDensity: "MEDIUM",
    forbiddenPatterns: ["buttons", "animations", "interactive controls"],
    recommendedComponents: ["report-sections", "tables", "summary-cards"],
  },
];

export type DeviceProfileId = typeof DEVICE_PROFILES[number]["id"];

export function getDeviceProfile(id: string): DeviceProfile {
  return DEVICE_PROFILES.find(d => d.id === id) ?? DEVICE_PROFILES[1];
}

export function detectDeviceProfileByWidth(width: number): DeviceProfile {
  return (
    DEVICE_PROFILES
      .filter(d => d.id !== "presentation" && d.id !== "print_export")
      .find(d => width >= d.minWidth && (!d.maxWidth || width <= d.maxWidth))
    ?? DEVICE_PROFILES[1]
  );
}
