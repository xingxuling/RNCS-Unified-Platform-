import { useEffect, useState } from "react";
import { loadJournal, deleteJournalEntry, exportJournalMarkdown, type VirtualLifeJournalEntry } from "@/lib/virtualLifeJournalEngine";

export function VirtualLifeJournal() {
  const [list, setList] = useState<VirtualLifeJournalEntry[]>([]);
  const refresh = () => setList(loadJournal());
  useEffect(refresh, []);

  if (list.length === 0) {
    return <div className="aether-card p-5 text-xs text-muted-foreground">还没有日记。完成一天的虚拟生活后可保存。</div>;
  }

  const copy = (t: string) => navigator.clipboard?.writeText(t);
  const download = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {list.map(e => {
        const md = exportJournalMarkdown(e);
        return (
          <div key={e.id} className="aether-card p-5 space-y-2">
            <div className="flex justify-between items-baseline">
              <div className="text-sm font-display">{e.dayTitle}</div>
              <div className="text-[11px] text-muted-foreground">{e.date} · {e.lifeMode}</div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              完成 {e.completedQuests.length} · 跳过 {e.skippedQuests.length} · 现实动作 {e.realWorldActions.length}
            </div>
            {e.reflection && <div className="text-xs text-foreground/80">{e.reflection}</div>}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => copy(md)} className="text-[11px] px-2.5 py-1 rounded bg-primary/20 hover:bg-primary/30">复制 MD</button>
              <button onClick={() => download(`virtual-life-${e.date}.md`, md)} className="text-[11px] px-2.5 py-1 rounded bg-background/60 border border-border/40">导出 MD</button>
              <button onClick={() => { deleteJournalEntry(e.id); refresh(); }} className="text-[11px] px-2.5 py-1 rounded bg-background/40 border border-destructive/30 text-destructive">删除</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
