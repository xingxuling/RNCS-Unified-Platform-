import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FullSequenceInput } from "@/components/FullSequenceInput";
import { SequenceCycleView } from "@/components/SequenceCycleView";
import { SubjectCycleComparison } from "@/components/SubjectCycleComparison";
import { FullSubjectProfileCard } from "@/components/FullSubjectProfileCard";
import { SubjectSequenceHealthPanel } from "@/components/SubjectSequenceHealthPanel";
import { ContextualManualHint } from "@/components/ContextualManualHint";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { DemoRealIsolationBadge } from "@/components/DemoRealIsolationBadge";
import { SubjectModeWarning } from "@/components/SubjectModeWarning";
import {
  analyzeFullSubject,
  type FullSubjectAnalysis,
} from "@/lib/realSubjectCalculus";
import {
  loadFullSubject,
  saveFullSubject,
  deleteFullSubject,
  getSequenceMode,
  setSequenceMode,
} from "@/lib/realSubjectStore";
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";
import { SEQUENCE_MODES, FIVE_DOMAIN_META, FIVE_DOMAIN_KEYS } from "@/constants/subjectSequenceModes";
import { toast } from "sonner";

export const Route = createFileRoute("/real-subject")({
  head: () => ({
    meta: [
      { title: "真实主体 · Real Subject — Aether Fate Engine" },
      { name: "description", content: "60 组五位数完整主体序列：三循环分析、五域完整分析、终端模式与隐私边界。" },
    ],
  }),
  component: RealSubjectPage,
});

