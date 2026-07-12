import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Copy, Download, Eraser, Save } from "lucide-react";
import { toast } from "sonner";
import { CYCLE_META } from "@/constants/subjectSequenceModes";
import { parseSequenceText, validateRows } from "@/lib/realSubjectCalculus";

interface Props {
  initialRows?: number[][];
  onSave?: (rows: number[][]) => void;
}

const seedExample = () =>
  Array.from({ length: 60 }, (_, i) => {
    const n = Math.floor(10000 + Math.random() * 90000);
    return `${i + 1}，${String(n).padStart(5, "0")}`;
  }).join("\n");

export function FullSequenceInput({ initialRows, onSave }: Props) {
  const [text, setText] = useState(() =>
    initialRows && initialRows.length
      ? initialRows.map((r, i) => `${i + 1}，${r.join("")}`).join("\n")
      : "",
  );
  const [openCycles, setOpenCycles] = useState<Record<string, boolean>>({
    C1: true, C2: true, C3: true,
  });

  const parsed = useMemo(() => parseSequenceText(text), [text]);
  const rows = parsed.rows;
  const validation20 = useMemo(() => validateRows(rows, 20), [rows]);
  const validation60 = useMemo(() => validateRows(rows, 60), [rows]);

  const mode = rows.length === 60 ? "FULL_60" : rows.length === 20 ? "LIGHT_20" : "PARTIAL";

  const submit = () => {
    if (rows.length !== 60) {
      toast.error(`需要 60 组，当前 ${rows.length} 组`);
      return;
    }
    if (validation60.length) {
      toast.error(validation60[0]);
      return;
    }
    onSave?.(rows);
    toast.success("已保存完整主体数列（仅本地 localStorage）");
  };

  const cycleRows = (idx: number) => rows.slice(idx * 20, idx * 20 + 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={mode === "FULL_60" ? "border-emerald-500/50 text-emerald-400" : mode === "LIGHT_20" ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}>
          {mode === "FULL_60" ? "FULL 60 · 完整主体" : mode === "LIGHT_20" ? "LIGHT 20 · 轻量主体" : `当前 ${rows.length} 组`}
        </Badge>
        <span className="text-xs text-muted-foreground">
          解析到 {rows.length} 组 · 每组需 5 位数字（允许 0 开头）
        </span>
      </div>

      <Textarea
        rows={10}
        className="font-mono text-xs"
        placeholder={"批量粘贴格式：\n1，01325\n2，81355\n3，35155\n...\n60，xxxxx\n\n支持中/英文逗号、冒号、空格、换行。"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={submit} className="gap-1">
          <Save className="w-3.5 h-3.5" /> 保存为完整主体（60 组）
        </Button>
        <Button size="sm" variant="outline" onClick={() => setText(seedExample())}>
          <span className="text-xs">生成模拟 60 组（仅演示）</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(rows));
            toast.success("已复制为 JSON");
          }}
        >
          <Copy className="w-3.5 h-3.5 mr-1" /> 复制 JSON
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const out = rows.map((r, i) => `${i + 1}，${r.join("")}`).join("\n");
            const blob = new Blob([out], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "aether-subject-60.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-3.5 h-3.5 mr-1" /> 导出文本
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setText("")}>
          <Eraser className="w-3.5 h-3.5 mr-1" /> 清空
        </Button>
      </div>

      {(parsed.warnings.length > 0 || (rows.length > 0 && rows.length !== 20 && rows.length !== 60)) && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 space-y-1">
          {parsed.warnings.slice(0, 3).map((w, i) => <div key={i}>· {w}</div>)}
          {rows.length > 0 && rows.length !== 20 && rows.length !== 60 && (
            <div>· 当前不是 20 组也不是 60 组；继续输入以进入 LIGHT 20 或 FULL 60 模式。</div>
          )}
        </div>
      )}

      {rows.length === 20 && validation20.length === 0 && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary/90">
          当前为 LIGHT 20 模式。继续粘贴至 60 组可切换为 FULL 60 完整主体模式。
        </div>
      )}

      {/* 分三个 Cycle 预览 */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {CYCLE_META.map((c, idx) => {
            const part = cycleRows(idx);
            const open = openCycles[c.key];
            return (
              <div key={c.key} className="rounded-md border border-border bg-secondary/20">
                <button
                  className="w-full flex items-center justify-between px-3 py-2"
                  onClick={() => setOpenCycles((s) => ({ ...s, [c.key]: !open }))}
                >
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span className="font-display text-sm">{c.cn} · {c.en}</span>
                    <span className="text-[10px] text-muted-foreground">
                      第 {c.range[0]}–{c.range[1]} 组 · 已填 {part.length}/20
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">{c.interpretation}</span>
                </button>
                {open && (
                  <div className="px-3 pb-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {Array.from({ length: 20 }, (_, i) => {
                      const r = part[i];
                      const seq = c.range[0] + i;
                      return (
                        <div key={seq} className="rounded border border-border/70 bg-background/40 p-2">
                          <div className="text-[10px] text-muted-foreground">#{seq}</div>
                          <div className="font-mono text-sm tracking-widest mt-0.5">
                            {r ? r.join("") : <span className="text-muted-foreground/50">—</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
