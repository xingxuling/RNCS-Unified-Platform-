export interface ObjectPhase {
  id: string;
  name: string;
  description: string;
  allowedActions: string[];
  forbiddenActions: string[];
  nextHint: string;
}

export const OBJECT_PHASES: ObjectPhase[] = [
  { id: "SEED",      name: "种子期", description: "刚出现，方向未定", allowedActions: ["探索","记录"], forbiddenActions: ["大规模投入"], nextHint: "进入成形期需明确核心命名" },
  { id: "FORMING",   name: "成形期", description: "结构开始成型",     allowedActions: ["原型","小测"], forbiddenActions: ["对外承诺"], nextHint: "进入测试期需有可验证假设" },
  { id: "TESTING",   name: "测试期", description: "用真实信号校准",   allowedActions: ["内测","回验"], forbiddenActions: ["扩功能"], nextHint: "进入运行期需稳定核心闭环" },
  { id: "ACTIVE",    name: "运行期", description: "核心闭环稳定运行", allowedActions: ["扩用户","迭代"], forbiddenActions: ["乱改本质"], nextHint: "可考虑增长" },
  { id: "GROWING",   name: "增长期", description: "持续扩张",         allowedActions: ["规模化"], forbiddenActions: ["丢核心"], nextHint: "注意稳定性" },
  { id: "STABLE",    name: "稳定期", description: "稳定运行",         allowedActions: ["优化","维护"], forbiddenActions: ["盲目重构"], nextHint: "警惕过度生长" },
  { id: "OVERGROWN", name: "过度生长期", description: "功能膨胀",     allowedActions: ["精简","聚焦"], forbiddenActions: ["继续加功能"], nextHint: "需回归本质" },
  { id: "FATIGUE",   name: "疲劳期", description: "效率下降",         allowedActions: ["休整","重算"], forbiddenActions: ["透支"], nextHint: "考虑归档或再种子" },
  { id: "ARCHIVE",   name: "归档期", description: "已完成历史使命",   allowedActions: ["归档","总结"], forbiddenActions: ["强行复活"], nextHint: "可封存或再种子" },
  { id: "VOID",      name: "归零期", description: "等待重生",         allowedActions: ["反思"], forbiddenActions: ["仓促重启"], nextHint: "进入再种子" },
  { id: "RESEED",    name: "再种子期", description: "带经验重新出发", allowedActions: ["新原型"], forbiddenActions: ["重复旧错"], nextHint: "回到成形期" },
];

export function resolvePhase(id: string): ObjectPhase {
  return OBJECT_PHASES.find(p => p.id === id) ?? OBJECT_PHASES[0];
}
