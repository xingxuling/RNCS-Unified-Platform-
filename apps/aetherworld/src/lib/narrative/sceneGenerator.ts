import type { StorySeed } from "./storySeedEngine";

export interface SceneInput {
  storySeed: StorySeed;
  sceneType: string;
  characters: string[];
  location: string;
  conflict: string;
  targetWordCount?: number;
  style: string;
  pov?: "FIRST_PERSON" | "THIRD_PERSON_LIMITED" | "THIRD_PERSON_OMNISCIENT" | "SCRIPT";
}

export interface SceneOutput {
  sceneTitle: string;
  sceneFunction: string;
  text: string;
  keyDialogue: string[];
  emotionalShift: string;
  nextHook: string;
  continuityNotes: string[];
}

const POV_HEADER: Record<string, string> = {
  FIRST_PERSON: "（第一人称）",
  THIRD_PERSON_LIMITED: "（第三人称·有限视角）",
  THIRD_PERSON_OMNISCIENT: "（第三人称·全知）",
  SCRIPT: "（剧本体）",
};

export function generateScene(input: SceneInput): SceneOutput {
  const protag = input.storySeed.protagonist;
  const others = input.characters.filter(c => c && c !== protag);
  const pov = input.pov ?? "THIRD_PERSON_LIMITED";
  const wc = input.targetWordCount ?? 600;

  const title = `${input.sceneType} · ${input.location}`;
  const opening = `${POV_HEADER[pov]} ${input.location} 的空气在那一刻略微下沉。${protag} 没有立刻开口。`;
  const middle = `${protag} 知道${input.conflict}已经无法再被推迟。${others.length ? `${others.join("、")} 站在不远处，目光是另一种压力。` : ""}`;
  const close = `当一切被说出口之前，世界先一步替他们做了选择——只是没人愿意承认。`;

  const text = [
    `# ${title}`,
    "",
    opening,
    "",
    middle,
    "",
    others.length ? `「我们不一定要在今天解决。」${protag} 说。` : `${protag} 在心里把那句话又咽了一次。`,
    others[0] ? `「可是再不解决，明天就是另一个版本的今天。」${others[0]} 回答。` : "",
    "",
    close,
    "",
    `（目标字数 ~${wc} ｜ 风格：${input.style} ｜ 用于：${input.storySeed.title}）`,
  ].filter(Boolean).join("\n");

  return {
    sceneTitle: title,
    sceneFunction: `推进核心冲突：${input.storySeed.centralConflict}`,
    text,
    keyDialogue: [
      `${protag}：我们不一定要在今天解决。`,
      others[0] ? `${others[0]}：再不解决，明天就是另一个版本的今天。` : `${protag}（内）：迟疑也是一种选择。`,
    ],
    emotionalShift: "从克制 → 被迫显化",
    nextHook: `${protag} 必须在下一场景给出一个无法收回的回应。`,
    continuityNotes: [
      `保持 ${protag} 的弧线一致：仍保留人类的迟疑`,
      `场景类型 ${input.sceneType} 与当前主线对齐`,
    ],
  };
}
