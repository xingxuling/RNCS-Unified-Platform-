import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runSystemAudit, SystemAuditResult } from "@/lib/audit/systemAuditRunner";
import type { AuditStatus, AuditSeverity } from "@/constants/audit/systemAuditChecks";

const STATUS_VARIANT: Record<AuditStatus, "default" | "destructive" | "outline" | "secondary"> = {
  PASS: "default",
  WARN: "secondary",
  FAIL: "destructive",
  PENDING: "outline",
};

const SEVERITY_COLOR: Record<AuditSeverity, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-amber-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-destructive font-semibold",
};

const STATUS_FILTERS: (AuditStatus | "ALL")[] = ["ALL", "FAIL", "WARN", "PASS", "PENDING"];

export function SystemAuditTable() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<AuditStatus | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const report = useMemo(() => runSystemAudit(), [tick]);
  const filtered = filter === "ALL" ? report.results : report.results.filter(r => r.status === filter);

  const copy = async (r: SystemAuditResult) => {
    try {
      await navigator.clipboard.writeText(r.repairPrompt);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 aether-card-elevated space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-base font-medium">系统总验收 · System Integration Audit</div>
            <div className="text-xs text-muted-foreground">
              扫描 MSL / Omni / Sequence World / Virtual Life / Encyclopedia / Prompt Forge / QA / Recalculation / Founder / Safety 的连通性。
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">生成时间：{report.generatedAt}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTick(t => t + 1)}>重新扫描</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="default">PASS · {report.counts.PASS}</Badge>
          <Badge variant="secondary">WARN · {report.counts.WARN}</Badge>
          <Badge variant="destructive">FAIL · {report.counts.FAIL}</Badge>
          <Badge variant="outline">PENDING · {report.counts.PENDING}</Badge>
        </div>

        {report.hasCriticalFail ? (
          <div className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            ⛔ 存在 CRITICAL 失败：v1.0 不允许标记为 ready。请先修复下方红色项。
          </div>
        ) : report.criticalFailures.length > 0 ? (
          <div className="rounded border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
            ⚠ CRITICAL 项目存在 WARN，建议在 v1.0 ready 前确认。
          </div>
        ) : (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-500">
            ✓ 无 CRITICAL 失败，允许标记 v1.0 ready（其他 WARN 仍建议处理）。
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(f => (
            <Badge
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(f)}
            >
              {f}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="aether-card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">模块</th>
                <th className="text-left p-3 font-medium">检查项</th>
                <th className="text-left p-3 font-medium">状态</th>
                <th className="text-left p-3 font-medium">严重度</th>
                <th className="text-left p-3 font-medium">说明 / 修复建议</th>
                <th className="text-left p-3 font-medium">提示词</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const isCritFail = r.severity === "CRITICAL" && r.status === "FAIL";
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-border align-top ${isCritFail ? "bg-destructive/5" : ""}`}
                  >
                    <td className="p-3 whitespace-nowrap font-medium">{r.module}</td>
                    <td className="p-3">
                      <div>{r.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.description}</div>
                    </td>
                    <td className="p-3"><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></td>
                    <td className={`p-3 ${SEVERITY_COLOR[r.severity]}`}>{r.severity}</td>
                    <td className="p-3 space-y-1">
                      <div className="text-muted-foreground">{r.detail}</div>
                      {r.status !== "PASS" && (
                        <div className="text-[10px] text-muted-foreground/80">↳ {r.fixHint}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {r.status !== "PASS" ? (
                        <Button size="sm" variant="outline" onClick={() => copy(r)}>
                          {copiedId === r.id ? "已复制" : "复制修复 Prompt"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">无匹配项</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
