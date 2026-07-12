export type TerminalPermissionLevel =
  | "PUBLIC_READ"
  | "USER_LOCAL"
  | "ADVANCED"
  | "FOUNDER"
  | "SYSTEM";

export const TERMINAL_PERMISSION_ORDER: TerminalPermissionLevel[] = [
  "PUBLIC_READ",
  "USER_LOCAL",
  "ADVANCED",
  "FOUNDER",
  "SYSTEM",
];

export interface TerminalPermissionDef {
  id: TerminalPermissionLevel;
  label: string;
  labelEn: string;
  description: string;
}

export const TERMINAL_PERMISSIONS: TerminalPermissionDef[] = [
  { id: "PUBLIC_READ", label: "公开只读",    labelEn: "Public Read",  description: "解释术语 / 查询公开知识 / Demo 示例。" },
  { id: "USER_LOCAL",  label: "本地用户",    labelEn: "User Local",   description: "可读 activeSubjectProfile，但 Full60 导出需要确认。" },
  { id: "ADVANCED",    label: "高阶用户",    labelEn: "Advanced",     description: "可运行 MSL / 生成模型 / 生成世界 / 导出非私有 JSON。" },
  { id: "FOUNDER",     label: "创始人",      labelEn: "Founder",      description: "可写入百科、锁定术语、系统审计、完整导出。" },
  { id: "SYSTEM",      label: "系统",        labelEn: "System",       description: "系统内部权限，用户不可进入。" },
];

export function hasPermission(
  current: TerminalPermissionLevel,
  required: TerminalPermissionLevel,
): boolean {
  return (
    TERMINAL_PERMISSION_ORDER.indexOf(current) >=
    TERMINAL_PERMISSION_ORDER.indexOf(required)
  );
}
