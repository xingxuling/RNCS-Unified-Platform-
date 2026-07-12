export interface TerminalSafetyRule {
  id: string;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const TERMINAL_SAFETY_RULES: TerminalSafetyRule[] = [
  { id: "NO_PRIVILEGE_ESCALATION", label: "禁止越权执行",     description: "不允许在非创始人模式运行 founder.* 命令。", severity: "CRITICAL" },
  { id: "NO_PRIVATE_EXPORT",       label: "保护私有数据",     description: "USER_PRIVATE / Full60 数据导出必须显式确认。", severity: "HIGH" },
  { id: "NO_DEMO_REAL_MIX",        label: "Demo / Real 隔离", description: "Demo 模式不可读取 Real 数据，反之亦然。", severity: "HIGH" },
  { id: "NO_REAL_WORLD_ACTION",    label: "不执行现实动作",   description: "终端命令不会执行支付、发送、调用真实 API。", severity: "MEDIUM" },
  { id: "NO_MEDICAL_LEGAL",        label: "不做医疗 / 法律 / 金融判断", description: "不输出诊断、处方、合同结论或投资指令。", severity: "HIGH" },
  { id: "NO_DANGEROUS_CODE",       label: "拒绝危险代码生成", description: "不生成可直接造成数据丢失 / 攻击的代码。", severity: "HIGH" },
  { id: "NO_LORE_AS_FACT",         label: "区分虚构与现实",   description: "不可把 FICTIONAL_LORE 当 REAL_WORLD_FACT 输出。", severity: "MEDIUM" },
  { id: "NO_PREDICTION_GUARANTEE", label: "不承诺预测准确",   description: "MSL / Sequence AI 输出为推演，不等同事实。", severity: "MEDIUM" },
  { id: "EXPORT_METADATA",         label: "导出必须带 metadata", description: "所有导出附带 exportedAt / subjectMode / privacy / safetyNotes。", severity: "MEDIUM" },
  { id: "AMBIGUOUS_TARGET",        label: "拒绝模糊命令",     description: "目标对象不明确的命令必须被拦截或要求澄清。", severity: "LOW" },
];

export const TERMINAL_SAFETY_FOOTER = `数列终端用于高级用户和创始人以命令方式调用 Aetherworld 的 MSL、Sequence AI、世界引擎、模型生成、剧情、声乐、翻译、知识库、QA 与重算能力。终端不会执行现实动作，不会保证预测一定准确，不替代医疗、法律、金融、心理诊断或专业工程判断。Full60 与私有主体数据导出前需确认。`;
