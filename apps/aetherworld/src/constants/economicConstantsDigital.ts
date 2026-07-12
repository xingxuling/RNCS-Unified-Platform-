import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const ECONOMIC_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("VALUE_DENSITY","Value Density","价值密度","单位成本创造的价值。","提升密度。","低密度。","高成本低产出。",["浓缩价值"]),
  c("WILLINGNESS_TO_PAY","Willingness to Pay","付费意愿","用户付费意愿。","定位高 WTP。","误判。","对学生收企业价。",["分层定价"]),
  c("COST_PRESSURE","Cost Pressure","成本压力","运行/开发成本。","降压。","压力崩盘。","API 月费 > 收入。",["切量"]),
  c("RESOURCE_LEVERAGE","Resource Leverage","资源杠杆","少撬大。","杠杆设计。","线性消耗。","靠堆人。",["模板化"]),
  c("MARKET_SIZE","Market Size","市场规模","可服务人群。","验证规模。","小市场过度投入。","研究小众做大投入。",["规模评估"]),
  c("NICHE_DEPTH","Niche Depth","小众深度","深度愿付。","深耕小众。","只浮于表。","只做大众通用。",["深度服务"]),
  c("MONETIZATION_PATH","Monetization Path","商业化路径","订阅/企业/导出。","清晰路径。","无路径。","始终免费。",["路径设计"]),
  c("UNIT_ECONOMICS","Unit Economics","单位经济","单用户成本/收益。","验证 UE。","UE 为负。","拉新成本>LTV。",["UE 优化"]),
  c("CAPITAL_ATTRACTION","Capital Attraction","资本吸引力","资本/合作吸引。","讲清叙事。","叙事混乱。","定位模糊。",["叙事打磨"]),
  c("LONG_TAIL_VALUE","Long Tail Value","长尾价值","积累越久越值。","建积累机制。","无积累。","内容散落。",["归档库"]),
];
