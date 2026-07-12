import { Activity } from "lucide-react";
import { ChatQaStatusBadge } from "./ChatQaStatusBadge";

interface Props {
  runId?: string;
  runType: string;
  status: string;
  summary: string;
  qaStatus?: string;
  createdObjectId?: string;
  onOpen?: (route: string) => void;
}

export function ChatRunResultCard(p: Props) {
  const statusColor =
    p.status === "BLOCKED" ? "text-rose-300"
    : p.status === "WARN" ? "text-amber-300"
    : "text-emerald-300";
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="text-sm font-medium">{p.runType}</div>
        {p.qaStatus && <ChatQaStatusBadge status={p.qaStatus as any} />}
        <span className={`ml-auto text-[11px] ${statusColor}`}>{p.status}</span>
      </div>
      <div className="text-xs text-muted-foreground">{p.summary}</div>
      {p.runId && <div className="text-[10px] text-muted-foreground/70 font-mono">{p.runId}</div>}
      <div className="flex flex-wrap gap-2 pt-1">
        {p.createdObjectId && (
          <button onClick={() => p.onOpen?.("/objects")} className="text-xs px-2.5 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90">
            打开对象
          </button>
        )}
        <button onClick={() => p.onOpen?.("/runs")} className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:border-border">
          查看 Trace
        </button>
        <button onClick={() => p.onOpen?.("/system-audit")} className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:border-border">
          查看 QA
        </button>
      </div>
    </div>
  );
}
