import { Database, HardDrive } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";
import {
  QA_EXPECTED_STORAGE_KEYS,
  QA_REAL_SUBJECT_LINKED_KEYS,
} from "@/lib/softwareQAFeedbackCalculus";

interface Props {
  result: QAScanResult;
  existingKeys: string[];
}

export function QADataIntegrityPanel({ result, existingKeys }: Props) {
  const existing = new Set(existingKeys);
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Data Integrity · 数据完整性扫描
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">localStorage 健康度</h2>
        <span className="text-[11px] text-muted-foreground">
          完整性 {result.dataIntegrityScore}/100
        </span>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="p-3 rounded-md border border-border/60 bg-secondary/20">
          <div className="text-[11px] font-medium mb-2 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" /> 预期存储键
          </div>
          <ul className="space-y-1">
            {QA_EXPECTED_STORAGE_KEYS.map((k) => {
              const present = existing.has(k);
              return (
                <li key={k} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono truncate">{k}</span>
                  <span className={present ? "text-emerald-300" : "text-muted-foreground"}>
                    {present ? "已写入" : "未写入"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-3 rounded-md border border-border/60 bg-secondary/20">
          <div className="text-[11px] font-medium mb-2">真实主体关联键</div>
          <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
            删除真实主体时，下列键必须同步清理，避免污染 Demo 与回验权重。
          </p>
          <ul className="space-y-1">
            {QA_REAL_SUBJECT_LINKED_KEYS.map((k) => (
              <li key={k} className="font-mono text-[11px]">{k}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-md border border-border/60 bg-background/40 text-[10px] text-muted-foreground leading-relaxed">
        缺失的 key 通常表示用户尚未使用对应功能，不会自动判定为错误；但若出现未登记的 aether.* key 将被标记为潜在污染。
      </div>
    </div>
  );
}
