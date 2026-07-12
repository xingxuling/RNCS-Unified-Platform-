export interface ModelSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const MODEL_SAFETY_RULES: ModelSafetyRule[] = [
  { id: "NO_ABSOLUTE",        description: "禁止输出『模型绝对正确』『无需验证』等断言",           severity: "CRITICAL" },
  { id: "NO_PROFESSIONAL",    description: "不得替代医疗 / 法律 / 金融 / 心理 / 工程安全 专业模型", severity: "CRITICAL" },
  { id: "REQUIRE_VALIDATION", description: "每个模型必须包含 validationPlan",                       severity: "HIGH"     },
  { id: "FULL60_PRIVACY",     description: "Full 60 模式生成模型时必须提示隐私",                    severity: "HIGH"     },
  { id: "NO_AUTO_UPLOAD",     description: "不自动上传模型数据",                                    severity: "HIGH"     },
  { id: "NO_PREDICTION_FACT", description: "不得把推测字段写成事实字段",                            severity: "CRITICAL" },
  { id: "NAMING_CLARITY",     description: "字段命名应清晰、避免模糊",                              severity: "MEDIUM"   },
  { id: "NO_BLOAT",           description: "避免无意义膨胀字段",                                    severity: "LOW"      },
];

export const MODEL_DISCLAIMER = [
  "模型生成引擎生成的是结构化模型，不是事实证明。",
  "模型字段、权重和回验计划需要现实验证。",
  "涉及医疗、法律、金融、投资、心理诊断、工程安全等高风险领域时，模型只能作为整理参考，不能替代专业判断。",
  "系统不会保证生成模型一定正确、一定有效或一定商业成功。",
];
