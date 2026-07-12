import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface CodePreview {
  status?: "OK" | "HAS_ERRORS" | "HAS_WARNINGS";
  errorCount?: number;
  warnCount?: number;
  files?: string[];
}

export function ChatCodeResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as CodePreview;
  const hasIssues = (p.errorCount ?? 0) > 0 || (p.warnCount ?? 0) > 0;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent={hasIssues ? "amber" : "emerald"}>
      <div className="text-xs space-y-1">
        <div className="flex gap-3 text-foreground/80">
          <span>错误：<span className="text-destructive">{p.errorCount ?? 0}</span></span>
          <span>警告：<span className="text-amber-400">{p.warnCount ?? 0}</span></span>
          {p.status && <span className="text-muted-foreground">状态：{p.status}</span>}
        </div>
        {p.files?.length ? (
          <div className="text-muted-foreground truncate">影响文件：{p.files.slice(0, 6).join("、")}{p.files.length > 6 ? " …" : ""}</div>
        ) : null}
      </div>
    </ChatResultBaseCard>
  );
}
