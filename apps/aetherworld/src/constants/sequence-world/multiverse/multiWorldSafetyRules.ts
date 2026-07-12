export interface MultiWorldSafetyRule {
  id: string;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const MULTI_WORLD_SAFETY_RULES: MultiWorldSafetyRule[] = [
  { id: "VIRTUAL_NOT_REAL", label: "虚拟世界不是现实", description: "所有多世界结构、门户与事件仅是虚拟系统，不代表现实行动或事实。", severity: "CRITICAL" },
  { id: "NO_REAL_ASSET", label: "多世界资源非现实资产", description: "跨世界资源/贸易/联邦资产不可金融化，不能兑现。", severity: "CRITICAL" },
  { id: "FULL60_PRIVATE", label: "Full60 世界默认私有", description: "Full60 来源的个人世界默认仅本地保存，加入网络前需用户确认。", severity: "HIGH" },
  { id: "DEMO_REAL_ISOLATION", label: "Demo 与 Real 隔离", description: "Demo 世界不可污染 Real 世界数据。", severity: "CRITICAL" },
  { id: "FOUNDER_LOCKED_PROTECTED", label: "Founder Locked 不可普通修改", description: "Founder-only 世界 / 正典 / 联邦 仅 Founder 可操作。", severity: "CRITICAL" },
  { id: "NO_INFINITE_WORLD_GROWTH", label: "禁止无限创建世界", description: "maxWorlds 必须存在；默认上限 7。", severity: "HIGH" },
  { id: "NO_VIOLENCE_GUIDE", label: "多世界冲突不输出现实暴力指导", description: "MULTI_WORLD_CONFLICT 仅作为结构事件描述。", severity: "HIGH" },
  { id: "PRIVACY_NO_LEAK", label: "禁止隐私泄露", description: "Full60 世界数据不得自动同步公开。", severity: "CRITICAL" },
  { id: "PORTAL_NOT_REAL_ACTION", label: "世界门户不是现实行动建议", description: "门户开启/进入仅为虚拟事件。", severity: "MEDIUM" },
  { id: "EXPORT_METADATA_REQUIRED", label: "导出需保留 metadata", description: "导出包必须含 source/version/subjectMode/privacyNotes。", severity: "MEDIUM" },
];
