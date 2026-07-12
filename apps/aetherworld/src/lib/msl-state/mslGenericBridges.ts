// 通用桥接器：供 Workspace / Store / Calendar / Social / Audit 等模块写入 MSL 状态帧
// 不重新发明对应系统，只把它们的事件投射为 MSLStateFrame。
import { buildMslFrame } from "./mslStateEncoder";
import { recordMslFrame } from "./mslStateStore";
import type {
  MSLBuildAttrs,
  MSLFrameType,
  MSLStateFrame,
} from "./mslStateTypes";

interface BridgeArgs {
  frameType: MSLFrameType;
  sourceModule: string;
  attrs: MSLBuildAttrs;
  chatSessionId?: string;
  messageId?: string;
  workspaceObjectId?: string;
}

function emit(args: BridgeArgs): MSLStateFrame {
  return recordMslFrame(
    buildMslFrame(args.frameType, args.sourceModule, args.attrs, {
      chatSessionId: args.chatSessionId,
      messageId: args.messageId,
      workspaceObjectId: args.workspaceObjectId,
    }),
  );
}

// Workspace
export function emitWorkspaceObjectFrame(input: {
  workspaceObjectId: string;
  objectType: string;
  status: MSLBuildAttrs["status"];
  sourceModel?: string;
  sourceChatMessageId?: string;
  qaStatus?: string;
  valueEventId?: string;
  memoryUnitId?: string;
}) {
  return emit({
    frameType: "WORKSPACE_OBJECT",
    sourceModule: "workspace",
    workspaceObjectId: input.workspaceObjectId,
    messageId: input.sourceChatMessageId,
    attrs: {
      status: input.status,
      qaStatus: input.qaStatus,
      valueEventId: input.valueEventId,
      memoryUnitId: input.memoryUnitId,
      extra: {
        objectType: input.objectType,
        model: input.sourceModel,
      },
    },
  });
}

// Store / WebXXM
export function emitStorePackageFrame(input: {
  packageId: string;
  action: "INSTALLED" | "ENABLED" | "DISABLED" | "USED" | "REMOVED";
  status: MSLBuildAttrs["status"];
  valueEventId?: string;
}) {
  return emit({
    frameType: "STORE_PACKAGE",
    sourceModule: "store",
    attrs: {
      status: input.status,
      valueEventId: input.valueEventId,
      extra: { package: input.packageId, action: input.action },
    },
  });
}

// Calendar Trigger
export function emitCalendarTriggerFrame(input: {
  triggerType: string;
  status: MSLBuildAttrs["status"];
  target?: string;
  scheduledAt?: string;
}) {
  return emit({
    frameType: "CALENDAR_TRIGGER",
    sourceModule: "calendar",
    attrs: {
      status: input.status,
      extra: {
        triggerType: input.triggerType,
        target: input.target,
        scheduledAt: input.scheduledAt,
      },
    },
  });
}

// Social Publish
export function emitSocialPublishFrame(input: {
  visibility: "PRIVATE" | "PUBLIC" | "UNLISTED" | "FOUNDER_ONLY";
  status: MSLBuildAttrs["status"];
  qaStatus?: string;
  safetyStatus?: MSLBuildAttrs["safetyStatus"];
  reason?: string;
}) {
  return emit({
    frameType: "SOCIAL_PUBLISH",
    sourceModule: "social",
    attrs: {
      status: input.status,
      qaStatus: input.qaStatus,
      safetyStatus: input.safetyStatus,
      extra: { visibility: input.visibility, reason: input.reason },
    },
  });
}

// QA / Audit
export function emitQaAuditFrame(input: {
  status: MSLBuildAttrs["status"];
  qaStatus: string;
  target?: string;
  reason?: string;
}) {
  return emit({
    frameType: "QA_AUDIT",
    sourceModule: "qa-audit",
    attrs: {
      status: input.status,
      qaStatus: input.qaStatus,
      extra: { target: input.target, reason: input.reason },
    },
  });
}
