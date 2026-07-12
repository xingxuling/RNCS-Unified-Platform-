export interface CreationRiskType {
  id: string;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedDomain: string;
}

export const CREATION_RISK_TYPES: CreationRiskType[] = [
  { id: "MATERIAL_CONSTRAINT", label: "材料限制", description: "材料不可得或成本过高。", severity: "MEDIUM", relatedDomain: "DIGITAL_ENGINEERING" },
  { id: "ENERGY_CONSTRAINT", label: "能量限制", description: "能耗/散热不可控。", severity: "HIGH", relatedDomain: "DIGITAL_PHYSICS" },
  { id: "USER_MISFIT", label: "用户错配", description: "目标用户与设计不匹配。", severity: "HIGH", relatedDomain: "DIGITAL_SOCIOLOGY" },
  { id: "ENVIRONMENTAL_RESISTANCE", label: "环境阻力", description: "平台/制度/文化阻力。", severity: "MEDIUM", relatedDomain: "DIGITAL_GEOGRAPHY" },
  { id: "COMPLEXITY_OVERLOAD", label: "复杂度过载", description: "系统复杂度超过可维护范围。", severity: "HIGH", relatedDomain: "DIGITAL_ENGINEERING" },
  { id: "COST_PRESSURE", label: "成本压力", description: "运行/开发成本失控。", severity: "HIGH", relatedDomain: "DIGITAL_ECONOMICS" },
  { id: "REALITY_RISK", label: "现实风险", description: "涉及安全/医疗/工程/金融需专业验证。", severity: "CRITICAL", relatedDomain: "DIGITAL_SOCIOLOGY" },
  { id: "AESTHETIC_FAILURE", label: "审美失衡", description: "形态混乱或过度。", severity: "LOW", relatedDomain: "DIGITAL_AESTHETICS" },
  { id: "ADOPTION_FAILURE", label: "采用失败", description: "用户不愿意开始使用。", severity: "HIGH", relatedDomain: "DIGITAL_SOCIOLOGY" },
  { id: "MISREAD_AS_REAL_SIM", label: "误读为真实仿真", description: "用户把结构化推演误当真实工程仿真。", severity: "CRITICAL", relatedDomain: "DIGITAL_INFORMATION" },
];

export const CREATION_REALITY_BOUNDARY_TEXT =
  "现实科学宇宙常数是结构化抽象层，不等同于真实专业仿真。虚拟创造物计算法用于早期设计推演、可行性判断、风险识别与路线规划。涉及医疗、工程安全、建筑、硬件量产、法律、金融、投资等高风险领域，必须咨询对应专业人士。本系统不能承诺某创造物一定可行、一定赚钱、一定安全或一定成功。";

export const CREATION_FORBIDDEN_PHRASES = [
  "保证可行", "100%成功", "100% 成功", "取代工程验证",
  "取代医学", "取代法律", "取代金融", "直接量产", "绝对安全",
];
