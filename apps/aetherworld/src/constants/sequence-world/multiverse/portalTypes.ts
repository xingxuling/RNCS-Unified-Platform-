export const PORTAL_TYPES = [
  { id: "ONE_WAY_PORTAL", label: "单向门户", digit: 1 },
  { id: "TWO_WAY_PORTAL", label: "双向门户", digit: 2 },
  { id: "DREAM_PORTAL", label: "梦境门户", digit: 7 },
  { id: "ARCHIVE_GATE", label: "归档门", digit: 0 },
  { id: "STORY_GATE", label: "剧情门", digit: 3 },
  { id: "SYSTEM_PORTAL", label: "系统门户", digit: 4 },
  { id: "FOUNDER_GATE", label: "创始人门", digit: 1 },
  { id: "MIRROR_GATE", label: "镜像门", digit: 6 },
  { id: "RESEED_GATE", label: "再种子门", digit: 5 },
  { id: "LOCKED_GATE", label: "锁定门", digit: 0 },
] as const;
export type PortalTypeId = (typeof PORTAL_TYPES)[number]["id"];

export const PORTAL_DIGIT_MAP: Record<number, string> = {
  0: "归档门 / 封存门",
  1: "创始门 / 主权入口",
  2: "关系门 / 社群互访",
  3: "叙事门 / 文本门户",
  4: "规则门 / 权限门",
  5: "风暴门 / 变化门",
  6: "生命门 / 恢复门",
  7: "梦境门 / 隐秘门",
  8: "资源门 / 交易门",
  9: "文明门 / 终局门",
};
