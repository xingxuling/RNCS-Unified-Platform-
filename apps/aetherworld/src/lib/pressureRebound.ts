// 反冲计算引擎
import { clamp } from "./math";

export type ReboundCategory =
  | "expression" | "career" | "relation" | "body"
  | "judgment" | "creation" | "resource" | "mainline" | "identity";

export const REBOUND_CATEGORIES: { key: ReboundCategory; name: string }[] = [
  { key: "expression", name: "表达反冲" },
  { key: "career",     name: "事业反冲" },
  { key: "relation",   name: "关系反冲" },
  { key: "body",       name: "身体反冲" },
  { key: "judgment",   name: "判断反冲" },
  { key: "creation",   name: "创作反冲" },
  { key: "resource",   name: "资源反冲" },
  { key: "mainline",   name: "主线反冲" },
  { key: "identity",   name: "旧身份反冲" },
];

export interface ReboundInput {
  category: ReboundCategory;
  pressureLevel: number;     // 0-10
  durationMonths: number;    // 月
  subjectNeed: number;       // 0-10
  dampingDrop: number;       // 0-10 外界阻尼下降率
  capacity: number;          // 0-10 当前承载
  noiseLeak: number;         // 0-10
  overloadRisk: number;      // 0-10
}

export interface ReboundResult {
  index: number;             // 0-100
  level: "Low" | "Building" | "Near-Burst" | "Imminent";
  burstForms: string[];
  releaseSafe: boolean;
  segmentedRelease: boolean;
  advice: string;
}

const BURST_FORMS: Record<ReboundCategory, string[]> = {
  expression: ["大量写作", "公开发布", "持续输出"],
  career:     ["产品化提速", "对外谈合作", "切换岗位/赛道"],
  relation:   ["主动确认关系", "靠近核心关系", "断舍消耗关系"],
  body:       ["睡眠/运动反弹", "高强度工作窗口"],
  judgment:   ["突然看清结构", "拒绝长期忍受的事"],
  creation:   ["新作品集中爆发", "切换创作媒介"],
  resource:   ["资金/合作机会涌现", "用户/客户主动来"],
  mainline:   ["主线显化", "身份重新对齐"],
  identity:   ["旧身份脱落", "新身份命名"],
};

export function computeRebound(i: ReboundInput): ReboundResult {
  const num = (i.pressureLevel + 1) * Math.min(i.durationMonths, 36) / 6
    * (i.subjectNeed + 1) * (i.dampingDrop + 1) * (i.capacity + 1);
  const den = Math.max(1, i.noiseLeak) * Math.max(1, i.overloadRisk);
  const raw = Math.log10(num / den + 1) * 30;
  const index = Math.round(clamp(raw, 0, 100));

  const level: ReboundResult["level"] =
    index >= 85 ? "Imminent" :
    index >= 65 ? "Near-Burst" :
    index >= 40 ? "Building" : "Low";

  const releaseSafe = i.capacity >= 5 && i.overloadRisk <= 6 && index >= 55;
  const segmentedRelease = i.overloadRisk >= 6 || i.capacity <= 4;

  const advice =
    level === "Imminent" && segmentedRelease ? "已临近反冲阈值，必须分段释放，避免过载。" :
    level === "Imminent" ? "立即开窗释放，否则会以失控方式爆发。" :
    level === "Near-Burst" ? "可主动制造小型释放口（一次发布/一次谈话）。" :
    level === "Building" ? "持续蓄压，安排温和释放与承载补给。" :
                            "尚未形成反冲，继续观察。";

  return {
    index, level,
    burstForms: BURST_FORMS[i.category],
    releaseSafe, segmentedRelease, advice,
  };
}

export const DEFAULT_REBOUND_INPUT: ReboundInput = {
  category: "expression",
  pressureLevel: 7, durationMonths: 8, subjectNeed: 7,
  dampingDrop: 5, capacity: 6, noiseLeak: 3, overloadRisk: 4,
};
