import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickStartGuidePanel } from "@/components/QuickStartGuidePanel";
import { PredictionUseGuide } from "@/components/PredictionUseGuide";
import { DataPrivacyPanel } from "@/components/DataPrivacyPanel";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { DemoRealIsolationBadge } from "@/components/DemoRealIsolationBadge";
import { ContextualManualHint } from "@/components/ContextualManualHint";
import { ISOLATION_MODE_META, ISOLATION_RULES } from "@/constants/demoRealIsolationRules";
import { getSequenceMode } from "@/lib/realSubjectStore";
import { AlertTriangle, BookOpen, MessageSquarePlus, Ban } from "lucide-react";

export const Route = createFileRoute("/usage-safety")({
  head: () => ({
    meta: [
      { title: "使用与安全 · Usage & Safety — Aether Fate Engine" },
      {
        name: "description",
        content:
          "使用手册计算法、安全边界、回验入口规范、Demo / Real 隔离规范，集中入口。",
      },
    ],
  }),
  component: UsageSafetyPage,
});

function UsageSafetyPage() {
  const mode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  return (
    <>
      <PageHeader
        caption="Manual Calculus · Usage & Safety"
        title="使用与安全"
        subtitle="使用手册计算法 · 安全边界 · 回验入口规范 · Demo / Real 隔离规范"
      >
        <DemoRealIsolationBadge mode={mode} withDescription />
      </PageHeader>

      <div className="p-6 md:p-10 space-y-6">
        <ContextualManualHint
          currentPage="Usage & Safety"
          subjectMode={mode}
          userStage="FIRST_VISIT"
        />

        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="aether-card flex-wrap h-auto">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="modes">主体模式</TabsTrigger>
            <TabsTrigger value="predictions">如何阅读预测</TabsTrigger>
            <TabsTrigger value="feedback">回验指南</TabsTrigger>
            <TabsTrigger value="safety">安全边界</TabsTrigger>
            <TabsTrigger value="privacy">隐私与数据</TabsTrigger>
            <TabsTrigger value="donts">不要做什么</TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="mt-4">
            <QuickStartGuidePanel />
          </TabsContent>

          <TabsContent value="modes" className="mt-4">
            <div className="aether-card-elevated p-5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject Modes · 四种主体模式</div>
              <h2 className="font-display text-lg gold-text mt-1">Demo / Light 20 / Full 60 / Imported</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {Object.values(ISOLATION_MODE_META).map((m) => (
                  <div key={m.key} className="p-4 rounded-md border border-border/60 bg-secondary/20">
                    <div className="flex items-center justify-between gap-2">
                      <DemoRealIsolationBadge mode={m.key} />
                      <span className="text-[10px] text-muted-foreground">{m.isRealSubject ? "真实主体" : "模拟"}</span>
                    </div>
                    <div className="text-sm font-medium mt-2">{m.fullLabel}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-md border border-border/60 bg-background/40">
                <div className="text-[11px] font-medium mb-1.5">隔离原则</div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                  {ISOLATION_RULES.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="mt-4 space-y-3">
            <PredictionUseGuide />
            <SafetyBoundaryBanner page="Prediction Detail" subjectMode={mode} />
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <div className="aether-card-elevated p-5">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <div className="text-sm font-medium">回验是系统进化的核心</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                每一次回验都会通过回验权重计算法修正未来预测中各计算法、常数、事件类型、地区体验、提示词生成与定数判断的权重。
              </p>
              <ul className="text-xs text-muted-foreground mt-3 space-y-1.5 list-disc pl-4">
                <li>快速回验：命中 / 部分命中 / 未命中 / 时间偏差 / 类型漂移 / 行动改变 / 噪声。</li>
                <li>详细回验：在预测详情或回验中心补充强度、噪声来源、行动记录与备注。</li>
                <li>系统在回验数量不足 10 条时会标记「模型未充分校准」。</li>
                <li>Demo 回验不会进入真实主体模型；真实主体回验不会污染 Demo。</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="mt-4 space-y-3">
            <SafetyBoundaryBanner page="Real Subject" subjectMode="FULL_60" determinationLocked forceLevel="HIGH" />
            <SafetyBoundaryBanner page="Beta Launch" subjectMode={mode} forceLevel="MEDIUM" />
            <SafetyBoundaryBanner page="Dashboard"  subjectMode={mode} forceLevel="LOW" />
            <div className="aether-card p-4 text-[11px] text-muted-foreground leading-relaxed">
              安全边界 = 系统对自己边界的诚实声明。Aether 提供结构化预测与行动提示，不提供医疗 / 法律 / 金融 / 投资 / 心理诊断建议。
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="mt-4">
            <DataPrivacyPanel />
          </TabsContent>

          <TabsContent value="donts" className="mt-4">
            <div className="aether-card-elevated p-5">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-300" />
                <div className="text-sm font-medium">What Not To Do · 不要做什么</div>
              </div>
              <ul className="text-xs text-muted-foreground mt-3 space-y-2">
                <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />不要把预测结果当作绝对命令。</li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />不要用系统做医疗 / 金融 / 法律决策。</li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />不要公开真实 Full 60 数列。</li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />不要不回验就长期依赖预测。</li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />不要把 Demo 当作真实主体。</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="aether-card p-4 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <BookOpen className="w-3.5 h-3.5 mt-0.5" />
          《使用手册计算法》《Demo / Real 隔离规范》《回验入口规范》已同步至产品文档中心。可前往 /docs 查看完整章节。
        </div>
      </div>
    </>
  );
}
