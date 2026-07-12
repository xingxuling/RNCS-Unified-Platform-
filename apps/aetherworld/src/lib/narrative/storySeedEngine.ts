export interface StorySeedInput {
  title?: string;
  worldName?: string;
  characterNames?: string[];
  storyPremise: string;
  currentConflict?: string;
  targetMode: string;
  targetPlatform?: string;
  emotionalTone?: string;
  existingLore?: string;
  sequenceContext?: string;
}

export interface StorySeed {
  title: string;
  logline: string;
  protagonist: string;
  antagonistOrObstacle: string;
  centralConflict: string;
  emotionalCore: string;
  narrativePromise: string;
  readerHook: string;
  safetyNotes: string[];
}

export function buildStorySeed(input: StorySeedInput): StorySeed {
  const protag = input.characterNames?.[0] ?? "主角";
  const anta = input.characterNames?.[1] ?? input.currentConflict ?? "尚未显化的障碍";
  const conflict = input.currentConflict ?? "外部秩序与内在迟疑之间的张力";
  const tone = input.emotionalTone ?? "克制而炽热";
  const title = input.title || (input.worldName ? `${input.worldName}：${protag}的章节` : `${protag}的章节`);
  return {
    title,
    logline: `在「${input.worldName ?? "未命名世界"}」里，${protag} 必须面对「${conflict}」，而真正被检验的，是他/她是否还能像人一样迟疑。`,
    protagonist: protag,
    antagonistOrObstacle: anta,
    centralConflict: conflict,
    emotionalCore: tone,
    narrativePromise: input.storyPremise,
    readerHook: `${protag} 做的下一个决定，会让世界与自我同时改写。`,
    safetyNotes: [
      "故事种子是创作起点，不构成现实事实",
      ...(input.sequenceContext ? [`数列上下文：${input.sequenceContext}`] : []),
    ],
  };
}
