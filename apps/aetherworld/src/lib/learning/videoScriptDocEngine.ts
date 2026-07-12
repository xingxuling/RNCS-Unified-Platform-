export interface TutorialScript {
  title: string;
  platform: "xiaohongshu" | "bilibili" | "youtube" | "demo" | "shortvideo";
  duration: string;
  hook: string;
  scenes: { sceneId: string; visual: string; narration: string; onScreenText: string }[];
  cta: string;
}

export function generateTutorialScript(opts: {
  title: string;
  platform: TutorialScript["platform"];
  durationSeconds: number;
  keyPoints: string[];
}): TutorialScript {
  const scenes = opts.keyPoints.map((kp, i) => ({
    sceneId: `scene_${i + 1}`,
    visual: `镜头 ${i + 1}：UI 录屏 / 关键页面`,
    narration: kp,
    onScreenText: kp.slice(0, 18),
  }));
  return {
    title: opts.title,
    platform: opts.platform,
    duration: `${opts.durationSeconds}s`,
    hook: `${opts.title} —— ${opts.keyPoints[0] ?? ""}`,
    scenes,
    cta: "关注 Aetherworld，获取数列驱动的元智能教程。",
  };
}
