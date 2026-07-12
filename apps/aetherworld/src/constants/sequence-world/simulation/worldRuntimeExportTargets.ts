export const WORLD_RUNTIME_EXPORT_TARGETS = [
  { id: "GENERIC_JSON",          label: "Generic JSON",            ext: "json" },
  { id: "GODOT_RUNTIME_JSON",    label: "Godot Runtime JSON",      ext: "json" },
  { id: "UNITY_RUNTIME_JSON",    label: "Unity Runtime JSON",      ext: "json" },
  { id: "GODOT_GDSCRIPT_SKELETON", label: "Godot GDScript",        ext: "gd"  },
  { id: "UNITY_CSHARP_SKELETON",   label: "Unity C# Skeleton",     ext: "cs"  },
  { id: "NARRATIVE_BIBLE",       label: "Narrative Bible",         ext: "md"  },
  { id: "WORLD_KNOWLEDGE_PACK",  label: "World Knowledge Pack",    ext: "json" },
  { id: "PROMPT_FORGE_PACK",     label: "Prompt Forge Pack",       ext: "md"  },
] as const;

export type WorldRuntimeExportTargetId = typeof WORLD_RUNTIME_EXPORT_TARGETS[number]["id"];
