export interface VirtualJournalOutput {
  firstPersonJournal: string;
  thirdPersonExcerpt: string;
  xiaohongshuShare: string;
  songNarrative: string;
  safetyNotes: string[];
}

export function generateVirtualJournal(input: {
  todaySummary: string;
  npcEncounter?: string;
  realityAnchor?: string;
  completedTasks?: string[];
  emotion?: string;
  protagonist?: string;
}): VirtualJournalOutput {
  const protag = input.protagonist ?? "我";
  const anchor = input.realityAnchor ?? "（建议补一个现实锚点）";
  const tasks = input.completedTasks?.length ? input.completedTasks.join("、") : "没有外显任务";
  const emo = input.emotion ?? "平静";

  return {
    firstPersonJournal:
`今天虚拟生活：${input.todaySummary}
${input.npcEncounter ? `遇见：${input.npcEncounter}\n` : ""}完成：${tasks}
情绪：${emo}
现实锚点：${anchor}
注：这是虚拟生活内容，不替代现实。`,
    thirdPersonExcerpt:
`${protag} 在这一天的虚拟世界里走过了「${input.todaySummary}」。${input.npcEncounter ? `${input.npcEncounter} 在某个转角停下脚步。` : ""}回到现实后，${protag} 仍然记得${anchor}。`,
    xiaohongshuShare:
`【虚拟生活 · 今日】${input.todaySummary}｜情绪：${emo}｜真实锚点：${anchor}（非现实建议）`,
    songNarrative:
`歌曲剧情：从「${input.todaySummary}」开始，落点回到现实锚点「${anchor}」，情绪母题：${emo}。`,
    safetyNotes: ["虚拟生活内容不替代现实", "请保留至少一个现实锚点"],
  };
}