function RealSubjectPage() {
  const [mode, setMode] = useState<SubjectSequenceMode>("DEMO");
  const [rows60, setRows60] = useState<number[][] | null>(null);

  useEffect(() => {
    setMode(getSequenceMode());
    const rec = loadFullSubject();
    if (rec?.rows?.length === 60) setRows60(rec.rows);
  }, []);

  const analysis: FullSubjectAnalysis | null = useMemo(() => {
    if (!rows60 || rows60.length !== 60) return null;
    try {
      return analyzeFullSubject(rows60);
    } catch {
      return null;
    }
  }, [rows60]);

  const changeMode = (m: SubjectSequenceMode) => {
    setMode(m);
    setSequenceMode(m);
    toast.success(`已切换至：${SEQUENCE_MODES[m].cn}`);
  };

  const handleSaveFull = (rows: number[][]) => {
    saveFullSubject({ rows, updatedAt: new Date().toISOString() });
    setRows60(rows);
    changeMode("FULL_60");
  };

  const handleDelete = () => {
    deleteFullSubject();
    setRows60(null);
    changeMode("DEMO");
  };

  const handleExport = () => {
    const rec = loadFullSubject();
    if (!rec) return;
    const blob = new Blob([JSON.stringify(rec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aether-real-subject.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        caption="Real Subject Calculus Engine · 真实用户主体计算引擎"
        title="真实主体"
        subtitle="20 组 × 3 轮 = 60 组完整命运序列。三段式循环结构 · 五域完整分析 · 终端模式。"
        actions={<DemoRealIsolationBadge mode={mode} />}
      />

      <div className="p-6 md:p-10 space-y-6">
        <ContextualManualHint
          currentPage="Real Subject"
          subjectMode={mode}
          userStage={mode === "FULL_60" ? "ADVANCED_USER" : "CREATING_SUBJECT"}
        />
        <SafetyBoundaryBanner
          page="Real Subject"
          subjectMode={mode}
          forceLevel={mode === "FULL_60" ? "HIGH" : mode === "LIGHT_20" ? "MEDIUM" : "LOW"}
        />
        {mode === "FULL_60" && <SubjectModeWarning scenario="FIRST_FULL60" />}

        {/* 模式切换 */}
        <div className="aether-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject Mode</div>
              <div className="font-display text-base">主体数列模式</div>
            </div>
            <Badge variant="outline" className="border-border">
              当前：{SEQUENCE_MODES[mode].cn} · {SEQUENCE_MODES[mode].en}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["DEMO", "LIGHT_20", "FULL_60", "IMPORTED"] as SubjectSequenceMode[]).map((m) => {
              const meta = SEQUENCE_MODES[m];
              const active = mode === m;
              const disabled = m === "IMPORTED";
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => changeMode(m)}
                  className={`text-left rounded-md border p-3 transition ${
                    active
                      ? "border-primary/60 bg-primary/5"
                      : disabled
                      ? "border-border/40 bg-secondary/10 text-muted-foreground/50 cursor-not-allowed"
                      : "border-border bg-secondary/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm">{meta.cn}</div>
                    {disabled && <span className="text-[10px] text-muted-foreground">预留</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{meta.en}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1 leading-relaxed">{meta.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="input">
          <TabsList>
            <TabsTrigger value="input">数列输入</TabsTrigger>
            <TabsTrigger value="overview" disabled={!analysis}>三循环总览</TabsTrigger>
            <TabsTrigger value="compare" disabled={!analysis}>三循环对比</TabsTrigger>
            <TabsTrigger value="five-domain" disabled={!analysis}>五域完整</TabsTrigger>
            <TabsTrigger value="terminal" disabled={!analysis}>终端模式</TabsTrigger>
            <TabsTrigger value="privacy">隐私状态</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="mt-4">
            <div className="aether-card p-5">
              <FullSequenceInput initialRows={rows60 ?? undefined} onSave={handleSaveFull} />
            </div>
          </TabsContent>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {analysis && (
              <>
                <FullSubjectProfileCard analysis={analysis} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <SequenceCycleView cycle={analysis.cycles.C1} />
                  <SequenceCycleView cycle={analysis.cycles.C2} />
                  <SequenceCycleView cycle={analysis.cycles.C3} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            {analysis && <SubjectCycleComparison diffs={analysis.diffs} />}
          </TabsContent>

          <TabsContent value="five-domain" className="mt-4">
            {analysis && <FiveDomainFullView analysis={analysis} />}
          </TabsContent>

          <TabsContent value="terminal" className="mt-4">
            {analysis && <TerminalView analysis={analysis} />}
          </TabsContent>

          <TabsContent value="privacy" className="mt-4">
            <SubjectSequenceHealthPanel
              mode={mode}
              hasFullRecord={!!rows60}
              rowsCount={rows60?.length ?? 0}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-muted-foreground/70 italic leading-relaxed">
          预测 ≠ 断言未来；行动可改变结果。Demo Persona 仅用于演示，不代表真实主体命运。
        </div>
      </div>
    </>
  );
}

function FiveDomainFullView({ analysis }: { analysis: FullSubjectAnalysis }) {
  const { fiveDomain, cycles } = analysis;
  const maxAvg = Math.max(...FIVE_DOMAIN_KEYS.map((k) => fiveDomain.domainAverages[k])) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="aether-card p-5 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Five Domain · Full</div>
          <div className="font-display text-lg gold-text">五域完整分析</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{fiveDomain.domainInterpretation}</p>
        <div className="space-y-2 pt-2">
          {FIVE_DOMAIN_KEYS.map((k) => {
            const m = FIVE_DOMAIN_META[k];
            const v = fiveDomain.domainAverages[k];
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: m.colorVar }}>{m.cn} · {m.short}</span>
                  <span className="font-mono text-muted-foreground">{v.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-secondary/40 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(v / maxAvg) * 100}%`, backgroundColor: m.colorVar }} />
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{m.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="aether-card p-5 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cycle Trend</div>
          <div className="font-display text-lg">三循环趋势</div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2">域</th>
              <th className="text-right py-2">C1</th>
              <th className="text-right py-2">C2</th>
              <th className="text-right py-2">C3</th>
            </tr>
          </thead>
          <tbody>
            {FIVE_DOMAIN_KEYS.map((k) => (
              <tr key={k} className="border-b border-border/40">
                <td className="py-2" style={{ color: FIVE_DOMAIN_META[k].colorVar }}>{FIVE_DOMAIN_META[k].cn}</td>
                <td className="py-2 text-right font-mono">{cycles.C1.domainAverages[k].toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{cycles.C2.domainAverages[k].toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{cycles.C3.domainAverages[k].toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TerminalView({ analysis }: { analysis: FullSubjectAnalysis }) {
  const t = analysis.terminal;
  const total = 60;
  const sorted = Object.entries(t.terminalFrequencies)
    .map(([d, c]) => ({ d: +d, c }))
    .sort((a, b) => b.c - a.c);
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Terminal Pattern</div>
          <div className="font-display text-lg gold-text">终端模式分析</div>
        </div>
        <Badge variant="outline" className={t.singularityLikePattern ? "border-amber-500/50 text-amber-400" : "border-border text-muted-foreground"}>
          {t.singularityLikePattern ? "风域奇点 / 变局核" : "未形成收束"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <Stat label="主导终端" value={String(t.dominantTerminal)} accent />
        <Stat label="集中度" value={`${t.terminalConcentrationScore} / 100`} />
        <Stat label="样本量" value={`${total} 组`} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">终端数字分布（第 5 位 · 风域）</div>
        <div className="space-y-1.5">
          {sorted.map(({ d, c }) => (
            <div key={d} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-display gold-text">{d}</span>
              <div className="flex-1 h-2 bg-secondary/40 rounded overflow-hidden">
                <div className="h-full bg-primary/70 rounded" style={{ width: `${(c / total) * 100}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-muted-foreground">{c} 次</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{t.interpretation}</p>
      <p className="text-[10px] text-muted-foreground/70 italic">
        注：此处「奇点」「变局核」均为系统对终端高度收束模式的命名标识，不指向任何物理学概念。
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-base mt-0.5 ${accent ? "gold-text" : ""}`}>{value}</div>
    </div>
  );
}
