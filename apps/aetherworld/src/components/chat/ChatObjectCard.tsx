import { Box } from "lucide-react";

interface Props {
  objectId: string;
  objectType: string;
  title: string;
  summary?: string;
  onOpen?: () => void;
}

export function ChatObjectCard({ objectId, objectType, title, summary, onOpen }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Box className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="text-sm font-medium truncate">{title}</div>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-background/40 text-muted-foreground">
          {objectType}
        </span>
      </div>
      {summary && <div className="text-xs text-muted-foreground line-clamp-2">{summary}</div>}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted-foreground/70 font-mono truncate">{objectId}</div>
        <button onClick={onOpen} className="ml-auto text-xs px-2.5 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90">
          打开对象
        </button>
      </div>
    </div>
  );
}
