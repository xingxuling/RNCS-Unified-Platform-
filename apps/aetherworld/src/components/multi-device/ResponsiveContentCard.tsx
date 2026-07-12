import type { ReactNode } from "react";

export function ResponsiveContentCard({
  title,
  status,
  summary,
  primary,
  children,
}: {
  title: string;
  status?: string;
  summary?: string;
  primary?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          {summary && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{summary}</div>}
        </div>
        {status && <span className="text-[10px] text-muted-foreground shrink-0">{status}</span>}
      </div>
      {primary && <div>{primary}</div>}
      {children && <div className="hidden md:block">{children}</div>}
    </div>
  );
}
