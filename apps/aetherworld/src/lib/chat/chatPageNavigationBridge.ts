// 页面跳转桥：仅做路由名规范化与白名单。
const ALLOWED_PREFIXES = ["/", "/chat", "/webxxm", "/app", "/world", "/web", "/code", "/sequence", "/system", "/engine", "/docs", "/runs", "/objects", "/projects", "/workspace"];

export function isAllowedRoute(route: string): boolean {
  if (!route.startsWith("/")) return false;
  return ALLOWED_PREFIXES.some((p) => route === p || route.startsWith(p));
}
