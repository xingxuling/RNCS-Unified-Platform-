import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface QaPreview {
  issues?: string[];
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedFixes?: string[];
}

export function ChatQaResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as QaPreview;
  const isBlocked = result.qaStatus === "BLOCKED";
  return (
    <ChatResultBaseCard
      result={result}
      onAction={onAction}
      accent={
        result.qaStatus === "PASS" ? "emerald"
        : result.qaStatus === "WARN" ? "amber"
        : result.qaStatus === "FAIL" || isBlocked ? "rose"
        : "muted"
      }
    >
      <div className="text-xs space-y-1">
        {p.riskLevel && <div className="text-muted-foreground">风险等级：<span className="text-foreground/90">{p.riskLevel}</span></div>}
        {p.issues?.length ? (
          <div>
            <div className="text-muted-foreground mb-0.5">问题：</div>
            <ul className="list-disc pl-4 text-foreground/85 space-y-0.5">
              {p.issues.slice(0, 5).map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>
        ) : null}
        {p.recommendedFixes?.length ? (
          <div>
            <div className="text-muted-foreground mb-0.5">建议修复：</div>
            <ul className="list-disc pl-4 text-foreground/85 space-y-0.5">
              {p.recommendedFixes.slice(0, 5).map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>
        ) : null}
        {isBlocked && (
          <div className="text-rose-300 font-medium">该操作已被系统阻断，必须先解决上述问题。</div>
        )}
      </div>
    </ChatResultBaseCard>
  );
}
