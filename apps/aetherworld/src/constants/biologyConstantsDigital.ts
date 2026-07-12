import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const BIOLOGY_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("ENERGY_SUPPLY","Energy Supply","能量供给","系统能量是否充足。","保障基础能量。","能量耗竭。","团队连续加班。",["能量预算"]),
  c("RECOVERY_RATE","Recovery Rate","恢复速度","过载后恢复能力。","设置恢复期。","无恢复期。","项目排满崩溃。",["插入恢复"]),
  c("ADAPTATION","Adaptation","适应性","面对新环境的适应。","逐步暴露。","骤变难适应。","一次重构全模块。",["渐进改造"]),
  c("STRESS_RESPONSE","Stress Response","压力反应","压力下的反应模式。","训练抗压。","压力下僵化。","上线日全员焦虑。",["分散压力"]),
  c("HOMEOSTASIS","Homeostasis","稳态","系统维持稳定的能力。","保留稳态核心。","失稳。","核心模块每周改。",["冻结核心"]),
  c("GROWTH_RATE","Growth Rate","生长速度","系统增长速度。","稳健增长。","过快崩盘。","用户暴涨服务瘫。",["扩容预案"]),
  c("MUTATION_RATE","Mutation Rate","变异率","生成新功能的速度。","控制变异。","变异过度。","每周加新功能。",["合并删减"]),
  c("SELECTION_PRESSURE","Selection Pressure","选择压力","哪些被保留淘汰。","用真实数据筛选。","选错指标。","用页面浏览数选功能。",["核心指标"]),
  c("IMMUNE_RESPONSE","Immune Response","免疫反应","抵御错误与污染。","建立 QA / Safety Guard。","免疫缺失。","噪声进入预测。",["边界检测"]),
  c("SYMBIOSIS","Symbiosis","共生","与用户/工具/社群共生。","构建共生闭环。","寄生关系。","完全依赖单一平台。",["多方共生"]),
];
