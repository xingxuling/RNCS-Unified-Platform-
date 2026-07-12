// Aether Record Center · 事件构造器：所有来源统一通过这里生成 RecordEvent。
import type {
  RecordEvent,
  RecordEventType,
  RecordRelatedIds,
  RecordStatus,
  RecordSafetyStatus,
} from "./recordCenterTypes";
import { sanitizeRecordText } from "./recordCenterSafetyPolicy";
import { decorateEventScore } from "./recordEventImportanceScorer";

export interface BuildEventInput {
  eventType: RecordEventType;
  sourceModule: string;
  title: string;
  summary?: string;
  relatedIds?: RecordRelatedIds;
  status?: RecordStatus;
  safetyStatus?: RecordSafetyStatus;
  qaStatus?: string;
  tags?: string[];
  confidence?: number;
  canVerify?: boolean;
  expectedOutcome?: string;
  verificationDueAt?: string;
  userPinned?: boolean;
  relatedLegacyP0?: boolean;
}

function newId(): string {
  return `REC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRecordEvent(input: BuildEventInput): RecordEvent {
  const titleSan = sanitizeRecordText(input.title, 120);
  const summarySan = sanitizeRecordText(input.summary || "", 280);

  // 合并安全状态：取最严格
  const explicit = input.safetyStatus;
  let safety: RecordSafetyStatus = "PASS";
  for (const s of [explicit, titleSan.safetyStatus, summarySan.safetyStatus]) {
    if (s === "BLOCK") safety = "BLOCK";
    else if (s === "WARN" && safety !== "BLOCK") safety = "WARN";
  }

  const status: RecordStatus =
    safety === "BLOCK" ? "BLOCKED" : input.status || "RECORDED";

  const ev: RecordEvent = {
    id: newId(),
    eventType: input.eventType,
    sourceModule: input.sourceModule,
    title: titleSan.safe || input.eventType,
    summary: summarySan.safe,
    relatedIds: input.relatedIds || {},
    status,
    importance: 0,
    confidence: input.confidence ?? 0,
    safetyStatus: safety,
    qaStatus: input.qaStatus,
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    canVerify: input.canVerify,
    expectedOutcome: input.expectedOutcome,
    verificationDueAt: input.verificationDueAt,
    verificationStatus: input.canVerify ? "PENDING" : undefined,
    reuseCount: 0,
    decayScore: 0,
    userPinned: input.userPinned,
  };

  decorateEventScore(ev, {
    userPinned: input.userPinned,
    relatedLegacyP0: input.relatedLegacyP0,
  });
  return ev;
}
