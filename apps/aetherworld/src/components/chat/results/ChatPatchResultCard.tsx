import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface PatchPreview {
  affectedFiles?: string[];
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  needsHumanReview?: boolean;
  summary?: string;
}

export function ChatPatchResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as PatchPreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="violet">
      <div className="text-xs space-y-1">
        {p.affectedFiles?.length ? (
          <div className="text-muted-foreground">影响文件：<span className="text-foreground/90">{p.affectedFiles.join("、")}</span></div>
        ) : null}
        <div className="flex gap-3 text-muted-foreground">
          {p.riskLevel && <span>风险：<span className="text-foreground/90">{p.riskLevel}</span></span>}
          <span>{p.needsHumanReview ? "需要人工确认" : "可继续处理"}</span>
        </div>
        <div className="text-[10px] text-amber-400">当前仅为草案，未自动应用。</div>
      </div>
    </ChatResultBaseCard>
  );
}
