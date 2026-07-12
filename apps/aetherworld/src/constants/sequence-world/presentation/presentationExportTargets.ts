export const PRESENTATION_EXPORT_TARGETS = [
  "GENERIC", "GODOT", "UNITY", "THREEJS", "NARRATIVE", "VIDEO", "COMIC",
] as const;
export type PresentationExportTarget = typeof PRESENTATION_EXPORT_TARGETS[number];

export const PRESENTATION_EXPORT_LABELS: Record<PresentationExportTarget, string> = {
  GENERIC: "通用 JSON",
  GODOT: "Godot 表现层",
  UNITY: "Unity 表现层",
  THREEJS: "Three.js / Web",
  NARRATIVE: "剧情/分镜",
  VIDEO: "视频说明",
  COMIC: "漫画视觉指南",
};
