// Chat 结果卡：总说明书引导
import { Link } from "@tanstack/react-router";
import type { ChatManualInfo } from "@/lib/system/aetherSystemManual";

interface Props {
  info: ChatManualInfo;
}

export function ChatManualCard({ info }: Props) {
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Aetherworld 总说明书
        </div>
        <Link
          to="/system/manual"
          className="text-[11px] text-primary hover:underline"
        >
          打开完整说明书 →
        </Link>
      </div>
      <div className="text-foreground/90">{info.summary}</div>
      {info.bullets.length > 0 && (
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          {info.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {info.matched.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          相关章节：{info.matched.join("、")}
        </div>
      )}
    </div>
  );
}
