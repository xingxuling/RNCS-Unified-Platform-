// Chat 结果卡：记录中心摘要
import { Link } from "@tanstack/react-router";
import type { ChatRecordCenterInfo } from "@/lib/record-center/recordCenterChatBridge";
import { EVENT_TYPE_LABEL, STATUS_LABEL } from "@/lib/record-center/recordCenterTypes";

interface Props {
  info: ChatRecordCenterInfo;
}

const KIND_LABEL: Record<ChatRecordCenterInfo["kind"], string> = {
  recent: "最近记录",
  today: "今日记录",
  high: "高重要记录",
  risk: "风险记录",
  module: "模块激活记录",
};

export function ChatRecordCenterCard({ info }: Props) {
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          记录中心 · {KIND_LABEL[info.kind]}
        </div>
        <Link to="/system/record-center" className="text-[11px] text-primary hover:underline">
          打开记录中心 →
        </Link>
      </div>
      <div className="text-foreground/90">{info.summary}</div>

      {info.events.length > 0 && (
        <ul className="space-y-1.5">
          {info.events.map((e) => (
            <li
              key={e.id}
              className="rounded border border-border/40 bg-muted/10 px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-foreground/90">{e.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    e.status === "BLOCKED"
                      ? "border-red-500/40 text-red-400"
                      : e.status === "FAILED"
                      ? "border-red-500/30 text-red-300"
                      : e.status === "WARN"
                      ? "border-amber-500/40 text-amber-400"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[e.status]}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span>{EVENT_TYPE_LABEL[e.eventType]}</span>
                <span>{e.sourceModule}</span>
                <span>重要度 {e.importance.toFixed(2)}</span>
                <span>{new Date(e.createdAt).toLocaleTimeString("zh-CN")}</span>
              </div>
              {e.summary && (
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {e.summary}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
        <span>总记录 {info.total}</span>
        <span>WARN {info.warnCount}</span>
        <span>BLOCK {info.blockCount}</span>
      </div>

      {info.notes.length > 0 && (
        <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc pl-4">
          {info.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
