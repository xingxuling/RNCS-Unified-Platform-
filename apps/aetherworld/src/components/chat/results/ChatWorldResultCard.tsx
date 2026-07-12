import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface WorldPreview {
  worldName?: string;
  currentState?: string;
  newEvents?: string[];
  timelineDelta?: string;
}

export function ChatWorldResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as WorldPreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="sky">
      <div className="text-xs space-y-1">
        {p.worldName && <div>世界：<span className="text-foreground/90">{p.worldName}</span></div>}
        {p.currentState && <div className="text-muted-foreground">当前状态：<span className="text-foreground/90">{p.currentState}</span></div>}
        {p.timelineDelta && <div className="text-muted-foreground">时间线：{p.timelineDelta}</div>}
        {p.newEvents?.length ? (
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            {p.newEvents.slice(0, 4).map((e, i) => <li key={i} className="text-foreground/80">{e}</li>)}
          </ul>
        ) : null}
      </div>
    </ChatResultBaseCard>
  );
}
