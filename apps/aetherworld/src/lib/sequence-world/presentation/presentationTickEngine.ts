export interface PresentationTickInput {
  worldTick: number;
  phaseBefore?: string;
  phaseAfter?: string;
  activeEventTypes?: string[];
  pressureDelta?: number;
}

export interface PresentationTickResult {
  tick: number;
  renderChanges: string[];
  physicsChanges: string[];
  animationChanges: string[];
  cameraChanges: string[];
  audioChanges: string[];
  uiChanges: string[];
  warnings: string[];
}

export function runPresentationTick(input: PresentationTickInput): PresentationTickResult {
  const r: string[] = [], p: string[] = [], a: string[] = [], c: string[] = [], au: string[] = [], u: string[] = [], w: string[] = [];
  const phase = input.phaseAfter ?? input.phaseBefore;

  if ((input.activeEventTypes ?? []).includes("CONFLICT")) {
    r.push("提高粒子密度"); a.push("切换 fast_burst"); c.push("启用 FAST_CUT"); au.push("启用 tense_drums"); u.push("alert 闪烁（受 reduced motion 控制）");
  }
  if (phase === "STABILIZATION") {
    r.push("降低饱和、提高柔光"); a.push("使用 breathing_soft"); au.push("使用 warm_pad");
  }
  if (phase === "ARCHIVE") {
    r.push("降低饱和、添加档案纹理"); a.push("降低 idle 速度"); c.push("使用 TOP_DOWN_MAP");
  }
  if (phase === "TERMINAL") {
    r.push("启用星海与仪式光环"); c.push("使用 GOD_VIEW"); au.push("启用合唱与钟声"); u.push("仪式化展开");
  }
  if ((input.pressureDelta ?? 0) > 0.5) p.push("提高 flow turbulence");
  if ((input.pressureDelta ?? 0) < -0.5) p.push("降低 flow turbulence");
  if (r.length > 6 || a.length > 6) w.push("单 tick 变化过多，建议压缩");

  return {
    tick: input.worldTick,
    renderChanges: r,
    physicsChanges: p,
    animationChanges: a,
    cameraChanges: c,
    audioChanges: au,
    uiChanges: u,
    warnings: w,
  };
}
