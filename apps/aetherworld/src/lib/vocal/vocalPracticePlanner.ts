import type { VocalProfile } from "./vocalProfileEngine";

export interface VocalPracticePlan {
  goal: string;
  warmup: string[];
  practiceSteps: string[];
  riskyBehaviorsToAvoid: string[];
  recoveryAdvice: string[];
  durationSuggestion: string;
}

export function buildPracticePlan(profile: VocalProfile, goal: string): VocalPracticePlan {
  const warmup = [
    "5 分钟 lip trill（从舒适音域向上下扩展）。",
    "3 分钟 ‘ng’ 共鸣，靠近鼻腔但不挤喉。",
    "Sirens 上下滑音，不追求音高。",
  ];

  const steps = [
    "用一段 verse 旋律练习气息控制，保持声带轻松。",
    "副歌段先在低 8 度过一遍，建立肌肉记忆。",
    "切换混声练习，避免直接强推胸声。",
    "录音回听，注意稳定度而不是音量。",
  ];

  const risky = [
    "不要硬顶高音，超过舒适音就降调或换段。",
    "不要在熬夜或感冒时进行高强度演唱。",
    "不要长时间用 vocal fry 或喊唱。",
    "嗓子开始有刺痛、刮擦感时立刻停止。",
  ];

  const recovery = [
    "练习后 1–2 小时声休。",
    "温水、不要过冰、不要烫。",
    "可做轻 lip trill 帮助声带放松。",
    "若 24 小时仍不适，应就医或咨询专业声乐老师。",
  ];

  const dur = profile.dramaticIntensity > 0.8
    ? "建议单次 30–40 分钟，分两段，中间休息 10 分钟。"
    : "建议单次 30–45 分钟。";

  return {
    goal,
    warmup,
    practiceSteps: steps,
    riskyBehaviorsToAvoid: risky,
    recoveryAdvice: recovery,
    durationSuggestion: dur,
  };
}
