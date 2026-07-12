import type {
  WebWorldRuntimeInput,
  WebWorldRuntimeResult,
} from "./webWorldRuntimeTypes";

/**
 * 运行一次世界运行时。
 *
 * 内部不再重复实现世界生成逻辑，而是给出一个稳定 DTO，
 * 由调用方决定是否进一步打开 /world-simulation / /world-runtime 做深度编辑。
 *
 * 这一层是「对话承接 / 商店调用」与「真实引擎」之间的薄适配。
 */
export async function runWebWorldRuntime(
  input: WebWorldRuntimeInput,
): Promise<WebWorldRuntimeResult> {
  const seed = (input.seed || "").trim() || "未命名世界";
  const sig = await hashSeed(`${input.mode}-${seed}`);

  // 极简推断：按模式给出默认规模
  const scale = {
    DEMO:     { zones: 5,  quests: 3, npcs: 5,  rules: 4 },
    LIGHT:    { zones: 8,  quests: 5, npcs: 8,  rules: 6 },
    FULL:     { zones: 12, quests: 8, npcs: 14, rules: 8 },
    CREATOR:  { zones: 10, quests: 6, npcs: 12, rules: 7 },
    DECISION: { zones: 6,  quests: 7, npcs: 4,  rules: 6 },
  }[input.mode];

  const dominantDomain = inferDomain(seed);
  const phase = "SEED";

  const safetyNotes = [
    "虚拟世界生成结果不代表现实事实。",
    input.mode === "FULL" ? "深度世界使用完整主体数列，建议在私密环境运行。" : "",
  ].filter(Boolean);

  return {
    runId: `wwr_${Date.now().toString(36)}`,
    worldId: `world_${sig.slice(0, 8)}`,
    worldName: deriveWorldName(seed, input.mode),
    signature: sig.slice(0, 8).toUpperCase(),
    dominantDomain,
    phase,
    zonesCount:  input.generateMap === false ? 0 : scale.zones,
    questsCount: input.generateQuests === false ? 0 : scale.quests,
    npcsCount:   input.generateNpcs === false ? 0 : scale.npcs,
    rulesCount:  scale.rules,
    safetyNotes,
    summary:
      `已生成「${deriveWorldName(seed, input.mode)}」：` +
      `主导域 ${dominantDomain}，` +
      `${scale.zones} 个区域、${scale.quests} 个任务、${scale.npcs} 个 NPC、${scale.rules} 条法则。`,
    createdAt: new Date().toISOString(),
  };
}

function deriveWorldName(seed: string, mode: string): string {
  const head = seed.slice(0, 12);
  const tag = ({
    DEMO: "演示",
    LIGHT: "轻量",
    FULL: "深度",
    CREATOR: "创作",
    DECISION: "决策",
  } as Record<string, string>)[mode] ?? "未知";
  return `${tag}·${head || "未命名"}`;
}

function inferDomain(seed: string): string {
  const s = seed.toLowerCase();
  if (/时间|窗口|顺序|tian/.test(s))  return "tian";
  if (/资源|结构|地基|di/.test(s))    return "di";
  if (/关系|人际|协作|ren/.test(s))   return "ren";
  if (/象征|主线|意义|shen/.test(s))  return "shen";
  if (/变化|风|噪声|feng/.test(s))    return "feng";
  return "shen";
}

async function hashSeed(s: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = new TextEncoder().encode(s);
    const h = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0");
}
