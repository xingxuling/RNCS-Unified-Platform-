// Chat 结果卡：联网读取
import { Link } from "@tanstack/react-router";
import type { ChatNetworkInfo } from "@/lib/network/aetherNetworkChatBridge";
import { NETWORK_SOURCE_TYPE_LABEL } from "@/lib/network/aetherNetworkTypes";
import { trustLabel } from "@/lib/network/aetherSourceTrustScorer";

interface Props { info: ChatNetworkInfo }

const STATUS_COLOR: Record<ChatNetworkInfo["status"], string> = {
  OK:      "border-emerald-500/30 text-emerald-500",
  PENDING: "border-amber-500/30 text-amber-500",
  FAILED:  "border-red-500/40 text-red-500",
  BLOCKED: "border-red-500/40 text-red-500",
};

export function ChatNetworkSourceCard({ info }: Props) {
  const src = info.source;
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">联网读取 · Network Runtime</div>
        <Link to="/system/network" className="text-[11px] text-primary hover:underline">打开联网中心 →</Link>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${STATUS_COLOR[info.status]}`}>{info.status}</span>
        {src && (
          <>
            <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
              {NETWORK_SOURCE_TYPE_LABEL[src.sourceType]}
            </span>
            <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
              {trustLabel(src.trustScore)}（{src.trustScore.toFixed(2)}）
            </span>
            <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
              安全 {src.safetyStatus}
            </span>
          </>
        )}
      </div>

      {info.url && (
        <div className="text-[11px] text-muted-foreground break-all">
          来源：<a href={info.url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">{info.url}</a>
        </div>
      )}

      {src?.title && <div className="text-foreground/90">{src.title}</div>}
      {src?.summary && <div className="text-[11px] text-muted-foreground line-clamp-4">{src.summary}</div>}

      {info.forwardedToOpenArchitecture && (
        <div className="text-[11px] text-primary">已识别为开源项目，可在「开源架构吸收」中继续分析。</div>
      )}

      {info.reasons.length > 0 && (
        <ul className="text-[10.5px] text-muted-foreground list-disc pl-4 space-y-0.5">
          {info.reasons.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}

      <div className="text-[10px] text-muted-foreground/80 pt-1 border-t border-border/40">
        受控只读：不自动登录、不提交表单、不运行外部代码、不安装依赖、不公开发布。
      </div>
    </div>
  );
}
