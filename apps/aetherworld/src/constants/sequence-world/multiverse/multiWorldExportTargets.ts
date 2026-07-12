export const MULTI_WORLD_EXPORT_TARGETS = [
  { id: "GENERIC_JSON", label: "通用 JSON", filename: "multiworld.json" },
  { id: "GODOT_MULTIWORLD_RUNTIME_JSON", label: "Godot 多世界 Runtime", filename: "godot_multiworld.json" },
  { id: "UNITY_MULTIWORLD_RUNTIME_JSON", label: "Unity 多世界 Runtime", filename: "unity_multiworld.json" },
  { id: "THREEJS_WORLD_MAP_JSON", label: "Three.js 世界地图", filename: "threejs_worldmap.json" },
  { id: "NARRATIVE_MULTIVERSE_BIBLE", label: "叙事多宇宙圣经", filename: "multiverse_bible.md" },
  { id: "WORLD_KNOWLEDGE_PACK", label: "世界知识包", filename: "world_knowledge_pack.json" },
  { id: "PORTAL_GRAPH_JSON", label: "门户图 JSON", filename: "portal_graph.json" },
  { id: "FOUNDER_TRACE_JSON", label: "Founder Trace", filename: "founder_trace.json" },
] as const;
export type MultiWorldExportTargetId = (typeof MULTI_WORLD_EXPORT_TARGETS)[number]["id"];
