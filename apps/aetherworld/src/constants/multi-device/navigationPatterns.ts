export const NAVIGATION_PATTERNS = {
  DESKTOP_SIDEBAR: "DESKTOP_SIDEBAR",
  TABLET_COLLAPSIBLE_SIDEBAR: "TABLET_COLLAPSIBLE_SIDEBAR",
  MOBILE_BOTTOM_NAV: "MOBILE_BOTTOM_NAV",
} as const;

export const DESKTOP_NAV_ITEMS = [
  { to: "/chat", label: "对话" },
  { to: "/workspace", label: "工作区" },
  { to: "/projects", label: "项目" },
  { to: "/objects", label: "对象" },
  { to: "/webxxm-store", label: "能力" },
  { to: "/worlds", label: "世界" },
  { to: "/apps", label: "应用" },
  { to: "/system", label: "系统" },
  { to: "/docs", label: "文档" },
] as const;

export const MOBILE_BOTTOM_NAV_ITEMS = [
  { to: "/chat", label: "对话" },
  { to: "/workspace", label: "工作区" },
  { to: "/webxxm-store", label: "能力" },
  { to: "/worlds", label: "世界" },
  { to: "/me", label: "我的" },
] as const;
