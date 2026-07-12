import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";
import { SEQUENCE_MODES } from "@/constants/subjectSequenceModes";

interface Props {
  mode: SubjectSequenceMode;
  hasFullRecord: boolean;
  rowsCount: number;
  onDelete?: () => void;
  onExport?: () => void;
}

export function SubjectSequenceHealthPanel({ mode, hasFullRecord, rowsCount, onDelete, onExport }: Props) {
  const meta = SEQUENCE_MODES[mode];
  return (
    <div className="aether-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Private Subject Mode</div>
            <div className="font-display text-base">隐私状态</div>
          </div>
        </div>
        <Badge variant="outline" className={meta.isRealSubject ? "border-emerald-500/50 text-emerald-400" : "border-primary/40 text-primary"}>
          {meta.cn} · {meta.en}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Row label="当前主体类型" value={meta.isRealSubject ? "真实主体" : "Demo Persona"} />
        <Row label="数列模式" value={`${meta.rows || rowsCount} 组`} />
        <Row label="数据存储位置" value="本地 localStorage" />
        <Row label="是否已启用回验权重学习" value={meta.isRealSubject ? "可启用" : "Demo 不参与权重学习"} />
      </div>

      <div className="text-[11px] text-muted-foreground leading-relaxed">
        · 完整主体数列仅保存在本地浏览器中，不会上传。<br />
        · Demo Persona 与真实主体严格分离，互不污染。<br />
        · 你可随时删除真实主体数据并切换回 Demo。<br />
        · 系统不会把真实主体数列作为公开样本。
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport} disabled={!hasFullRecord}>
            <Download className="w-3.5 h-3.5 mr-1" /> 导出真实主体数据
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={!hasFullRecord}
            onClick={() => {
              if (confirm("确认删除本地完整主体数列？该操作不可撤销。")) {
                onDelete();
                toast.success("已删除真实主体数据");
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除真实主体数据
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
