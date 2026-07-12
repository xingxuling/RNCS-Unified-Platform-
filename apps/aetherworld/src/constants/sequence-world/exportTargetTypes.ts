export const EXPORT_TARGETS = ["GENERIC_JSON","GODOT_JSON","UNITY_JSON","UNITY_CSHARP","GODOT_GDSCRIPT","MARKDOWN","PROMPT_FORGE"] as const;
export type ExportTarget = typeof EXPORT_TARGETS[number];

export const EXPORT_TARGET_LABEL: Record<ExportTarget, string> = {
  GENERIC_JSON: "通用 JSON",
  GODOT_JSON: "Godot JSON (snake_case)",
  UNITY_JSON: "Unity JSON (camelCase)",
  UNITY_CSHARP: "Unity C# Skeleton",
  GODOT_GDSCRIPT: "Godot GDScript Skeleton",
  MARKDOWN: "Markdown Report",
  PROMPT_FORGE: "Prompt Forge Prompt",
};

export const SEQUENCE_WORLD_ENGINE_VERSION = "0.1.0";
