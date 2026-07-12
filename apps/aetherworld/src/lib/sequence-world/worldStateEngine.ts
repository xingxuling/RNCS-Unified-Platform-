// World State Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";

export interface WorldStateProfile {
  worldName: string;
  worldMood: string;
  dominantForce: string;
  activeDomains: string[];
  unstableDomains: string[];
  currentPhase: "SEED" | "AWAKENING" | "EXPANSION" | "CONFLICT" | "ARCHIVE" | "VOID" | "RESEED";
  entropyLevel: number;     // 0-1
  eventPressure: number;    // 0-1
  stability: number;        // 0-1
  worldDescription: string;
}

const PHASE_FOR_DOMINANT: Record<string, WorldStateProfile["currentPhase"]> = {
  "0":"VOID","1":"AWAKENING","2":"EXPANSION","3":"EXPANSION","4":"CONFLICT",
  "5":"CONFLICT","6":"RESEED","7":"ARCHIVE","8":"EXPANSION","9":"ARCHIVE",
};

const DOMINANT_FORCE: Record<string, string> = {
  "0":"虚空与归零","1":"主权启动","2":"关系连接","3":"符号传播","4":"规则秩序",
  "5":"风之变化","6":"生命承载","7":"潜意识深读","8":"资源重力","9":"文明终局",
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateWorldState(core: SequenceCoreProfile): WorldStateProfile {
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;
  const ratio = (d: string) => (f[d] ?? 0) / total;

  const eventPressure = clamp01(ratio("5") * 2 + ratio("3") * 0.5);
  const stability     = clamp01(0.4 + ratio("6") * 1.5 + ratio("4") * 0.8 - ratio("5"));
  const entropyLevel  = clamp01(0.3 + ratio("5") * 1.2 + ratio("7") * 0.6 - ratio("4") * 0.5);

  const top = core.dominantDigits[0] ?? "5";
  const currentPhase = PHASE_FOR_DOMINANT[top];

  const moodParts: string[] = [];
  if (ratio("0") > 0.25) moodParts.push("虚空感强");
  if (ratio("9") > 0.2)  moodParts.push("终局氛围");
  if (ratio("5") > 0.25) moodParts.push("事件频发");
  if (ratio("6") > 0.2)  moodParts.push("生机蓬勃");
  if (ratio("7") > 0.2)  moodParts.push("迷雾环绕");
  const worldMood = moodParts.length ? moodParts.join(" · ") : "中性平衡";

  const activeDomains: string[] = [];
  const unstableDomains: string[] = [];
  const bias = core.fiveDomainBias;
  Object.entries(bias).forEach(([k, v]) => {
    if (v === "—") unstableDomains.push(k);
    else activeDomains.push(`${k}: ${v}`);
  });

  const worldDescription =
    `${core.name} 当前进入【${currentPhase}】相位，主导力量为「${DOMINANT_FORCE[top] ?? "未知"}」。` +
    `稳定度 ${(stability * 100).toFixed(0)}%，事件压力 ${(eventPressure * 100).toFixed(0)}%，熵 ${(entropyLevel * 100).toFixed(0)}%。`;

  return {
    worldName: core.name,
    worldMood,
    dominantForce: DOMINANT_FORCE[top] ?? "未知",
    activeDomains,
    unstableDomains,
    currentPhase,
    entropyLevel,
    eventPressure,
    stability,
    worldDescription,
  };
}
