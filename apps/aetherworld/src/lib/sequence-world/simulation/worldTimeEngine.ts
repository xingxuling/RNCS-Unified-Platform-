// World Time Engine — 给虚拟世界提供时间相位
export interface WorldTimeState {
  tick: number;
  day: number;
  arc: number;
  era: number;
  cycle: number;
  timeMood: string;
  phaseBias: string[];
}

const DIGIT_MOOD: Record<string, { mood: string; bias: string[] }> = {
  "0": { mood: "冻结",   bias: ["VOID", "ARCHIVE"] },
  "1": { mood: "开始",   bias: ["SEED", "RESEED"] },
  "2": { mood: "关系",   bias: ["AWAKENING"] },
  "3": { mood: "表达",   bias: ["EXPANSION"] },
  "4": { mood: "规则",   bias: ["EXPANSION", "STABILIZATION"] },
  "5": { mood: "变化",   bias: ["CONFLICT", "EXPANSION"] },
  "6": { mood: "恢复",   bias: ["STABILIZATION"] },
  "7": { mood: "探索",   bias: ["AWAKENING"] },
  "8": { mood: "资源",   bias: ["EXPANSION", "ARCHIVE"] },
  "9": { mood: "终局",   bias: ["TERMINAL"] },
};

export function initialTime(): WorldTimeState {
  return { tick: 0, day: 0, arc: 0, era: 0, cycle: 0, timeMood: "未启动", phaseBias: [] };
}

export function advanceTime(prev: WorldTimeState, dominantDigit: string): WorldTimeState {
  const tick = prev.tick + 1;
  const day = Math.floor(tick / 4);
  const arc = Math.floor(day / 7);
  const era = Math.floor(arc / 4);
  const cycle = Math.floor(era / 4);
  const m = DIGIT_MOOD[dominantDigit] ?? DIGIT_MOOD["5"];
  return { tick, day, arc, era, cycle, timeMood: m.mood, phaseBias: m.bias };
}
