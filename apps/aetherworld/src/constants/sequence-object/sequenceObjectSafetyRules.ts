export interface SequenceObjectSafetyRule {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const SEQUENCE_OBJECT_SAFETY_RULES: SequenceObjectSafetyRule[] = [
  { id: "SOA-001", title: "对象 ≠ 现实事实", description: "数列生成的对象是系统种子，不等于现实绝对事实。", severity: "CRITICAL" },
  { id: "SOA-002", title: "模型对象 ≠ 已验证科学", description: "MODEL_OBJECT 未经验证记录不得标记为 VERIFIED。", severity: "CRITICAL" },
  { id: "SOA-003", title: "系统对象 ≠ 已生产部署", description: "SYSTEM/ENGINE_OBJECT 未通过 QA 与 Contract 不得视为生产系统。", severity: "CRITICAL" },
  { id: "SOA-004", title: "文明对象 ≠ 现实法律", description: "CONSTITUTION/GOVERNANCE_OBJECT 仅为系统宪法，不是现实法律。", severity: "CRITICAL" },
  { id: "SOA-005", title: "常数宇宙 ≠ 物理定律", description: "CONSTANT_UNIVERSE_OBJECT 不得被解释为自然物理定律。", severity: "CRITICAL" },
  { id: "SOA-006", title: "数列货币 ≠ 金融资产", description: "Currency 相关对象保持 non-financial boundary。", severity: "CRITICAL" },
  { id: "SOA-007", title: "虚拟世界 ≠ 现实预测", description: "WORLD/MULTIWORLD_OBJECT 不得被当作现实预测。", severity: "CRITICAL" },
  { id: "SOA-008", title: "Demo / Real 隔离", description: "Demo 对象不得写入 Real，Real 对象不得回写 Demo。", severity: "CRITICAL" },
  { id: "SOA-009", title: "Founder 隔离", description: "FOUNDER_PRIVATE 对象不得公开。", severity: "CRITICAL" },
  { id: "SOA-010", title: "Runtime 必须有 Contract", description: "RUNTIME_LAYER 对象没有 Runtime Contract 不得 ACTIVE。", severity: "HIGH" },
  { id: "SOA-011", title: "Engine 必须有 QA", description: "ENGINE_OBJECT 未经 QA 不得 READY。", severity: "HIGH" },
  { id: "SOA-012", title: "Civilization 必须有治理", description: "CIVILIZATION_LAYER 对象必须有治理与封存规则。", severity: "HIGH" },
  { id: "SOA-013", title: "最小运行原则", description: "运行契约默认最小影响、最短时间、最低不可逆性。", severity: "MEDIUM" },
  { id: "SOA-014", title: "防反噬", description: "CLM 复审防止创造物反噬创造者。", severity: "MEDIUM" },
];

export const SEQUENCE_OBJECT_SAFETY_NOTE =
  "数列对象架构引擎用于将母体数列、MSL、用户输入和引擎输出转化为 Aetherworld 内部可识别、可保存、可复用和可治理的对象。生成对象不等于现实事实、科学验证、生产部署、现实法律或金融资产。系统对象、模型对象、引擎对象和文明对象必须经过运行契约、QA、系统宪法和生命周期治理后，才能进入更高权限状态。";
