// System Constitution v0.2 — Founder Rights
export interface FounderRight {
  rightId: string;
  title: string;
  type: "POWER" | "RESTRICTION";
  description: string;
  auditRequired: boolean;
}

export const FOUNDER_RIGHTS: FounderRight[] = [
  { rightId: "FP_LOCK_CONSTANT", title: "锁定常数", type: "POWER", description: "可将实验常数锁定为 STATIC。", auditRequired: true },
  { rightId: "FP_LOCK_ARTICLE", title: "锁定宪法条款", type: "POWER", description: "可设置 founderLocked=true。", auditRequired: true },
  { rightId: "FP_EDIT_EXPERIMENTAL", title: "修改实验常数", type: "POWER", description: "可调整 EXPERIMENTAL 常数。", auditRequired: true },
  { rightId: "FP_RUN_AUDIT", title: "运行系统审计", type: "POWER", description: "执行 Software QA 与 Constitutional Compliance。", auditRequired: true },
  { rightId: "FP_EXPORT_FULL", title: "导出完整系统报告", type: "POWER", description: "包含 Founder Trace 的完整导出。", auditRequired: true },
  { rightId: "FP_VIEW_TRACE", title: "查看 Founder Trace", type: "POWER", description: "查看引擎 trace、黑箱信号、白箱依据。", auditRequired: true },
  { rightId: "FP_LOCK_CANON", title: "锁定世界正典", type: "POWER", description: "Canon 锁定后普通用户不可修改。", auditRequired: true },
  { rightId: "FP_REGISTER_ENGINE", title: "注册新引擎", type: "POWER", description: "向 Engine Registry 注册新模块。", auditRequired: true },
  { rightId: "FP_PUBLISH_AMENDMENT", title: "发布宪法修订", type: "POWER", description: "创建新版本并触发 Recalculation。", auditRequired: true },

  { rightId: "FR_NO_PRIVACY_BYPASS", title: "不得绕过隐私提示", type: "RESTRICTION", description: "Full60 隐私提示不得跳过。", auditRequired: true },
  { rightId: "FR_NO_SAFETY_OFF", title: "不得关闭核心 Safety", type: "RESTRICTION", description: "Safety Boundary 必须始终启用。", auditRequired: true },
  { rightId: "FR_NO_CURRENCY_FINANCIALIZE", title: "不得金融化货币", type: "RESTRICTION", description: "数列货币非金融边界不可破。", auditRequired: true },
  { rightId: "FR_NO_VIRTUAL_AS_REAL", title: "不得把虚拟世界标为现实", type: "RESTRICTION", description: "World Engine 输出不可标 REAL_WORLD_FACT。", auditRequired: true },
  { rightId: "FR_NO_AUDIT_PURGE", title: "不得删审计不留痕", type: "RESTRICTION", description: "审计日志只能追加。", auditRequired: true },
  { rightId: "FR_NO_SILENT_FOUNDER_DATA", title: "不得让普通用户无提示使用 Founder-only 数据", type: "RESTRICTION", description: "Founder-only 数据必须显式标记。", auditRequired: true },
];
