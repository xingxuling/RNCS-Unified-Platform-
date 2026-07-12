export const CHAT_ROUTE_TYPES = [
  "PAGE", "RUNTIME", "CAPABILITY", "OBJECT", "QA", "INSTALL",
] as const;
export type ChatRouteType = (typeof CHAT_ROUTE_TYPES)[number];
