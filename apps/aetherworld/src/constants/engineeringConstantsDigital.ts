import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const ENGINEERING_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("STRUCTURAL_INTEGRITY","Structural Integrity","结构完整性","系统能否稳定运行。","核心结构清晰。","结构脆弱。","核心耦合过深。",["解耦"]),
  c("MODULARITY","Modularity","模块化","可扩展/替换/维护性。","模块拆分。","巨石。","单文件 5000 行。",["拆分"]),
  c("MANUFACTURABILITY","Manufacturability","可制造性","设计是否可实际制造。","用现成工艺。","脱离工艺。","纸面方案。",["工艺评估"]),
  c("MAINTAINABILITY","Maintainability","可维护性","后续维护成本。","低维护设计。","维护爆炸。","无文档。",["文档化"]),
  c("RELIABILITY","Reliability","可靠性","长期稳定性。","冗余设计。","单点故障。","唯一服务器。",["双活"]),
  c("COST_OF_BUILD","Cost of Build","构建成本","开发/材料/时间。","控制成本。","失控。","半年没出 MVP。",["切片"]),
  c("FAILURE_MODE","Failure Mode","失败模式","最可能在哪坏。","预测失败。","未预案。","上线全挂。",["FMEA"]),
  c("REDUNDANCY","Redundancy","冗余","备份/容错。","关键冗余。","无冗余。","单人维护核心。",["双人"]),
  c("INTERFACE_CLARITY","Interface Clarity","接口清晰度","模块/人/系统连接。","契约清晰。","隐式耦合。","参数靠口口相传。",["契约化"]),
  c("SCALABILITY","Scalability","扩展性","从小到大扩展。","架构留口。","推不动量。","10 用户即崩。",["压测"]),
];
