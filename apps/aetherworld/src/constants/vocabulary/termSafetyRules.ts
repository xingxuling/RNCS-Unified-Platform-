/**
 * 词汇安全规则：禁止把虚构 / 内部 / 系统概念误写成现实事实。
 * 任何词条定义、翻译、用法示例都不能违反这些边界。
 */
export const TERM_SAFETY_RULES = [
  {
    id: "NO_REAL_CURRENCY",
    label: "数列货币不是现实货币",
    pattern: /(数列货币|sequence currency).*(现实货币|提现|cash|withdraw|legal tender)/i,
    severity: "CRITICAL",
    message: "数列货币是产品内部价值单位，不可写成现实可提现货币。",
  },
  {
    id: "NO_REAL_PHYSICS",
    label: "常数宇宙不是现实物理定律",
    pattern: /(常数宇宙|constant universe).*(现实(物理|宇宙)|laws? of physics|natural law)/i,
    severity: "HIGH",
    message: "常数宇宙是产品内部系统常数治理层，不代表真实物理定律。",
  },
  {
    id: "NO_REAL_LAW",
    label: "系统宪法不是现实法律",
    pattern: /(系统宪法|system constitution).*(现实法律|国家法律|具有法律效力|legally binding)/i,
    severity: "HIGH",
    message: "系统宪法是产品治理文档，不具有现实法律效力。",
  },
  {
    id: "NO_REAL_PREDICTION",
    label: "世界模拟不是现实预测",
    pattern: /(世界模拟|world simulation).*(现实预测|绝对预测|保证发生)/i,
    severity: "HIGH",
    message: "世界模拟是虚构世界的内部演化，不构成现实预测。",
  },
  {
    id: "NO_REAL_PHYSICS_RENDER",
    label: "语义物理不是真实物理仿真",
    pattern: /(语义物理|semantic physics).*(真实物理|真实仿真|真实牛顿)/i,
    severity: "MEDIUM",
    message: "语义物理是叙事级近似，不是科学级物理仿真。",
  },
  {
    id: "NO_DEMO_AS_REAL",
    label: "Demo 不可被当成 Real",
    pattern: /demo.*\b(real|真实主体)\b/i,
    severity: "HIGH",
    message: "Demo Mode 输出不能被标记为 Real Subject 输出。",
  },
  {
    id: "NO_FULL60_PUBLIC",
    label: "Full60 不可作为公开数据",
    pattern: /full60.*(公开数据|public data|对外公开)/i,
    severity: "CRITICAL",
    message: "Full60 默认 USER_PRIVATE，不可标记为公开数据。",
  },
  {
    id: "NO_BLACKBOX_AS_FACT",
    label: "黑箱信号不是确定事实",
    pattern: /(黑箱|black ?box).*(确定事实|确定结论|绝对正确)/i,
    severity: "MEDIUM",
    message: "黑箱信号属于不可解释输出，不能写成确定事实。",
  },
  {
    id: "NO_OMNIPOTENT_CALCULUS",
    label: "计算法不是万能方法",
    pattern: /(计算法|calculus).*(解决一切|万能|绝对|guaranteed)/i,
    severity: "MEDIUM",
    message: "计算法是结构化方法，不承诺解决一切问题。",
  },
] as const;

export type TermSafetySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
