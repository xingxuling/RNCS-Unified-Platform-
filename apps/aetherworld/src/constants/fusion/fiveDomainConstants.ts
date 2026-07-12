// Fusion 五域常数：天 / 地 / 人 / 神 / 风
// 供 Chat / Calculus Router / Prompt Contract 共用。
// 复用 src/constants/fiveDomainConstants.ts 的 DomainId 概念，但更紧凑。

export type FiveDomainId = "HEAVEN" | "EARTH" | "HUMAN" | "SPIRIT" | "WIND";

export interface FiveDomainConstantDef {
  id: FiveDomainId;
  position: number;
  label: string;
  meaningSummary: string;
  keywords: string[];
  affectedEngines: string[];
}

export const FIVE_DOMAIN_CONSTANTS: FiveDomainConstantDef[] = [
  {
    id: "HEAVEN", position: 1, label: "天",
    meaningSummary: "趋势 / 时机 / 时代势能 / 宏观窗口 / 外部天花板。",
    keywords: ["趋势", "时机", "窗口", "周期", "节奏", "时代", "未来", "明天", "今晚", "下周"],
    affectedEngines: ["MSL", "EventScheduler", "CalendarTrigger"],
  },
  {
    id: "EARTH", position: 2, label: "地",
    meaningSummary: "承载 / 资源 / 环境 / 基础设施 / 运行场域。",
    keywords: ["环境", "资源", "平台", "场域", "运行", "本地", "浏览器", "工作区", "沙箱", "项目"],
    affectedEngines: ["AppRuntime", "CodeSandbox", "Workspace"],
  },
  {
    id: "HUMAN", position: 3, label: "人",
    meaningSummary: "用户 / 主体 / 角色 / 团队 / 执行者 / 受众。",
    keywords: ["用户", "角色", "团队", "听众", "受众", "我", "他", "NPC", "成员"],
    affectedEngines: ["NPCAgent", "SocialGraph", "Subject"],
  },
  {
    id: "SPIRIT", position: 4, label: "神",
    meaningSummary: "意义 / 规则 / 叙事 / 合法性 / 价值 / 系统宪法。",
    keywords: ["意义", "主线", "规则", "宪法", "叙事", "价值", "信念", "文明", "理念"],
    affectedEngines: ["WorldCanon", "Constitution", "Narrative"],
  },
  {
    id: "WIND", position: 5, label: "风",
    meaningSummary: "传播 / 流动 / 接口 / 触发 / 扩散 / 变化。",
    keywords: ["发布", "分享", "提醒", "通知", "触发", "变化", "传播", "扩散", "流转", "歌"],
    affectedEngines: ["SocialDraft", "PresentationRuntime", "Terminal"],
  },
];

export function getFiveDomain(id: FiveDomainId): FiveDomainConstantDef {
  return FIVE_DOMAIN_CONSTANTS.find((d) => d.id === id)!;
}
