import type { VersionChangeRecord } from "./versionChangeDetector";
import type { VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";

export interface RollbackPlan {
  targetVersion: string;
  rollbackSteps: string[];
  dataRisk: string[];
  safeToRollback: boolean;
}

export function planRollback(
  targetVersion: string,
  level: VersionLeapLevel,
  changes: VersionChangeRecord[],
): RollbackPlan {
  const risks: string[] = [];
  const types = new Set(changes.map((c) => c.changeType));
  if (types.has("DATA_STRUCTURE_UPDATE")) risks.push("存在数据结构变更，回滚后旧版本可能无法读取新结构。");
  if (types.has("EXPORT_FORMAT_UPDATE")) risks.push("导出格式发生变化。");
  if (types.has("CONSTANT_UPDATE")) risks.push("常数版本变更，回滚后定数会回到旧版本。");
  if (types.has("CONSTITUTION_UPDATE")) risks.push("宪法版本回滚需要 Founder 审批。");
  if (types.has("SUBJECT_MODE_UPDATE")) risks.push("主体模式默认值变更，回滚后用户主体设置可能不一致。");

  const safe = level !== "GENERATION" && !types.has("ARCHITECTURE_CHANGE");

  const steps: string[] = [
    `定位目标版本 ${targetVersion}`,
    "锁定当前版本写入",
    "备份本地 sequence_storage / subject_profile / preferences",
    "回滚 routeTree / sidebar / constants 注册表到目标版本",
    "重新运行 Software QA、Interface Audit、Text Audit、Docs Audit",
    "通知 Founder & 公测用户",
  ];

  return { targetVersion, rollbackSteps: steps, dataRisk: risks, safeToRollback: safe };
}
