// 投喂铸造炉 · MSL 状态帧
import type { IntakeForgeRun, IntakeItem } from "./intakeForgeTypes";

export interface IntakeMslFrame {
  opcode:
    | "INTAKE.RECEIVED"
    | "INTAKE.SANITIZED"
    | "INTAKE.CLASSIFIED"
    | "INTAKE.COMPILED"
    | "INTAKE.EVAL_CREATED"
    | "INTAKE.BLOCKED"
    | "INTAKE.SAVED";
  itemId: string;
  meta: Record<string, unknown>;
}

function itemToFrame(item: IntakeItem): IntakeMslFrame {
  if (item.safetyStatus === "BLOCK") {
    return { opcode: "INTAKE.BLOCKED", itemId: item.id, meta: { reason: item.notes } };
  }
  return {
    opcode: "INTAKE.EVAL_CREATED",
    itemId: item.id,
    meta: {
      sourceType: item.sourceType,
      inputMode: item.inputMode,
      safetyStatus: item.safetyStatus,
    },
  };
}

export function runToMslFrames(run: IntakeForgeRun): IntakeMslFrame[] {
  return run.items.map(itemToFrame);
}
