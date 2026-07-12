import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { ContextualManualHint } from "@/components/ContextualManualHint";
import { QAHealthPanel } from "@/components/QAHealthPanel";
import { QAModuleScanner } from "@/components/QAModuleScanner";
import { QARouteScanner } from "@/components/QARouteScanner";
import { QADataIntegrityPanel } from "@/components/QADataIntegrityPanel";
import { QAIsolationAudit } from "@/components/QAIsolationAudit";
import { QASafetyCoveragePanel } from "@/components/QASafetyCoveragePanel";
import { QAFeedbackEntryAudit } from "@/components/QAFeedbackEntryAudit";
import { QADocumentationConsistency } from "@/components/QADocumentationConsistency";
import { QAFixPriorityBoard } from "@/components/QAFixPriorityBoard";
import { QAFixPromptGenerator } from "@/components/QAFixPromptGenerator";
import { QARegressionChecklist } from "@/components/QARegressionChecklist";
import {
  runSoftwareQAScan,
  type QAIssue,
} from "@/lib/softwareQAFeedbackCalculus";
import { getSequenceMode } from "@/lib/realSubjectStore";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/software-qa")({
  head: () => ({
    meta: [
      { title: "软件测试反馈 · Software QA — Aether Fate Engine" },
      {
        name: "description",
        content:
          "软件测试反馈计算引擎：扫描路由、模块接入、数据完整性、Demo/Real 隔离、安全边界、回验入口、文档一致性，并生成 Lovable 修复提示词与回归测试清单。",
      },
    ],
  }),
  component: SoftwareQAPage,
});

function SoftwareQAPage() {
  const [tick, setTick] = useState(0);
  const [focusIssue, setFocusIssue] = useState<QAIssue | null>(null);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k) keys.push(k);
    }
    setExistingKeys(keys);
  }, [tick]);

  const result = useMemo(
    () => runSoftwareQAScan({ existingStorageKeys: existingKeys }),
    [existingKeys, tick],
  );

  const mode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  return (
    <>
      <PageHeader
        caption="Software QA Feedback Calculus · 软件测试反馈计算引擎"
        title="软件测试反馈"
        subtitle="扫描路由 / 模块 / 数据 / 隔离 / 安全 / 回验 / 文档 / 用户路径，输出 QA Health Score 与下一轮 Lovable 修复提示词。"
      >
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setTick((t) => t + 1)}>
          <RefreshCcw className="w-3 h-3 mr-1" /> 重新扫描
        </Button>
      </PageHeader>

      <div className="p-6 md:p-10 space-y-6">
        <ContextualManualHint
          currentPage="Software QA"
          subjectMode={mode}
          userStage="ADVANCED_USER"
        />
        <SafetyBoundaryBanner
          page="Version Iteration"
          subjectMode={mode}
          forceLevel="MEDIUM"
          compact
        />

        <QAHealthPanel result={result} />

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="aether-card flex-wrap h-auto">
            <TabsTrigger value="priority">修复优先级</TabsTrigger>
            <TabsTrigger value="modules">模块扫描</TabsTrigger>
            <TabsTrigger value="routes">路由扫描</TabsTrigger>
            <TabsTrigger value="isolation">隔离审计</TabsTrigger>
            <TabsTrigger value="safety">安全覆盖</TabsTrigger>
            <TabsTrigger value="feedback">回验入口</TabsTrigger>
            <TabsTrigger value="data">数据完整性</TabsTrigger>
            <TabsTrigger value="docs">文档一致性</TabsTrigger>
            <TabsTrigger value="prompt">修复提示词</TabsTrigger>
            <TabsTrigger value="regression">回归清单</TabsTrigger>
          </TabsList>

          <TabsContent value="priority" className="mt-4">
            <QAFixPriorityBoard
              result={result}
              onPickIssue={(it) => setFocusIssue(it)}
            />
          </TabsContent>
          <TabsContent value="modules" className="mt-4">
            <QAModuleScanner result={result} />
          </TabsContent>
          <TabsContent value="routes" className="mt-4">
            <QARouteScanner result={result} />
          </TabsContent>
          <TabsContent value="isolation" className="mt-4">
            <QAIsolationAudit result={result} />
          </TabsContent>
          <TabsContent value="safety" className="mt-4">
            <QASafetyCoveragePanel result={result} />
          </TabsContent>
          <TabsContent value="feedback" className="mt-4">
            <QAFeedbackEntryAudit result={result} />
          </TabsContent>
          <TabsContent value="data" className="mt-4">
            <QADataIntegrityPanel result={result} existingKeys={existingKeys} />
          </TabsContent>
          <TabsContent value="docs" className="mt-4">
            <QADocumentationConsistency result={result} />
          </TabsContent>
          <TabsContent value="prompt" className="mt-4">
            <QAFixPromptGenerator result={result} focusIssue={focusIssue} />
          </TabsContent>
          <TabsContent value="regression" className="mt-4">
            <QARegressionChecklist />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
