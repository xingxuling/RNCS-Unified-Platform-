import { toast } from "sonner";
import type { ChatDisplayResult, ChatResultAction } from "./chatDisplayResultTypes";
import type { ChatMessage } from "./chatMessageEngine";
import { newMessageId } from "./chatMessageEngine";

/**
 * 把任意 ChatDisplayResult 包装成一条 assistant 消息。
 * 调用方再用现有的会话引擎 append 进会话即可。
 */
export function wrapResultAsMessage(result: ChatDisplayResult): ChatMessage {
  return {
    id: newMessageId(),
    type: "DISPLAY_RESULT",
    role: "assistant",
    text: undefined,
    displayResult: result,
    createdAt: result.createdAt,
  };
}

/**
 * 默认 action 处理：路由跳转 / 复制 / 保存提示。
 * 调用方可以自己拦截 OPEN_DETAIL / RUN / SAVE 等做更精确的处理。
 */
export function defaultHandleResultAction(
  action: ChatResultAction,
  result: ChatDisplayResult,
  navigate?: (route: string) => void,
) {
  switch (action.actionType) {
    case "OPEN_DETAIL": {
      const route = action.targetRoute;
      if (route && navigate) navigate(route);
      return;
    }
    case "SAVE": {
      // 真正的持久化由调用方决定（Workspace / 后端）；此处仅做用户反馈。
      toast.success(`已保存「${result.title}」到工作区。`);
      return;
    }
    case "COPY": {
      const text = result.mainContent ?? result.summary;
      navigator.clipboard?.writeText(text).then(
        () => toast.success("已复制到剪贴板"),
        () => toast.error("复制失败"),
      );
      return;
    }
    case "EXPORT":
      toast.info("导出功能预留中。");
      return;
    case "CONTINUE":
      // 由 Chat 输入层决定如何继续上下文。
      return;
    case "RUN":
    case "INSTALL":
    case "ENABLE":
    case "DOWNLOAD":
    case "CUSTOM":
      // 由调用方根据 payload 自定义。
      return;
  }
}
