export interface ExportTargetDef {
  id: string;
  label: string;
  extension: string;
  description: string;
}

export const MODEL_EXPORT_TARGETS: ExportTargetDef[] = [
  { id: "JSON",            label: "JSON",                    extension: "json", description: "通用 JSON 结构" },
  { id: "TS_INTERFACE",    label: "TypeScript Interface",    extension: "ts",   description: "TS 类型接口" },
  { id: "ZOD",             label: "Zod Schema",              extension: "ts",   description: "Zod 校验 Schema" },
  { id: "MARKDOWN",        label: "Markdown Report",         extension: "md",   description: "可读 Markdown 报告" },
  { id: "PROMPT",          label: "Prompt Template",         extension: "md",   description: "通用 Prompt 模板" },
  { id: "LOVABLE_PROMPT",  label: "Lovable Build Prompt",    extension: "md",   description: "Lovable 构建提示词" },
  { id: "CODEX_PROMPT",    label: "Codex Implementation",    extension: "md",   description: "Codex 实现提示词" },
  { id: "UNITY_CS",        label: "Unity C# Class",          extension: "cs",   description: "Unity 可用 C# 类" },
  { id: "GODOT_GD",        label: "Godot GDScript Class",    extension: "gd",   description: "Godot 可用 GDScript 类" },
  { id: "ENCYCLOPEDIA",    label: "Product Encyclopedia",    extension: "md",   description: "百科条目格式" },
  { id: "CODE",            label: "Code Skeleton",           extension: "ts",   description: "代码骨架" },
];

export function getExportTarget(id: string) {
  return MODEL_EXPORT_TARGETS.find(t => t.id === id);
}
