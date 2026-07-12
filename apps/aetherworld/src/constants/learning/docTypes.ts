export type DocType =
  | "USER_GUIDE"
  | "MODULE_DOC"
  | "SYSTEM_DOC"
  | "API_DOC"
  | "ARCHITECTURE_DOC"
  | "GLOSSARY"
  | "FAQ"
  | "RELEASE_NOTE"
  | "MIGRATION_GUIDE"
  | "INTERNAL_SPEC";

export const DOC_TYPES: { id: DocType; label: string; chineseLabel: string }[] = [
  { id: "USER_GUIDE", label: "User Guide", chineseLabel: "用户手册" },
  { id: "MODULE_DOC", label: "Module Doc", chineseLabel: "模块文档" },
  { id: "SYSTEM_DOC", label: "System Doc", chineseLabel: "系统文档" },
  { id: "API_DOC", label: "API / JSON Doc", chineseLabel: "API / JSON 文档" },
  { id: "ARCHITECTURE_DOC", label: "Architecture Doc", chineseLabel: "架构文档" },
  { id: "GLOSSARY", label: "Glossary", chineseLabel: "术语表" },
  { id: "FAQ", label: "FAQ", chineseLabel: "常见问题" },
  { id: "RELEASE_NOTE", label: "Release Note", chineseLabel: "更新日志" },
  { id: "MIGRATION_GUIDE", label: "Migration Guide", chineseLabel: "迁移指南" },
  { id: "INTERNAL_SPEC", label: "Internal Spec", chineseLabel: "内部规范" },
];
