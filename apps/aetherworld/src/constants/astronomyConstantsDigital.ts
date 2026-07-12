import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const ASTRONOMY_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("DAY_NIGHT_CYCLE","Day–Night Cycle","昼夜周期","清醒/创造/恢复节律。","贴合节律。","逆节律。","深夜做关键决策。",["排时段"]),
  c("WEEKLY_RHYTHM","Weekly Rhythm","周节律","周内行为模式。","选周中发布。","周五上线。","客户周末无反馈。",["周节奏"]),
  c("MONTHLY_CYCLE","Monthly Cycle","月周期","情绪/计划/发布周期。","月初规划月末复盘。","乱节奏。","每天临时决策。",["月节奏"]),
  c("SEASONAL_CYCLE","Seasonal Cycle","季节周期","年度节奏。","旺季发力。","逆季节。","夏季推冬季产品。",["顺季"]),
  c("SOLAR_EXPOSURE","Solar Exposure","光照影响","精神状态。","保障日照。","长期低光。","封闭办公室。",["户外节奏"]),
  c("LUNAR_SYMBOLIC_PHASE","Lunar Symbolic Phase","月相象征相位","象征性周期（非硬预测）。","作为节奏锚。","当硬规则。","以月相决商业策略。",["象征性使用"]),
  c("MACRO_TIMING_WINDOW","Macro Timing Window","宏观时间窗口","长期项目窗口。","识别窗口。","错过窗口。","风口已过仍坚持。",["窗口扫描"]),
  c("ORBITAL_REPEAT","Orbital Repeat","循环回归","问题周期性回来。","提前预案。","视为偶然。","每季同一危机。",["周期记录"]),
  c("ECLIPSE_EVENT","Eclipse Event","遮蔽事件","短期信息不清。","延后决策。","硬判断。","在不清晰时立约。",["延后判断"]),
  c("ALIGNMENT_WINDOW","Alignment Window","对齐窗口","多周期同向窗口。","All-in。","错过即过。","等到完美却不行动。",["顺势启动"]),
];
