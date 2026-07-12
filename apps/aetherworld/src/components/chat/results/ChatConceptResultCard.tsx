import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface ConceptPreview {
  coreConcept?: string;
  chainSummary?: string;
  graphCount?: number;
}

export function ChatConceptResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as ConceptPreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="sky">
      <div className="text-xs space-y-1">
        {p.coreConcept && <div>核心概念：<span className="text-foreground/90">{p.coreConcept}</span></div>}
        {p.chainSummary && <div className="text-muted-foreground">概念链：<span className="text-foreground/85">{p.chainSummary}</span></div>}
        {typeof p.graphCount === "number" && <div className="text-muted-foreground">概念图数量：{p.graphCount}</div>}
      </div>
    </ChatResultBaseCard>
  );
}
