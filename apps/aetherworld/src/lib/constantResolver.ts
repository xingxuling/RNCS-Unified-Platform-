// 常数宇宙 v1.0 · 统一解析器（供各计算法读取）
import { ConstantUniverse } from "./constantUniverseEngine";
import type { EventDimensionId } from "@/constants/eventConstants";
import type { UserTypeId } from "@/constants/userConstants";
import type { PlatformId } from "@/constants/platformConstants";
import type { DomainId } from "@/constants/fiveDomainConstants";

export const resolveNumber = (d: number) =>
  ConstantUniverse.numbers.find((n) => n.digit === d);

export const resolveDomain = (id: DomainId) =>
  ConstantUniverse.domains.find((x) => x.id === id);

export const resolveDomainByPosition = (pos: number) =>
  ConstantUniverse.domains.find((x) => x.position === pos);

export const resolveEventDimension = (id: EventDimensionId) =>
  ConstantUniverse.eventDimensions.find((e) => e.dimensionId === id);

export const resolveUser = (id: UserTypeId) =>
  ConstantUniverse.users.find((u) => u.id === id);

export const resolvePlatform = (id: PlatformId) =>
  ConstantUniverse.platforms.find((p) => p.id === id);

export const resolveOperator = (op: string) =>
  [...ConstantUniverse.multiplyOperators, ...ConstantUniverse.divideOperators]
    .find((o) => o.operator === op);

export const resolveFeedbackOutcome = (id: string) =>
  ConstantUniverse.feedbackOutcomes.find((o) => o.id === id);

export const resolveTimePhase = (phaseId: string) =>
  ConstantUniverse.timePhases.find((p) => p.phaseId === phaseId);

// 把五位数翻译成五域解析
export function parseFiveDigitNumber(num: string) {
  const digits = num.padStart(5, "0").slice(-5).split("").map(Number);
  return digits.map((d, i) => ({
    position: i + 1,
    domain: resolveDomainByPosition(i + 1)!,
    number: resolveNumber(d)!,
  }));
}
