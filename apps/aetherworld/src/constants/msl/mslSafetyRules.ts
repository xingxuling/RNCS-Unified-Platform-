export interface MSLSafetyRule {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  forbidden: string[];
  recommended: string;
}

export const MSL_SAFETY_RULES: MSLSafetyRule[] = [
  {
    id: "no-direct-reality",
    severity: "CRITICAL",
    forbidden: ["运行数列即可改变现实", "数列绝对决定现实", "执行 MSL 即改变命运"],
    recommended: "MSL 是状态驱动语言，仅用于状态建模与世界逻辑编译，需现实验证与工程执行。",
  },
  {
    id: "no-replace-engine",
    severity: "HIGH",
    forbidden: ["MSL 替代 Unity", "MSL 替代 Godot", "MSL 替代真实编程语言"],
    recommended: "MSL 编译为 JSON / 描述，作为现有引擎与编程语言的输入层。",
  },
  {
    id: "full60-privacy",
    severity: "HIGH",
    forbidden: [],
    recommended: "输入 Full 60 数列时显示隐私提示：包含完整主体信息，请勿外传。",
  },
  {
    id: "compile-must-have-trace",
    severity: "MEDIUM",
    forbidden: [],
    recommended: "编译输出必须附 trace 与 safetyNotes。",
  },
];

export const MSL_BOUNDARY_NOTE =
  "MSL 是一种状态驱动语言，用于状态建模、世界逻辑生成、引擎参数与结构推演。" +
  "它不执行现实、不控制现实，也不能替代专业编程语言或物理仿真。";
