export interface GameQuestText {
  questName: string;
  questSummary: string;
  npcStartDialogue: string[];
  objectives: string[];
  completionCondition: string;
  npcCompletionDialogue: string[];
  rewardText: string;
  failureText?: string;
}

export function generateGameQuestText(input: {
  questName: string;
  npcName: string;
  questGoal: string;
  context?: string;
}): GameQuestText {
  return {
    questName: input.questName,
    questSummary: `${input.npcName} 希望旅行者协助：${input.questGoal}`,
    npcStartDialogue: [
      `${input.npcName}：你来得正好。`,
      `${input.npcName}：${input.questGoal}——我一个人办不到。`,
    ],
    objectives: [`前往任务地点`, `与关键 NPC 对话`, `完成核心目标：${input.questGoal}`],
    completionCondition: "核心目标完成并返回 NPC",
    npcCompletionDialogue: [`${input.npcName}：你做到了。这次的代价，我记下了。`],
    rewardText: "经验、道具、关系值提升",
    failureText: "任务失败：${input.questGoal} 未完成",
  };
}
