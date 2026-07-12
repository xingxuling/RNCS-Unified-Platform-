import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultActionBar } from "./ChatResultActionBar";

interface Props {
  result: ChatDisplayResult;
  onAction?: (action: ChatResultAction, result: ChatDisplayResult) => void;
}

/**
 * 普通问答 / 自然语言输出。
 * 像 ChatGPT 一样直接显示文本，不包成大卡片。
 */
export function ChatTextResult({ result, onAction }: Props) {
  const text = result.mainContent ?? result.summary;
  return (
    <div className="space-y-1.5">
      <div className="rounded-2xl bg-card/70 border border-border/50 px-4 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {text}
      </div>
      <ChatResultActionBar result={result} onAction={onAction} />
    </div>
  );
}
