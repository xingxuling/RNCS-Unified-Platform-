// AetherSeed Intake Auto Dataset Sink · 评测样本映射器
import type { IntakeForgeRun } from "@/lib/intake-forge/intakeForgeTypes";
import type { EvalSample } from "./datasetTypes";
import { buildEvalSamplesFromRun } from "./datasetIntakeBridge";

export interface MappedEval {
  pass: EvalSample[];
  dropped: EvalSample[];
}

/** 评测样本：BLOCK 直接丢弃，其余进入评测库。 */
export function mapIntakeEval(run: IntakeForgeRun): MappedEval {
  const all = buildEvalSamplesFromRun(run);
  const pass: EvalSample[] = [];
  const dropped: EvalSample[] = [];
  for (const e of all) {
    if (e.safetyStatus === "BLOCK") {
      dropped.push(e);
      continue;
    }
    pass.push(e);
  }
  return { pass, dropped };
}
