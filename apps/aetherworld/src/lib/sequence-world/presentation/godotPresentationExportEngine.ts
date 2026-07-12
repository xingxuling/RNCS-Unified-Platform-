import type { WorldPresentationResult } from "./worldPresentationRuntime";

function snake<T extends Record<string, unknown>>(o: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(o).forEach(([k, v]) => {
    const sk = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[sk] = v && typeof v === "object" && !Array.isArray(v) ? snake(v as Record<string, unknown>) : v;
  });
  return out;
}

export interface GodotPresentationPackage {
  metadata: {
    version: string;
    source: string;
    exported_at: string;
    subject_mode: string;
    privacy_notes: string[];
  };
  render_profile: Record<string, unknown>;
  semantic_physics_profile: Record<string, unknown>;
  animation_profile: Record<string, unknown>;
  camera_profile: Record<string, unknown>;
  audio_profile: Record<string, unknown>;
  ui_motion_profile: Record<string, unknown>;
  scene_packs: Record<string, unknown>[];
  safety_notes: string[];
}

export function exportGodotPresentationPackage(p: WorldPresentationResult): GodotPresentationPackage {
  const privacy_notes = p.subjectMode === "FULL_60"
    ? ["Full60 表现层默认本地保存", "请在分享前再次确认"]
    : [];
  return {
    metadata: {
      version: "v0.6",
      source: "Aether Sequence World Engine v0.6",
      exported_at: new Date().toISOString(),
      subject_mode: p.subjectMode,
      privacy_notes,
    },
    render_profile: snake(p.renderRuntime as unknown as Record<string, unknown>),
    semantic_physics_profile: snake(p.semanticPhysicsRuntime as unknown as Record<string, unknown>),
    animation_profile: snake(p.animationRuntime as unknown as Record<string, unknown>),
    camera_profile: snake(p.cameraLanguage as unknown as Record<string, unknown>),
    audio_profile: snake(p.audioAtmosphere as unknown as Record<string, unknown>),
    ui_motion_profile: snake(p.uiMotion as unknown as Record<string, unknown>),
    scene_packs: p.scenePacks.map(s => snake(s as unknown as Record<string, unknown>)),
    safety_notes: p.safetyNotes,
  };
}

export function generateGdScriptSkeleton(): string {
  return `class_name AetherPresentationProfile
extends Resource

var render_profile: Dictionary
var semantic_physics_profile: Dictionary
var animation_profile: Dictionary
var camera_profile: Dictionary
var audio_profile: Dictionary
var ui_motion_profile: Dictionary
var scene_packs: Array = []

func load_from_json(path: String) -> void:
    var file := FileAccess.open(path, FileAccess.READ)
    var data := JSON.parse_string(file.get_as_text())
    render_profile = data.get("render_profile", {})
    semantic_physics_profile = data.get("semantic_physics_profile", {})
    animation_profile = data.get("animation_profile", {})
    camera_profile = data.get("camera_profile", {})
    audio_profile = data.get("audio_profile", {})
    ui_motion_profile = data.get("ui_motion_profile", {})
    scene_packs = data.get("scene_packs", [])
`;
}
