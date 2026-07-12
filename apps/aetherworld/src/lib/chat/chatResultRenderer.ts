/**
 * Chat Result Renderer 入口模块。
 *
 * 设计意图：
 * Aetherworld 的对话界面是默认输出承接层。所有模块（App Runtime、Code Sandbox、
 * WebCodeM、WebLWM、WebMusicM、WebLCM、WebLKM、QA、Store、Workspace 等）的输出
 * 都应优先用 ChatDisplayResult 包装，再交给 ChatDisplayResultRenderer 展示。
 *
 * 独立页面（/apps/:id、/worlds/:id、/patch/:id 等）仍然保留，
 * 通过结果卡片的“打开详情”按钮进入。
 */
export { normalizeDisplayResult } from "./chatResultNormalizer";
export { buildDefaultActions } from "./chatSuggestedActionsFactory";
export { mapWorkspaceObjectToDisplayResult } from "./chatOutputObjectMapper";
export {
  wrapResultAsMessage,
  defaultHandleResultAction,
} from "./chatResultPersistenceBridge";
export type {
  ChatDisplayResult,
  ChatDisplayResultType,
  ChatDisplayResultQa,
  ChatResultAction,
} from "./chatDisplayResultTypes";
