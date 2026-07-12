import { MSLStatement } from "./mslParser";
import { getOpcode, MSL_OPCODES } from "@/constants/msl/mslOpcodes";
import { MSL_DOMAINS } from "@/constants/msl/mslDomains";

export interface MSLInterpretation {
  statement: string;
  summary: string;
  domainMeanings: { heaven: string; earth: string; human: string; spirit: string; wind: string };
  dominantOpcodes: string[];
  missingOpcodes: string[];
  terminalMeaning: string;
  actionBias: string[];
  worldBias: string[];
  riskFlags: string[];
}

function describeDomain(domain: typeof MSL_DOMAINS[number], digit: string): string {
  const op = getOpcode(digit);
  return `${domain.zh}（${domain.meaning}）为 ${op.name}（${op.zh}：${op.meaning}）`;
}

export function interpretStatement(stmt: MSLStatement): MSLInterpretation {
  const ds = stmt.digits;
  const [h, e, hu, s, w] = ds;
  const terminal = getOpcode(w);

  // dominant
  const counts: Record<string, number> = {};
  ds.forEach(d => { counts[d] = (counts[d] ?? 0) + 1; });
  const dominant = Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => `${d}=${getOpcode(d).name}`);
  const missing = Object.keys(MSL_OPCODES).filter(d => !ds.includes(d)).map(d => `${d}=${MSL_OPCODES[d].name}`);

  // action bias = union of opcode biases, deduped
  const biasSet = new Set<string>();
  ds.forEach(d => getOpcode(d).bias.forEach(b => biasSet.add(b)));
  const actionBias = Array.from(biasSet);

  // world bias
  const worldBias: string[] = [];
  if (counts["5"] >= 2) worldBias.push("世界处于高变化/事件密集态");
  if (counts["0"] >= 2) worldBias.push("世界进入归零/封存态");
  if (counts["1"] >= 2) worldBias.push("世界主权强、中心化");
  if (counts["6"] >= 1) worldBias.push("世界有承载层，可恢复");
  if (counts["9"] >= 1) worldBias.push("世界趋向终局/收束");
  if (counts["7"] >= 1) worldBias.push("世界含潜层信号");

  const riskFlags: string[] = [];
  if (counts["5"] >= 3 && (counts["6"] ?? 0) === 0) riskFlags.push("变化过强，缺少承载层");
  if (counts["0"] >= 4) riskFlags.push("接近全域归零，不宜强推");
  if (counts["9"] >= 2 && (counts["1"] ?? 0) === 0) riskFlags.push("终局倾向但缺主权启动");
  if (terminal.name === "SHIFT") riskFlags.push("风域终端为 SHIFT，需要回验");

  let summary: string;
  if (stmt.raw === "55555") {
    summary = "全域进入 SHIFT 状态：天、地、人、神、风五域全部处于变化、触发、显化与事件跃迁中。";
  } else if (stmt.raw === "00000") {
    summary = "全域归零：五域全部进入 VOID / 封存 / 暂停 / 清空状态。";
  } else if (stmt.raw === "11111") {
    summary = "全域主权启动：五域全部进入 START / 中心 / 第一推动。";
  } else {
    summary =
      `语句 ${stmt.raw}：` +
      `${describeDomain(MSL_DOMAINS[0], h)}；` +
      `${describeDomain(MSL_DOMAINS[1], e)}；` +
      `${describeDomain(MSL_DOMAINS[2], hu)}；` +
      `${describeDomain(MSL_DOMAINS[3], s)}；` +
      `${describeDomain(MSL_DOMAINS[4], w)}。`;
  }

  return {
    statement: stmt.raw,
    summary,
    domainMeanings: {
      heaven: describeDomain(MSL_DOMAINS[0], h),
      earth:  describeDomain(MSL_DOMAINS[1], e),
      human:  describeDomain(MSL_DOMAINS[2], hu),
      spirit: describeDomain(MSL_DOMAINS[3], s),
      wind:   describeDomain(MSL_DOMAINS[4], w),
    },
    dominantOpcodes: dominant,
    missingOpcodes: missing,
    terminalMeaning: `风域为 ${terminal.name}（${terminal.zh}）：${terminal.meaning}`,
    actionBias,
    worldBias,
    riskFlags,
  };
}

export function interpretMany(stmts: MSLStatement[]): MSLInterpretation[] {
  return stmts.map(interpretStatement);
}
