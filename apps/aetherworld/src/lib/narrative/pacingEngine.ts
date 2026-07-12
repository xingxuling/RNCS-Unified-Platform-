export interface PacingResult {
  pacingScore: number;
  currentIssue: string[];
  recommendedFix: string[];
  nextBeatTiming: string;
}

export function checkPacing(input: {
  text: string;
  hasConflictEarly?: boolean;
  loreDensity?: number;
  dialogueRatio?: number;
}): PacingResult {
  const issues: string[] = [];
  const fixes: string[] = [];
  const len = input.text.length;

  if (input.hasConflictEarly === false) {
    issues.push("开场缺冲突");
    fixes.push("在前 300 字内加入一次冲突或异常");
  }
  if ((input.loreDensity ?? 0) > 0.4) {
    issues.push("设定堆叠过多");
    fixes.push("把设定拆到角色行动中显化");
  }
  if ((input.dialogueRatio ?? 0) > 0.7) {
    issues.push("对白过长");
    fixes.push("用行动 / 留白替换部分对白");
  }
  if (len > 4000 && (input.dialogueRatio ?? 0) < 0.1) {
    issues.push("缺少对白，节奏沉");
    fixes.push("加入 2-3 句关键台词");
  }

  const score = Math.max(0, Math.min(1, 1 - issues.length * 0.18));
  return {
    pacingScore: score,
    currentIssue: issues,
    recommendedFix: fixes,
    nextBeatTiming: score > 0.7 ? "可以推进到下一关键 beat" : "先补一次冲突或留白再推进",
  };
}
