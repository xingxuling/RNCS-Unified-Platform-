import type { ConstantGapResult } from "./constantGapDetector";
import type { ResistanceReductionResult } from "./resistanceReductionEngine";
import type { FiveDomainMapping } from "./fiveDomainMappingEngine";
import type { BreakthroughObjectType } from "@/constants/breakthroughObjectTypes";
import type { BreakthroughAction } from "@/constants/breakthroughActionTypes";

export interface ActionPermissionResult {
  primaryAction: BreakthroughAction;
  secondaryActions: BreakthroughAction[];
  forbiddenActions: BreakthroughAction[];
  reason: string;
  timing: string;
  riskLevel: "低" | "中" | "高";
}

export function resolveActionPermission(
  gaps: ConstantGapResult,
  resistance: ResistanceReductionResult,
  domains: FiveDomainMapping,
  objectType: BreakthroughObjectType,
): ActionPermissionResult {
  const keyN = gaps.missingNumbers[0];
  let primary: BreakthroughAction = "观察";
  const secondary: BreakthroughAction[] = [];
  const forbidden: BreakthroughAction[] = [];
  let reason = "";

  switch (keyN) {
    case 0: primary = "归档"; secondary.push("封存","清理"); forbidden.push("扩大测试","发布"); reason = "缺归零：先封存旧状态。"; break;
    case 1: primary = "守"; secondary.push("沟通","补材料"); forbidden.push("扩大测试"); reason = "缺主权：先把负责人和边界写清。"; break;
    case 2: primary = "沟通"; secondary.push("小步测试","回验"); forbidden.push("扩大测试"); reason = "缺用户/反馈：先找3位真实用户。"; break;
    case 3: primary = "补材料"; secondary.push("发布","小步测试"); forbidden.push("扩大测试"); reason = "缺表达：先把话讲清。"; break;
    case 4: primary = "补材料"; secondary.push("守","修复"); forbidden.push("扩大测试","发布"); reason = "缺秩序：先建流程。"; break;
    case 5: primary = "小步测试"; secondary.push("沟通","观察"); forbidden.push("扩大测试"); reason = "缺触发：用小动作打破停滞。"; break;
    case 6: primary = "恢复"; secondary.push("守","止损"); forbidden.push("扩大测试","发布","进"); reason = "缺承载：先恢复，再谈推进。"; break;
    case 7: primary = "观察"; secondary.push("回验","归档"); forbidden.push("扩大测试"); reason = "缺深读：先看清后台。"; break;
    case 8: primary = "小步测试"; secondary.push("沟通","守"); forbidden.push("扩大测试"); reason = "缺资源：低成本验证商业闭环。"; break;
    case 9: primary = "守"; secondary.push("观察","归档"); forbidden.push("扩大测试"); reason = "缺终局：先对齐长期方向。"; break;
    default: primary = "观察"; reason = "信息不足，先观察。";
  }

  // resistance-based overrides
  const rids = resistance.topResistances.map((r) => r.resistance.id);
  if (rids.includes("NOISE_HIGH") || rids.includes("FALSE_SIGNAL")) {
    secondary.unshift("降噪");
    forbidden.push("发布");
  }
  if (rids.includes("BODY_LIMITATION") || rids.includes("EMOTIONAL_DISTORTION")) {
    primary = "恢复";
    forbidden.push("扩大测试","发布","进");
    reason = "出现身体/情绪阻力，优先恢复。";
  }
  if (rids.includes("LEGAL_ADMIN_BLOCK")) {
    primary = "止损";
    forbidden.push("发布","扩大测试","进");
    reason = "出现制度阻断，先止损。";
  }

  const risk = forbidden.length >= 3 ? "高" : forbidden.length >= 1 ? "中" : "低";
  const timing =
    domains.strongestDomain.includes("天") ? "今日/本周内执行" :
    domains.weakestDomain.includes("天") ? "暂不设硬截止" : "本周内安排";

  return {
    primaryAction: primary,
    secondaryActions: Array.from(new Set(secondary)).slice(0, 4),
    forbiddenActions: Array.from(new Set(forbidden)).slice(0, 5),
    reason: `${reason}（对象：${objectType.userFriendlyName}）`,
    timing,
    riskLevel: risk as "低"|"中"|"高",
  };
}
