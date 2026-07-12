import type { CodeRunRequest } from "@/lib/code-sandbox/codeRunRequestEngine";

export function CodeRunRequestPanel({ request }: { request?: CodeRunRequest }) {
  if (!request) return null;
  return (
    <div className="border border-border/40 rounded p-3 space-y-1 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Run Request · 运行请求</div>
      <div className="text-[12px]"><span className="text-muted-foreground">requestId：</span>{request.requestId}</div>
      <div className="text-[12px]"><span className="text-muted-foreground">runner：</span>{request.runnerMode}</div>
      <div className="text-[12px]"><span className="text-muted-foreground">来源：</span>{request.source}</div>
      <div className="text-[12px]"><span className="text-muted-foreground">命令：</span>{request.requestedCommand || "（模拟）"}</div>
      <div className="text-[12px]"><span className="text-muted-foreground">目的：</span>{request.runPurpose}</div>
      <div className="text-[12px]"><span className="text-muted-foreground">文件：</span>{request.targetFiles.length} 个</div>
      <ul className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
        {request.safetyNotes.map((s, i) => <li key={i}>· {s}</li>)}
      </ul>
    </div>
  );
}
