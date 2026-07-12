export type CompressionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CompressionRiskType {
  id: string;
  label: string;
  level: CompressionRiskLevel;
  description: string;
}

export const COMPRESSION_RISK_TYPES: CompressionRiskType[] = [
  { id: "BLACKBOX_AS_FACT",   label: "黑箱伪装事实",      level: "HIGH",     description: "黑箱信号被表述为可验证事实。" },
  { id: "HIDDEN_CRITICAL",    label: "隐藏关键风险",      level: "CRITICAL", description: "为了简短删除高风险说明。" },
  { id: "OVER_SIMPLIFY",      label: "过度简化",          level: "MEDIUM",   description: "导致误导的简化。" },
  { id: "MISSING_ACTIONS",    label: "缺失下一步",        level: "HIGH",     description: "压缩后没有可执行动作。" },
  { id: "MISSING_VALIDATION", label: "缺失验证点",        level: "MEDIUM",   description: "压缩后没有回验。" },
  { id: "LEAK_FOUNDER_TRACE", label: "泄露 Founder Trace", level: "HIGH",    description: "普通用户看到 Founder 内部信息。" },
  { id: "DEMO_AS_REAL",       label: "Demo 写成 Real",    level: "HIGH",     description: "Demo 输出被压缩成 Real 结论。" },
  { id: "FICTION_AS_FACT",    label: "虚构写成事实",      level: "HIGH",     description: "虚构设定被压缩成现实事实。" },
  { id: "UNSOURCED_CLAIM",    label: "无来源现实断言",    level: "HIGH",     description: "现实事实压缩后失去来源。" },
  { id: "CONCEPT_OVERLOAD",   label: "概念过载",          level: "LOW",      description: "压缩后仍堆叠术语。" },
];
