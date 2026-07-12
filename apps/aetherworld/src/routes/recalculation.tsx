import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

import { GlobalRecalculateButton } from "@/components/GlobalRecalculateButton";
import { RecalculationStatusPanel } from "@/components/RecalculationStatusPanel";
import { RecalculationDependencyGraph } from "@/components/RecalculationDependencyGraph";
import { RecalculationImpactSummary } from "@/components/RecalculationImpactSummary";
import { RecalculationLogTimeline } from "@/components/RecalculationLogTimeline";

import {
  SCOPE_META, type RecalculationScopeId,
} from "@/constants/recalculationScopes";
import {
  resetRecalcTracking, recalcBlocksV1, recalcBetaImpact, recalcQAIssues,
} from "@/lib/globalRecalculationEngine";

export const Route = createFileRoute("/recalculation")({
  head: () => ({
    meta: [
      { title: "重算中心 · Recalculation Center — Aether Fate Engine" },
      { name: "description", content: "总重新计算引擎：跟踪派生状态过期、按依赖图刷新、记录日志，并接入 QA / Beta / 版本就绪。" },
    ],
  }),
  component: RecalculationCenter,
});

const SCOPES: RecalculationScopeId[] = [
  "FULL_SYSTEM",
  "CURRENT_SUBJECT_ONLY",
  "ALL_SUBJECTS",
  "DEMO_ONLY",
  "FEEDBACK_WEIGHTS_ONLY",
  "CALENDAR_ONLY",
  "DETERMINATION_ONLY",
  "REGIONAL_UX_ONLY",
  "PROMPT_FORGE_ONLY",
  "QA_ONLY",
];

function RecalculationCenter() {
  const [scope, setScope] = useState<RecalculationScopeId>("FULL_SYSTEM");

  const blockV1 = useMemo(() => recalcBlocksV1(), [scope]);
  const beta = useMemo(() => recalcBetaImpact(), [scope]);
  const qa = useMemo(() => recalcQAIssues(), [scope]);

  return (
    <>
      <PageHeader
        caption="Recalculation Center · 重算中心"
        title="总重新计算引擎"
        subtitle="跟踪派生状态过期 · 按依赖图刷新 · 严格遵守 Demo / Real 隔离与安全规则。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* 顶部：执行区 */}
        <div className="aether-card p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Global Recalculation · 总重算
              </div>
              <h2 className="font-display text-lg mt-0.5">选择范围并执行</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {SCOPE_META[scope].description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={scope} onValueChange={(v) => setScope(v as RecalculationScopeId)}>
                <SelectTrigger className="w-56 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {SCOPE_META[s].cn} · {SCOPE_META[s].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <GlobalRecalculateButton
                scope={scope}
                trigger="MANUAL"
                label={`执行 · ${SCOPE_META[scope].cn}`}
                size="default"
                variant="default"
                showStaleBadge={false}
              />
            </div>
          </div>
        </div>

        {/* 主体 Tabs */}
        <Tabs defaultValue="status">
          <TabsList>
            <TabsTrigger value="status">状态</TabsTrigger>
            <TabsTrigger value="impact">影响摘要</TabsTrigger>
            <TabsTrigger value="graph">依赖图</TabsTrigger>
            <TabsTrigger value="logs">日志</TabsTrigger>
            <TabsTrigger value="safety">安全规则</TabsTrigger>
            <TabsTrigger value="ext">QA / Beta / 版本</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-4">
            <RecalculationStatusPanel />
          </TabsContent>

          <TabsContent value="impact" className="mt-4">
            <RecalculationImpactSummary />
          </TabsContent>

          <TabsContent value="graph" className="mt-4">
            <RecalculationDependencyGraph />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <RecalculationLogTimeline />
          </TabsContent>

          <TabsContent value="safety" className="mt-4">
            <div className="aether-card p-6 space-y-3 text-sm">
              <h3 className="font-display text-base">安全规则 · 重算不得破坏用户数据</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs leading-relaxed">
                <li>不删除原始 20 / 60 组数列。</li>
                <li>不删除回验记录（除非用户明确删除主体）。</li>
                <li>不把 Demo 权重写入真实主体；不把真实主体权重写入 Demo。</li>
                <li>不覆盖用户手写备注；不清空 Prompt 历史；不重置产品文档。</li>
                <li>重算失败时保留旧状态并显示错误。</li>
                <li>每次重算前后都会写入本地日志。</li>
              </ul>
              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  调试用：仅清理重算追踪元数据（不删除你的主体 / 回验 / Prompt 历史）。
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("仅清理重算追踪元数据。不会删除主体、回验或 Prompt 历史。继续？")) {
                      resetRecalcTracking();
                    }
                  }}
                >
                  重置重算追踪
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ext" className="mt-4">
            <div className="aether-card p-6 space-y-4">
              <h3 className="font-display text-base">对 QA / Beta / 版本的影响</h3>

              <ExtRow
                label="v1.0 标记"
                ok={!blockV1.blocked}
                okText="允许标记 v1.0（无 stale / 重算失败阻断）"
                blockText={blockV1.reason ?? "存在阻断条件"}
              />
              <ExtRow
                label="Beta · 回验闭环"
                ok={!beta.staleHurtsFeedbackLoop}
                okText="回验权重已最新"
                blockText="回验权重过期 → 降低 Feedback Loop Strength"
              />
              <ExtRow
                label="Beta · Demo/Real 隔离"
                ok={beta.isolationStateClean}
                okText="隔离状态最新"
                blockText="隔离状态过期 → 提高 Over-Launch Risk"
              />
              <ExtRow
                label="QA · 预测详情状态漂移"
                ok={!qa.driftCritical}
                okText="预测详情未漂移"
                blockText="预测详情过期 → 生成 STATE_DRIFT 风险"
              />
              <ExtRow
                label="QA · 重算日志完整性"
                ok={!qa.missingLogs}
                okText="日志已记录"
                blockText="尚无任何重算日志 → MEDIUM issue"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-muted-foreground/70 italic leading-relaxed">
          重算不是刷新页面，也不是清空缓存。它按依赖图刷新派生状态，并严格保留原始数据与隔离边界。
        </div>
      </div>
    </>
  );
}

function ExtRow({
  label, ok, okText, blockText,
}: { label: string; ok: boolean; okText: string; blockText: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-secondary/10 p-3">
      <div>
        <div className="text-xs font-display">{label}</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {ok ? okText : blockText}
        </div>
      </div>
      <span
        className={`text-[10px] px-2 py-0.5 rounded border ${
          ok
            ? "border-emerald-500/40 text-emerald-300"
            : "border-amber-500/40 text-amber-300"
        }`}
      >
        {ok ? "OK" : "需注意"}
      </span>
    </div>
  );
}
