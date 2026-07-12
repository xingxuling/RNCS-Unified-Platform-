import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

export function ChatObjectResultCard({ result, onAction }: Props) {
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="primary">
      <div className="text-xs text-muted-foreground space-y-0.5">
        {result.objectType && <div>对象类型：<span className="text-foreground/90">{result.objectType}</span></div>}
        {result.objectId   && <div>对象 ID：<span className="text-foreground/90">{result.objectId}</span></div>}
      </div>
    </ChatResultBaseCard>
  );
}
