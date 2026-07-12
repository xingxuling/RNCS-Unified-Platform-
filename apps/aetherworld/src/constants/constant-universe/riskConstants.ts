// Constant Universe v0.2 — Risk Constants
export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskConstant {
  riskId: string;
  riskName: string;
  chineseName: string;
  severityDefault: RiskSeverity;
  triggerPatterns: string[];
  requiredMitigation: string[];
}

export const RISK_CONSTANTS: RiskConstant[] = [
  { riskId: "REALITY_CONFUSION", riskName: "Reality Confusion", chineseName: "虚拟/现实混淆", severityDefault: "CRITICAL",
    triggerPatterns: ["世界事实=现实事实", "虚拟历史=史实"], requiredMitigation: ["显式标注虚拟", "不输出现实指令"] },
  { riskId: "DEMO_REAL_LEAKAGE", riskName: "Demo/Real Leakage", chineseName: "Demo/Real 泄露", severityDefault: "CRITICAL",
    triggerPatterns: ["Demo 输出标记为 Real", "Real 数据写入 Demo"], requiredMitigation: ["Subject Mode Gate", "强制隔离"] },
  { riskId: "FULL60_PRIVACY_LEAK", riskName: "Full60 Privacy Leak", chineseName: "Full60 隐私泄露", severityDefault: "CRITICAL",
    triggerPatterns: ["Full60 数据上传", "Full60 公开导出"], requiredMitigation: ["本地私密", "强警告确认"] },
  { riskId: "FINANCIAL_MISREPRESENTATION", riskName: "Financial Misrepresentation", chineseName: "金融误述", severityDefault: "CRITICAL",
    triggerPatterns: ["内部积分=现金", "可投资资产"], requiredMitigation: ["内部锁定", "非金融声明"] },
  { riskId: "MEDICAL_LEGAL_FINANCIAL_OVERCLAIM", riskName: "Medical/Legal/Financial Overclaim", chineseName: "医法金过度承诺", severityDefault: "CRITICAL",
    triggerPatterns: ["医疗诊断", "法律建议", "投资建议"], requiredMitigation: ["免责声明", "拒绝输出"] },
  { riskId: "WORLD_AS_REALITY", riskName: "World as Reality", chineseName: "虚拟世界当现实", severityDefault: "CRITICAL",
    triggerPatterns: ["世界事件写入现实日志"], requiredMitigation: ["虚拟标签"] },
  { riskId: "BLACKBOX_AS_FACT", riskName: "Blackbox as Fact", chineseName: "黑箱当事实", severityDefault: "HIGH",
    triggerPatterns: ["未标注黑箱", "未标注不确定"], requiredMitigation: ["黑箱标记", "validation 点"] },
  { riskId: "ENGINE_OVERCLAIM", riskName: "Engine Overclaim", chineseName: "引擎过度宣称", severityDefault: "HIGH",
    triggerPatterns: ["替代 Unity/Godot/Unreal"], requiredMitigation: ["定位声明"] },
  { riskId: "UNBOUNDED_GENERATION", riskName: "Unbounded Generation", chineseName: "无限生成", severityDefault: "HIGH",
    triggerPatterns: ["无 tick 上限", "无 NPC 上限"], requiredMitigation: ["读取常数上限"] },
  { riskId: "USER_IDENTITY_OVERASSERTION", riskName: "User Identity Overassertion", chineseName: "用户身份过度断言", severityDefault: "HIGH",
    triggerPatterns: ["断言用户私人事实"], requiredMitigation: ["概率措辞"] },
];
