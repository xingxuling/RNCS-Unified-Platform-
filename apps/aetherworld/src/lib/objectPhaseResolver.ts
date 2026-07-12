import { OBJECT_PHASES, resolvePhase, type ObjectPhase } from "@/constants/objectPhaseTypes";

export interface ObjectPhaseResult {
  currentPhase: string;
  currentPhaseName: string;
  phaseReason: string;
  allowedActions: string[];
  forbiddenActions: string[];
  nextPhaseHint: string;
}

export function resolveObjectPhase(input: { description: string; phaseHint?: string }): ObjectPhaseResult {
  const text = input.description || "";
  const detect = (): ObjectPhase => {
    if (input.phaseHint) return resolvePhase(input.phaseHint);
    if (/归档|结束|完成|不再使用/.test(text)) return resolvePhase("ARCHIVE");
    if (/疲劳|乏力|效率下降/.test(text))       return resolvePhase("FATIGUE");
    if (/功能过多|膨胀|太多/.test(text))       return resolvePhase("OVERGROWN");
    if (/稳定|成熟/.test(text))                return resolvePhase("STABLE");
    if (/增长|扩张|更多用户/.test(text))       return resolvePhase("GROWING");
    if (/上线|运行中|正在使用/.test(text))     return resolvePhase("ACTIVE");
    if (/测试|内测|验证/.test(text))           return resolvePhase("TESTING");
    if (/原型|草稿|成形/.test(text))           return resolvePhase("FORMING");
    if (/想法|刚开始|种子/.test(text))         return resolvePhase("SEED");
    return resolvePhase("FORMING");
  };
  const p = detect();
  return {
    currentPhase: p.id,
    currentPhaseName: p.name,
    phaseReason: `根据描述判断当前阶段为「${p.name}」：${p.description}`,
    allowedActions: p.allowedActions,
    forbiddenActions: p.forbiddenActions,
    nextPhaseHint: p.nextHint,
  };
}

export { OBJECT_PHASES };
