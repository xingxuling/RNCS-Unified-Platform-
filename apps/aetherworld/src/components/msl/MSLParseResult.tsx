import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MSLParseResult } from "@/lib/msl/mslParser";
import { MSL_DOMAINS } from "@/constants/msl/mslDomains";
import { getOpcode } from "@/constants/msl/mslOpcodes";

export function MSLParseResultView({ result }: { result: MSLParseResult }) {
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Parse Result</div>
        <Badge variant={result.valid ? "default" : "destructive"}>
          {result.valid ? "VALID" : "INVALID"}
        </Badge>
      </div>

      {result.errors.length > 0 && (
        <div className="text-xs text-destructive space-y-1">
          {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}
      {result.warnings.length > 0 && (
        <div className="text-xs text-amber-500 space-y-1">
          {result.warnings.map((w, i) => <div key={i}>! {w}</div>)}
        </div>
      )}

      {result.statements.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">语句（{result.statements.length}）</div>
          <div className="space-y-1">
            {result.statements.map((s, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 text-xs font-mono">
                <div className="text-muted-foreground">{s.index !== undefined ? `${s.index}:` : "-"}{s.raw}</div>
                {s.digits.map((d, j) => (
                  <div key={j} className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">{MSL_DOMAINS[j].zh}</span>
                    <span>{d} · {getOpcode(d).name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.blocks.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">区块</div>
          {result.blocks.map((b, i) => <div key={i}>• BLOCK {b.startIndex}..{b.endIndex}</div>)}
        </div>
      )}

      {result.programs.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">程序</div>
          {result.programs.map((p, i) => (
            <div key={i}>• PROGRAM {p.name}（{p.statements.length} 条语句）</div>
          ))}
        </div>
      )}

      {result.isFull60 && (
        <div className="text-xs text-amber-500">
          ⚠️ 检测到 Full 60 输入，包含完整主体数列，请勿外传或公开发布。
        </div>
      )}
    </Card>
  );
}
