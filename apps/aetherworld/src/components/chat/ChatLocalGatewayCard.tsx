// Aether Local Execution Gateway · Chat 卡片
import type { ChatLocalGatewayInfo } from "@/lib/local-execution-gateway/localGatewayChatBridge";

export function ChatLocalGatewayCard({ info }: { info: ChatLocalGatewayInfo }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card/50 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-foreground">本地执行网关 · {info.focusLabel}</span>
        <span className="text-[10px] text-muted-foreground">{info.defaultUrl}</span>
      </div>
      <p className="text-muted-foreground">{info.summary}</p>

      <div className="mt-2 rounded bg-muted/40 p-2 font-mono text-[11px] text-foreground">
        {info.startCommand}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">允许</div>
          <ul className="space-y-0.5 text-[11px] text-foreground/80">
            {info.allowed.slice(0, 4).map((x) => <li key={x}>· {x}</li>)}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">禁止</div>
          <ul className="space-y-0.5 text-[11px] text-foreground/80">
            {info.forbidden.slice(0, 4).map((x) => <li key={x}>· {x}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}
