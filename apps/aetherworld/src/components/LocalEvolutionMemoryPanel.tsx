import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadMemory, clearMemory, exportMemory, importMemory } from "@/lib/localEvolutionMemory";
import { toast } from "sonner";
import { Download, Upload, Trash2 } from "lucide-react";

export function LocalEvolutionMemoryPanel({ founderView, onChange }: { founderView?: boolean; onChange?: () => void }) {
  const [mem, setMem] = useState(loadMemory());
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const refresh = () => { setMem(loadMemory()); onChange?.(); };

  const handleExport = () => {
    const data = exportMemory();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bio-evolution-memory-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出本地进化记忆");
  };
  const handleImport = () => {
    if (importMemory(importText)) { toast.success("已导入进化记忆"); refresh(); setShowImport(false); setImportText(""); }
    else toast.error("导入失败：JSON 格式错误");
  };
  const handleClear = () => {
    if (!confirm("确定清空所有本地进化记忆？此操作不可撤销。")) return;
    clearMemory(); toast.success("已清空本地进化记忆"); refresh();
  };

  return (
    <div className="aether-card-elevated p-5 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Local Evolution Memory · 本地进化记忆</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Field label="本地用户 ID" value={mem.userIdLocal} />
        <Field label="信号总数" value={String(mem.signals.length)} />
        <Field label="回验可靠度" value={`${(mem.feedbackReliability * 100).toFixed(0)}%`} />
        <Field label="语言偏好" value={mem.languagePreference} />
      </div>

      <div className="text-[11px] text-muted-foreground">
        创建：{new Date(mem.createdAt).toLocaleString()} · 更新：{new Date(mem.updatedAt).toLocaleString()}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleExport}><Download className="w-3.5 h-3.5 mr-1" />导出</Button>
        {founderView && <Button size="sm" variant="outline" onClick={() => setShowImport(s => !s)}><Upload className="w-3.5 h-3.5 mr-1" />导入</Button>}
        {founderView && <Button size="sm" variant="ghost" className="text-rose-400" onClick={handleClear}><Trash2 className="w-3.5 h-3.5 mr-1" />清空记忆</Button>}
      </div>

      {showImport && (
        <div className="space-y-2">
          <Textarea rows={6} placeholder="粘贴 JSON" value={importText} onChange={e => setImportText(e.target.value)} />
          <Button size="sm" onClick={handleImport}>确认导入</Button>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border/40 pt-2">
        所有数据仅存储在你的浏览器本地（localStorage）。不会自动上传到服务器。
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="aether-card p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}
