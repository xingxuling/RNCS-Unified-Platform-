import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const CHEMISTRY_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("REACTIVITY","Reactivity","反应性","两物接触后是否产生变化。","主动配对反应物。","错配产生爆点。","术语+小白用户=反感。",["分群"]),
  c("CATALYST","Catalyst","催化剂","少量介入即可加速反应。","选对一个催化点。","催化剂过量。","KOL 推一次即引爆。",["精挑催化点"]),
  c("INHIBITOR","Inhibitor","抑制剂","让反应变慢或停止。","用于降温。","误用抑制剂封死反应。","过早露出产品。",["延后露出"]),
  c("CONCENTRATION","Concentration","浓度","变量的密度。","集中浓度突破。","浓度过高刺激。","通篇专业词。",["稀释术语"]),
  c("MIXING_RATIO","Mixing Ratio","混合比例","多元素配比。","找到黄金比。","比例失衡。","干货:故事=9:1 太硬。",["调整比例"]),
  c("STABILITY","Stability","稳定性","混合后能否长期保持。","选稳定组合。","短期亮眼长期失效。","活动后留存归零。",["持续维护"]),
  c("VOLATILITY","Volatility","挥发性","系统是否易波动。","用波动测信号。","波动惊跑用户。","价格频繁变。",["稳定关键面"]),
  c("TOXICITY","Toxicity","毒性","元素过量是否伤害系统。","控制有毒元素。","毒性累积。","命运论术语堆积。",["祛毒重写"]),
  c("PRECIPITATION","Precipitation","沉淀","反应后形成稳定产物。","沉淀为模板。","只沸腾不沉淀。","内容发完即蒸发。",["沉淀产物"]),
  c("CHAIN_REACTION","Chain Reaction","链式反应","一触发引发连续变化。","设计扩散钩子。","失控扩散。","争议话题反噬。",["可控钩子"]),
];
