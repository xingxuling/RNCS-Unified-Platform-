import type { WorldPresentationResult } from "./worldPresentationRuntime";

export type PresentationCompressionTarget =
  | "ART_DIRECTION_BRIEF"
  | "GAME_RUNTIME_PROFILE"
  | "CINEMATIC_BRIEF"
  | "COMIC_VISUAL_GUIDE"
  | "GODOT_EXPORT_PROFILE"
  | "UNITY_EXPORT_PROFILE"
  | "FOUNDER_PRESENTATION_TRACE";

export interface PresentationCompressionResult {
  target: PresentationCompressionTarget;
  summary: string;
  keyVisualRules: string[];
  keyMotionRules: string[];
  keyAudioRules: string[];
  exportNotes: string[];
}

export function compressPresentation(p: WorldPresentationResult, target: PresentationCompressionTarget): PresentationCompressionResult {
  const visual = [
    `主风格：${p.renderRuntime.renderStyle}`,
    `主色：${p.renderRuntime.palette.primary.join("、")}`,
    `光照：${p.renderRuntime.lighting.mode}`,
    `粒子密度：${p.renderRuntime.particles.map(x => `${x.particleType}/${(x.density * 100).toFixed(0)}%`).join("，")}`,
  ];
  const motion = [
    `动画风格：${p.animationRuntime.movementStyle}`,
    `镜头：${p.cameraLanguage.defaultCameraMode} · ${p.cameraLanguage.cameraRhythm}`,
    `物理趋势：${p.semanticPhysicsRuntime.globalMotionBias}`,
  ];
  const audio = [
    `氛围：${p.audioAtmosphere.ambientStyle}`,
    `情绪：${p.audioAtmosphere.musicMood}`,
    `乐器：${p.audioAtmosphere.instrumentation.join("、")}`,
  ];

  const summaryByTarget: Record<PresentationCompressionTarget, string> = {
    ART_DIRECTION_BRIEF: "面向美术团队的视觉方向说明",
    GAME_RUNTIME_PROFILE: "面向游戏运行时的表现层参数集",
    CINEMATIC_BRIEF: "面向视频/预告片的表现说明",
    COMIC_VISUAL_GUIDE: "面向漫画的视觉与镜头指南",
    GODOT_EXPORT_PROFILE: "Godot 表现层导出参数",
    UNITY_EXPORT_PROFILE: "Unity 表现层导出参数",
    FOUNDER_PRESENTATION_TRACE: "Founder 完整表现 trace",
  };

  return {
    target,
    summary: `${summaryByTarget[target]}（世界 ${p.worldId}）`,
    keyVisualRules: visual,
    keyMotionRules: motion,
    keyAudioRules: audio,
    exportNotes: [
      ...p.safetyNotes,
      "导出前请确认 subjectMode 与隐私边界。",
    ],
  };
}
