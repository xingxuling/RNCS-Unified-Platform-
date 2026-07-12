import { ExternalLink, ArrowRight } from "lucide-react";

interface Props {
  route: string;
  label: string;
  reason?: string;
  onOpen?: () => void;
}

export function ChatRouteCard({ route, label, reason, onOpen }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="text-sm font-medium">{label}</div>
        <code className="ml-auto text-[10px] text-muted-foreground bg-background/40 px-1.5 py-0.5 rounded">{route}</code>
      </div>
      {reason && <div className="text-xs text-muted-foreground">{reason}</div>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onOpen}
          className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1"
        >
          打开页面 <ArrowRight className="w-3 h-3" />
        </button>
        <a
          href={route}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:border-border"
        >
          新标签打开
        </a>
      </div>
    </div>
  );
}
