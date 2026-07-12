// MSL State Language v0.1 —— Aetherworld 数列状态语言（统一运行状态协议）
// 本文件复用已有 MSL 操作码 / 域常量，不重新发明语言。
// 仅在其上新增「状态帧（StateFrame）」用于跨模块状态描述。

export type MSLFrameType =
  | "CHAT_TURN"
  | "MODEL_CALL"
  | "FUSION_PLAN"
  | "CALCULUS_CHAIN"
  | "TOOL_CALL"
  | "WORKSPACE_OBJECT"
  | "STORE_PACKAGE"
  | "CALENDAR_TRIGGER"
  | "SOCIAL_PUBLISH"
  | "QA_AUDIT"
  | "SEQUENCE_MEMORY"
  | "SEQUENCE_CURRENCY";

export type MSLFrameStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "WARN"
  | "FAILED"
  | "BLOCKED"
  | "FALLBACK";

export type MSLSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface MSLFiveDomainSnapshot {
  heaven?: string;
  earth?: string;
  human?: string;
  spirit?: string;
  wind?: string;
}

export interface MSLStateFrame {
  id: string;
  frameType: MSLFrameType;
  /** 编码后的 MSL 文本（轻量协议） */
  mslCode: string;
  sourceModule: string;

  chatSessionId?: string;
  messageId?: string;
  workspaceObjectId?: string;

  domain?: string;
  calculusIds?: string[];
  engineIds?: string[];
  fiveDomain?: MSLFiveDomainSnapshot;

  status: MSLFrameStatus;
  safetyStatus: MSLSafetyStatus;
  qaStatus?: string;

  valueEventId?: string;
  memoryUnitId?: string;

  /** 校验产生的提示（不会暴露原文） */
  validationNotes?: string[];

  /** 额外结构化字段（避免泄漏原文，仅放摘要 / 标签） */
  meta?: Record<string, string | number | boolean>;

  createdAt: string;
}

export interface MSLBuildAttrs {
  status: MSLFrameStatus;
  safetyStatus?: MSLSafetyStatus;
  qaStatus?: string;
  domain?: string;
  calculusIds?: string[];
  engineIds?: string[];
  fiveDomain?: MSLFiveDomainSnapshot;
  valueEventId?: string;
  memoryUnitId?: string;
  /** 额外键值，会写入 mslCode @kv 段（已做安全过滤） */
  extra?: Record<string, string | number | boolean | undefined>;
}

export function newMslFrameId(): string {
  return `MSL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
