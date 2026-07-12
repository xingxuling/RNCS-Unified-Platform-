export interface CompressionSafetyRule {
  id: string;
  label: string;
  rule: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const COMPRESSION_SAFETY_RULES: CompressionSafetyRule[] = [
  { id: "NO_BLACKBOX_AS_FACT",  label: "黑箱不得伪装为事实",   rule: "黑箱信号只能作为判断摘要，必须标记为信号。",     severity: "HIGH" },
  { id: "KEEP_CRITICAL_RISK",   label: "保留关键风险",         rule: "高风险输出必须保留 safetyNotes。",                severity: "CRITICAL" },
  { id: "KEEP_NEXT_ACTIONS",    label: "保留下一步",           rule: "压缩输出必须保留至少 1 个 nextAction。",          severity: "HIGH" },
  { id: "KEEP_VALIDATION",      label: "保留验证点",           rule: "压缩输出必须保留至少 1 个 validationPoint。",     severity: "MEDIUM" },
  { id: "ISOLATE_FOUNDER",     label: "Founder Trace 隔离",   rule: "普通用户不得看到 Founder Trace。",                severity: "HIGH" },
  { id: "ISOLATE_DEMO_REAL",    label: "Demo / Real 隔离",     rule: "Demo 输出不得压缩为 Real 结论。",                 severity: "HIGH" },
  { id: "MARK_FICTION",         label: "标记虚构设定",         rule: "虚构内容必须标记。",                              severity: "HIGH" },
  { id: "REQUIRE_SOURCE",       label: "现实事实需要来源",     rule: "无来源不得标 VERIFIED。",                          severity: "HIGH" },
  { id: "NO_PROMISE",           label: "不承诺",               rule: "不得把预测/直觉写成保证。",                       severity: "HIGH" },
  { id: "TRANSLATE_AFTER",      label: "先压缩后翻译",         rule: "避免长 trace 翻译漂移。",                          severity: "LOW" },
];
