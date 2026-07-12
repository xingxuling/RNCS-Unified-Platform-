// 代码生成安全规则 Code Safety Rules
export interface CodeSafetyRule {
  id: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "CRITICAL";
  patternHints: string[]; // 提示词或目标文件中若出现这些片段则触发
}

export const CODE_SAFETY_RULES: CodeSafetyRule[] = [
  { id: "NO_DELETE_SUBJECT", description: "不要删除现有主体数据。", severity: "CRITICAL",
    patternHints: ["删除所有主体", "delete subjects", "clearAll(", "drop subjects"] },
  { id: "DEMO_REAL_ISOLATION", description: "不要破坏 Demo/Real 隔离。", severity: "CRITICAL",
    patternHints: ["混合 demo", "merge real and demo"] },
  { id: "NO_PLAIN_FOUNDER_PASSWORD", description: "不要明文存储 Founder Password。", severity: "CRITICAL",
    patternHints: ["plain password", "founderPassword =", "明文密码"] },
  { id: "NO_FULL60_PUBLIC", description: "不要公开 Full 60 数据。", severity: "HIGH",
    patternHints: ["公开 full 60", "expose full60", "share full sequence"] },
  { id: "KEEP_SAFETY_BOUNDARY", description: "不要移除 Safety Boundary 文案。", severity: "HIGH",
    patternHints: ["删除 safety", "remove safety boundary", "去掉免责"] },
  { id: "FOUNDER_ONLY", description: "Founder-only 模块不可对普通用户开放。", severity: "HIGH",
    patternHints: ["对所有用户显示 founder", "remove founder gate"] },
  { id: "PHYSICAL_CONSTANT_EXPERIMENTAL", description: "实验性物理常数不可标记为已验证。", severity: "MEDIUM",
    patternHints: ["mark physical as validated", "去掉实验性标记"] },
  { id: "NO_ACCURACY_GUARANTEE", description: "不要把准确率目标写成已验证保证。", severity: "HIGH",
    patternHints: ["保证准确率", "guaranteed accuracy", "100% accurate"] },
  { id: "NO_DELETE_FEEDBACK", description: "不要删除回验记录。", severity: "CRITICAL",
    patternHints: ["delete all feedback", "清空回验"] },
  { id: "NO_OVERRIDE_EVENT_ID", description: "不要覆盖已有 eventId。", severity: "HIGH",
    patternHints: ["overwrite eventId", "覆盖事件 id"] },
  { id: "NO_REWRITE_ENTIRE_PROJECT", description: "不要重写整个项目导致架构漂移。", severity: "CRITICAL",
    patternHints: ["重写整个项目", "rewrite entire project", "重建系统"] },
  { id: "NO_MEDICAL_ABSOLUTES", description: "不要生成医疗/法律/金融绝对建议。", severity: "CRITICAL",
    patternHints: ["保证治愈", "投资必赚", "法律一定", "确诊"] },
];

export function scanCodeRisks(text: string): { rule: CodeSafetyRule; matched: string }[] {
  const lower = text.toLowerCase();
  const hits: { rule: CodeSafetyRule; matched: string }[] = [];
  for (const rule of CODE_SAFETY_RULES) {
    for (const p of rule.patternHints) {
      if (lower.includes(p.toLowerCase()) || text.includes(p)) {
        hits.push({ rule, matched: p });
        break;
      }
    }
  }
  return hits;
}

export const DEFAULT_DO_NOT_BREAK = [
  "Demo / Real 隔离",
  "Constant Universe v1.0",
  "Event Universe",
  "Prompt Forge",
  "Product Encyclopedia",
  "Founder Mode 权限",
  "Software QA",
  "Recalculation",
  "Safety Boundary",
  "Virtual World OS",
  "Beginner Mode",
];
