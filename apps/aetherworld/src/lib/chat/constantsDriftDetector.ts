// 常数漂移检测：扫描模型输出中是否引用了不存在的枚举值。
// 仅做启发式检测；命中"标签: VALUE"或"VALUE 状态"等结构时校验。
import type { ConstantsDriftReport } from "./calculusRouteResultTypes";
import { ALLOWED_ENUMS } from "./constantsPromptConstraintBridge";

interface FieldSpec {
  field: string;
  allowed: readonly string[];
  patterns: RegExp[];
}

const SPECS: FieldSpec[] = [
  {
    field: "RISK_LABEL",
    allowed: ALLOWED_ENUMS.RISK_LABEL,
    patterns: [/RISK_LABEL\s*[:：]\s*([A-Z_]+)/g, /风险等级\s*[:：]\s*([A-Z_]+)/g],
  },
  {
    field: "QA_STATUS",
    allowed: ALLOWED_ENUMS.QA_STATUS,
    patterns: [/QA_STATUS\s*[:：]\s*([A-Z_]+)/g, /QA\s*状态\s*[:：]\s*([A-Z_]+)/g],
  },
  {
    field: "SOCIAL_VISIBILITY",
    allowed: ALLOWED_ENUMS.SOCIAL_VISIBILITY,
    patterns: [/SOCIAL_VISIBILITY\s*[:：]\s*([A-Z_]+)/g, /可见性\s*[:：]\s*([A-Z_]+)/g],
  },
  {
    field: "AUTHORITY_LEVEL",
    allowed: ALLOWED_ENUMS.AUTHORITY_LEVEL,
    patterns: [/AUTHORITY_LEVEL\s*[:：]\s*([A-Z_]+)/g, /权限等级\s*[:：]\s*([A-Z_]+)/g],
  },
];

export function detectConstantsDrift(text: string): ConstantsDriftReport {
  const unknown: { field: string; value: string }[] = [];
  for (const spec of SPECS) {
    for (const re of spec.patterns) {
      let m: RegExpExecArray | null;
      const cloned = new RegExp(re.source, re.flags);
      while ((m = cloned.exec(text)) !== null) {
        const value = m[1];
        if (value && !spec.allowed.includes(value)) {
          unknown.push({ field: spec.field, value });
        }
      }
    }
  }
  let severity: ConstantsDriftReport["severity"] = "NONE";
  if (unknown.length === 1) severity = "MINOR";
  else if (unknown.length > 1) severity = "SEVERE";

  return {
    severity,
    unknownEnums: unknown,
    notes:
      severity === "NONE"
        ? ["未检测到常数漂移。"]
        : [`检测到 ${unknown.length} 处未注册枚举值，建议复核。`],
  };
}
