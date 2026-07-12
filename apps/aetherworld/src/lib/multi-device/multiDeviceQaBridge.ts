export interface MultiDeviceQaCheck { id: string; label: string; passed: boolean; note?: string; }

export function runMultiDeviceQa(input: {
  hasMobileBottomNav: boolean;
  hasFixedMobileInput: boolean;
  avoidComplexTables: boolean;
  singlePrimaryActionMobile: boolean;
  advancedCollapsedMobile: boolean;
  hasDesktopSidebar: boolean;
  hasCollapsibleTabletSidebar: boolean;
  inspectorMobileIsSheet: boolean;
  englishAsSubtitleOnly: boolean;
  homeNoComplexDashboard: boolean;
  capabilityStoreSingleColumnMobile: boolean;
  worldAppSystemSimplifiedMobile: boolean;
}): MultiDeviceQaCheck[] {
  return [
    { id: "mobile-bottom-nav", label: "手机端底部导航存在", passed: input.hasMobileBottomNav },
    { id: "mobile-fixed-input", label: "手机端输入框固定", passed: input.hasFixedMobileInput },
    { id: "no-complex-tables", label: "手机端避免复杂表格", passed: input.avoidComplexTables },
    { id: "single-primary-action", label: "手机端每页一个主操作", passed: input.singlePrimaryActionMobile },
    { id: "advanced-collapsed", label: "高阶信息默认折叠", passed: input.advancedCollapsedMobile },
    { id: "desktop-sidebar", label: "桌面端保留侧边导航", passed: input.hasDesktopSidebar },
    { id: "tablet-collapsible", label: "平板端侧栏可折叠", passed: input.hasCollapsibleTabletSidebar },
    { id: "inspector-mobile-sheet", label: "Inspector 手机端为底部弹层/全屏", passed: input.inspectorMobileIsSheet },
    { id: "english-subtitle", label: "英文仅作为小标签", passed: input.englishAsSubtitleOnly },
    { id: "home-no-dashboard", label: "首页无复杂仪表盘", passed: input.homeNoComplexDashboard },
    { id: "capability-single-col", label: "能力商店手机端单列", passed: input.capabilityStoreSingleColumnMobile },
    { id: "subpages-simplified", label: "世界/应用/系统页手机端简化", passed: input.worldAppSystemSimplifiedMobile },
  ];
}
