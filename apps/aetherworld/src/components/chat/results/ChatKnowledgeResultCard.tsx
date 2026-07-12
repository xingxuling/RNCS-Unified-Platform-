import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface KnowledgePreview {
  totalCount?: number;
  keyEntries?: { title: string; snippet?: string }[];
  hasStale?: boolean;
  hasConflict?: boolean;
}

export function ChatKnowledgeResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as KnowledgePreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="emerald">
      <div className="text-xs space-y-1">
        {typeof p.totalCount === "number" && <div className="text-muted-foreground">相关知识：{p.totalCount} 条</div>}
        {p.keyEntries?.length ? (
          <ul className="space-y-0.5">
            {p.keyEntries.slice(0, 4).map((e, i) => (
              <li key={i} className="truncate text-foreground/85">· {e.title}{e.snippet ? ` — ${e.snippet}` : ""}</li>
            ))}
          </ul>
        ) : null}
        {(p.hasStale || p.hasConflict) && (
          <div className="text-amber-400">{p.hasStale ? "包含过期知识。" : ""}{p.hasConflict ? "存在冲突条目。" : ""}</div>
        )}
      </div>
    </ChatResultBaseCard>
  );
}
