import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface StorePreview {
  itemName?: string;
  englishName?: string;
  newStatus?: string;
}

export function ChatStoreResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as StorePreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="primary">
      {(p.itemName || p.newStatus) && (
        <div className="text-xs space-y-0.5 text-muted-foreground">
          {p.itemName && <div>条目：<span className="text-foreground/90">{p.itemName}</span>{p.englishName ? <span className="text-[10px] ml-1">{p.englishName}</span> : null}</div>}
          {p.newStatus && <div>状态：<span className="text-foreground/90">{p.newStatus}</span></div>}
        </div>
      )}
    </ChatResultBaseCard>
  );
}
