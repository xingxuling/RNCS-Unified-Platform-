import { MSLProgram, MSLStatement } from "./mslParser";
import { interpretStatement } from "./mslInterpreter";
import { safetyNotesFor } from "./mslSafetyGuard";

export interface MSLProgramResult {
  programName: string;
  mode: string;
  phaseTrace: string[];
  worldStateChanges: string[];
  generatedEvents: string[];
  generatedQuests: string[];
  renderShifts: string[];
  physicsShifts: string[];
  finalState: string;
  safetyNotes: string[];
}

function describePhase(stmt: MSLStatement): string {
  const interp = interpretStatement(stmt);
  const idx = stmt.index !== undefined ? `[${stmt.index}] ` : "";
  return `${idx}${stmt.raw}：${interp.summary}`;
}

export function runProgram(program: MSLProgram, opts?: { isFull60?: boolean }): MSLProgramResult {
  const phaseTrace: string[] = [];
  const worldStateChanges: string[] = [];
  const generatedEvents: string[] = [];
  const generatedQuests: string[] = [];
  const renderShifts: string[] = [];
  const physicsShifts: string[] = [];

  let prevTerminal: string | null = null;
  for (const stmt of program.statements) {
    phaseTrace.push(describePhase(stmt));
    const interp = interpretStatement(stmt);
    const terminal = stmt.digits[4];

    // World state change
    if (prevTerminal && prevTerminal !== terminal) {
      worldStateChanges.push(`终端从 ${prevTerminal} → ${terminal}`);
    }
    prevTerminal = terminal;

    // Events
    if (terminal === "5") generatedEvents.push(`${stmt.raw} → 触发显化事件`);
    if (terminal === "0") generatedEvents.push(`${stmt.raw} → 进入归零事件`);
    if (terminal === "9") generatedEvents.push(`${stmt.raw} → 进入收束事件`);

    // Quests
    if (stmt.digits[3] === "1") generatedQuests.push(`${stmt.raw} → 立主线任务`);
    if (stmt.digits[2] === "2") generatedQuests.push(`${stmt.raw} → 关系任务出现`);

    // Render / physics shifts
    const shiftCount = stmt.digits.filter(d => d === "5").length;
    if (shiftCount >= 2) renderShifts.push(`${stmt.raw} → 高粒子密度 / 风动`);
    const stabCount = stmt.digits.filter(d => d === "6").length;
    if (stabCount >= 1) physicsShifts.push(`${stmt.raw} → 增加承载层 / 稳定度`);
    if (interp.riskFlags.length) physicsShifts.push(`${stmt.raw} → 风险：${interp.riskFlags.join("，")}`);
  }

  const last = program.statements[program.statements.length - 1];
  const finalState = last
    ? `终态：${last.raw}，风域终端 = ${last.opcodes.wind}`
    : "无语句，无终态";

  return {
    programName: program.name,
    mode: program.mode ?? "SIMULATION",
    phaseTrace,
    worldStateChanges,
    generatedEvents,
    generatedQuests,
    renderShifts,
    physicsShifts,
    finalState,
    safetyNotes: safetyNotesFor({ isFull60: opts?.isFull60, hasTrace: true }),
  };
}
