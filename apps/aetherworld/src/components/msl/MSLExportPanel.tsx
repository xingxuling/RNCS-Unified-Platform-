import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MSLCompileResult, MSLCompileTarget } from "@/lib/msl/mslCompiler";

interface Props {
  targets: MSLCompileTarget[];
  current: MSLCompileTarget;
  onChange: (t: MSLCompileTarget) => void;
  results: MSLCompileResult[];
}

export function MSLExportPanel({ targets, current, onChange, results }: Props) {
  const text = results
    .map(r => typeof r.output === "string" ? r.output : JSON.stringify(r.output, null, 2))
    .join("\n\n---\n\n");

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm font-medium">Compile / Export</div>
        <div className="flex flex-wrap gap-1">
          {targets.map(t => (
            <Badge
              key={t}
              variant={t === current ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onChange(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={copy} disabled={!text}>复制</Button>
      </div>

      {results.length === 0 ? (
        <div className="text-xs text-muted-foreground">还没有可编译的语句。先在上方输入并解析。</div>
      ) : (
        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-muted/40 rounded p-3 max-h-[400px] overflow-auto">
          {text}
        </pre>
      )}

      {results.length > 0 && (
        <div className="text-[10px] text-muted-foreground space-y-1">
          {results[0].trace.map((t, i) => <div key={i}>↳ {t}</div>)}
        </div>
      )}
    </Card>
  );
}
