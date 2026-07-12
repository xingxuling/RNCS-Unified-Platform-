import { Database, Download, Trash2, ShieldCheck, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISOLATION_RULES } from "@/constants/demoRealIsolationRules";
import { toast } from "sonner";

const KEYS = [
  "aether.realSubject.full60.v1",
  "aether.realSubject.mode.v1",
];

export function DataPrivacyPanel({ className }: { className?: string }) {
  const exportLocal = () => {
    if (typeof window === "undefined") return;
    const dump: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("aether.")) {
        try { dump[k] = JSON.parse(window.localStorage.getItem(k) ?? "null"); }
        catch { dump[k] = window.localStorage.getItem(k); }
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aether-local-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出本地数据快照");
  };

  const clearRealSubject = () => {
    if (typeof window === "undefined") return;
    if (!confirm("确定要删除本地真实主体数据吗？此操作不可撤销。")) return;
    KEYS.forEach((k) => window.localStorage.removeItem(k));
    toast.success("真实主体本地数据已删除");
  };

  return (
    <div className={`aether-card-elevated p-5 ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Privacy & Data · 隐私与数据</div>
      <h2 className="font-display text-lg gold-text mt-1">数据保存在你的设备</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-md border border-border/60 bg-secondary/20 flex items-start gap-2">
          <HardDrive className="w-4 h-4 text-primary mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <div className="font-medium">本地 localStorage</div>
            <div className="text-muted-foreground">所有真实主体数据仅保存在你当前浏览器，不会上传服务器。</div>
          </div>
        </div>
        <div className="p-3 rounded-md border border-border/60 bg-secondary/20 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <div className="font-medium">Demo / Real 严格隔离</div>
            <div className="text-muted-foreground">Demo 数据与真实主体在存储与回验权重上完全独立。</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-muted-foreground mb-2">隔离原则</div>
        <ul className="text-[11px] space-y-1 list-disc pl-4 text-muted-foreground">
          {ISOLATION_RULES.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" onClick={exportLocal}>
          <Download className="w-3.5 h-3.5 mr-1" />
          导出本地数据
        </Button>
        <Button size="sm" variant="ghost" className="text-rose-300 hover:text-rose-200" onClick={clearRealSubject}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          删除真实主体
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed flex items-start gap-1">
        <Database className="w-3 h-3 mt-0.5" />
        想保留数据请先导出。清除浏览器存储或更换设备会导致本地数据丢失。
      </div>
    </div>
  );
}
