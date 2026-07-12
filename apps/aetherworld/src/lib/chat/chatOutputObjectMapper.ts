import type { ChatDisplayResult, ChatDisplayResultType, ChatDisplayResultQa } from "./chatDisplayResultTypes";
import { normalizeDisplayResult } from "./chatResultNormalizer";
import { buildDefaultActions } from "./chatSuggestedActionsFactory";

/**
 * 把 Workspace 中的对象映射为对话结果。
 * 适配 App Runtime / Code Sandbox / WebLWM / WebMusicM 等输出。
 */
export interface WorkspaceObjectLike {
  objectId: string;
  objectType: string;
  title: string;
  summary?: string;
  qaStatus?: ChatDisplayResultQa;
  runId?: string;
  preview?: Record<string, unknown>;
  detailRoute?: string;
  sourceModule?: string;
}

const OBJECT_TYPE_TO_RESULT: Record<string, { resultType: ChatDisplayResultType; sourceModule: string; titlePrefix: string }> = {
  APP_PROJECT_OBJECT:        { resultType: "APP",        sourceModule: "App Runtime", titlePrefix: "应用草案已生成" },
  APP_RUNTIME_OBJECT:        { resultType: "APP",        sourceModule: "App Runtime", titlePrefix: "应用草案已生成" },
  CODE_SANDBOX_RUN_OBJECT:   { resultType: "CODE",       sourceModule: "Code Sandbox", titlePrefix: "代码检查完成" },
  CODE_CHECK_OBJECT:         { resultType: "CODE",       sourceModule: "Code Sandbox", titlePrefix: "代码检查完成" },
  PATCH_DRAFT_OBJECT:        { resultType: "PATCH",      sourceModule: "WebCodeM",     titlePrefix: "修复草案已生成" },
  WORLD_OBJECT:              { resultType: "WORLD",      sourceModule: "WebLWM",       titlePrefix: "世界已生成" },
  WORLD_TICK_OBJECT:         { resultType: "WORLD",      sourceModule: "WebLWM",       titlePrefix: "世界模拟已推进" },
  MUSIC_DRAFT_OBJECT:        { resultType: "MUSIC",      sourceModule: "WebMusicM",    titlePrefix: "音乐草案已生成" },
  CONCEPT_CHAIN_OBJECT:      { resultType: "CONCEPT",    sourceModule: "WebLCM",       titlePrefix: "概念链已生成" },
  KNOWLEDGE_RESULT_OBJECT:   { resultType: "KNOWLEDGE",  sourceModule: "WebLKM",       titlePrefix: "已找到相关知识" },
  QA_REPORT_OBJECT:          { resultType: "QA",         sourceModule: "QA",           titlePrefix: "质量检查结果" },
};

/**
 * 根据工作区对象类型，生成默认的 ChatDisplayResult。
 */
export function mapWorkspaceObjectToDisplayResult(obj: WorkspaceObjectLike): ChatDisplayResult {
  const meta = OBJECT_TYPE_TO_RESULT[obj.objectType] ?? {
    resultType: "OBJECT" as ChatDisplayResultType,
    sourceModule: obj.sourceModule ?? "Workspace",
    titlePrefix: obj.title,
  };
  const actions = buildDefaultActions({
    resultType: meta.resultType,
    objectId: obj.objectId,
    runId: obj.runId,
    detailRoute: obj.detailRoute,
  });

  return normalizeDisplayResult({
    resultType: meta.resultType,
    sourceModule: meta.sourceModule,
    title: obj.title || meta.titlePrefix,
    summary: obj.summary ?? `${meta.titlePrefix}。`,
    objectId: obj.objectId,
    objectType: obj.objectType,
    runId: obj.runId,
    qaStatus: obj.qaStatus,
    structuredPreview: obj.preview,
    actions,
  });
}
