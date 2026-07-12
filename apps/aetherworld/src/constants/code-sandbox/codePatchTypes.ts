export type CodePatchType =
  | "TEXT_REPLACEMENT"
  | "FILE_REWRITE"
  | "FILE_ADD"
  | "CONFIG_CHANGE"
  | "HANDOFF_PATCH";

export const CODE_PATCH_TYPE_LABELS: Record<CodePatchType, string> = {
  TEXT_REPLACEMENT: "文本替换",
  FILE_REWRITE: "文件重写",
  FILE_ADD: "新增文件",
  CONFIG_CHANGE: "配置修改",
  HANDOFF_PATCH: "外部交接修复包",
};
