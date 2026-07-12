import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

export function ChatSystemResultCard({ result, onAction }: Props) {
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="muted">
      {result.mainContent && (
        <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{result.mainContent}</pre>
      )}
    </ChatResultBaseCard>
  );
}
