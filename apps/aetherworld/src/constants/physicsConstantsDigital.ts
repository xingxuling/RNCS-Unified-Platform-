// 通用现实科学常数结构
export interface RealityScienceConstant {
  id: string;
  name: string;
  userFriendlyName: string;
  meaning: string;
  positiveUse: string;
  risk: string;
  example: string;
  relatedActions: string[];
}

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const PHYSICS_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("INERTIA","Inertia","惯性","对象保持原状态的倾向。","顺势放大已成立动作。","低估老用户行为惯性。","旧用户难迁新功能。",["顺势接入","小步替换"]),
  c("RESISTANCE","Resistance","阻力","推动变化所遇到的阻碍。","识别后绕开或减小。","硬推导致反弹。","新功能反对声很大。",["调研","试点"]),
  c("MOMENTUM","Momentum","动量","已积累的推进力。","利用势头加速。","势头过大无法收。","内测人数失控。",["顺势放量","保留闸门"]),
  c("THRESHOLD","Threshold","阈值","从不发生到发生的临界点。","降低首次门槛。","门槛过高首步失败。","注册流程过长。",["简化首步"]),
  c("ENTROPY","Entropy","熵","系统混乱度与维护成本。","定期清理收口。","熵堆积导致系统死亡。","功能堆叠无人维护。",["熵清理日","归档"]),
  c("PRESSURE","Pressure","压力","推动变化的压强。","用压力推动决断。","压力崩盘。","截止时间过紧。",["分阶段截止"]),
  c("FRICTION","Friction","摩擦","使用/理解/制造摩擦力。","主动磨平。","用户跑路。","操作 4 步以上。",["合并步骤"]),
  c("LOAD","Load","负载","系统当前承载压力。","控制并发。","过载崩溃。","团队人均 8 项目。",["削峰","排队"]),
  c("PHASE_TRANSITION","Phase Transition","相变","状态跃迁。","识别相变点。","错过相变。","Demo→Real 切换失败。",["相变检查清单"]),
  c("FEEDBACK_DELAY","Feedback Delay","反馈延迟","行动到结果的延迟。","缩短回路。","延迟导致误判。","上线 3 月才知是否成立。",["短周期实验"]),
];
