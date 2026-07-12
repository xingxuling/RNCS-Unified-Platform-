import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { ClientProfileSelector } from "@/components/ClientProfileSelector";
import { DeviceProfileSelector } from "@/components/DeviceProfileSelector";
import { MultiClientUIFitPanel } from "@/components/MultiClientUIFitPanel";
import { DeviceFitMatrix } from "@/components/DeviceFitMatrix";
import { RoleUIAccessMatrix } from "@/components/RoleUIAccessMatrix";
import { CognitiveLoadMeter } from "@/components/CognitiveLoadMeter";
import { UIExposureRiskPanel } from "@/components/UIExposureRiskPanel";
import { ResponsivePreviewChecklist } from "@/components/ResponsivePreviewChecklist";
import { ClientJourneyPreview } from "@/components/ClientJourneyPreview";
import { UIFitRecommendationBoard } from "@/components/UIFitRecommendationBoard";
import { UIFitPromptGenerator } from "@/components/UIFitPromptGenerator";

import {
  evaluateUIFit, buildFitMatrix,
  uiFitGatesForBeta, uiFitGatesForVersion,
} from "@/lib/multiClientUIFitEngine";

export const Route = createFileRoute("/ui-fit")({
  head: () => ({
    meta: [
      { title: "多端 UI 适评 · UI Fit — Aether Fate Engine" },
      { name: "description", content: "Multi-Client UI Fit Evaluation Engine：评估不同用户端、设备端、权限端的 UI 适配度，输出风险与修复提示词。" },
    ],
  }),
  component: UIFitPage,
});

function UIFitPage() {
  const [clientId, setClientId] = useState("light_user");
  const [deviceId, setDeviceId] = useState("laptop_standard");
  const [hasSafety, setHasSafety] = useState(true);
  const [hasFeedback, setHasFeedback] = useState(true);
  const [hasDemoBadge, setHasDemoBadge] = useState(true);
  const [exposesFull60, setExposesFull60] = useState(false);
  const [sidebarItemCount, setSidebarItemCount] = useState(25);

  const ctx = {
    hasSafetyBanner: hasSafety,
    hasFeedbackEntry: hasFeedback,
    hasDemoRealBadge: hasDemoBadge,
    exposesFull60Editor: exposesFull60,
    sidebarItemCount,
  };

  const result = useMemo(() => evaluateUIFit(clientId, deviceId, ctx), [clientId, deviceId, ctx]);
  const matrix = useMemo(() => buildFitMatrix(ctx), [ctx]);
  const betaGates = useMemo(() => uiFitGatesForBeta(matrix), [matrix]);
  const versionGates = useMemo(() => uiFitGatesForVersion(matrix), [matrix]);

  return (
    <>
      <PageHeader
        caption="Multi-Client UI Fit Evaluation Engine · 多用户端 UI 适评算法"
        title="UI Fit · 多端 UI 适评"
        subtitle="根据用户端、设备端、权限端、认知负载与地区语境，评估 UI 是否可理解、可操作、可回验、可安全使用。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* 选择器 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ClientProfileSelector value={clientId} onChange={setClientId} />
          <DeviceProfileSelector value={deviceId} onChange={setDeviceId} />
        </div>

        {/* 上下文开关 */}
        <div className="aether-card p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <ToggleRow label="安全边界" value={hasSafety} onChange={setHasSafety} />
          <ToggleRow label="回验入口" value={hasFeedback} onChange={setHasFeedback} />
          <ToggleRow label="Demo/Real 徽章" value={hasDemoBadge} onChange={setHasDemoBadge} />
          <ToggleRow label="开放 Full 60 编辑" value={exposesFull60} onChange={setExposesFull60} />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">侧栏项数</div>
            <input
              type="number"
              min={1}
              max={60}
              value={sidebarItemCount}
              onChange={e => setSidebarItemCount(Number(e.target.value) || 0)}
              className="w-20 bg-background/60 border border-border/60 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>

        <Tabs defaultValue="panel">
          <TabsList>
            <TabsTrigger value="panel">适评面板</TabsTrigger>
            <TabsTrigger value="matrix">多端矩阵</TabsTrigger>
            <TabsTrigger value="role">角色权限</TabsTrigger>
            <TabsTrigger value="risk">暴露风险</TabsTrigger>
            <TabsTrigger value="journey">旅程预览</TabsTrigger>
            <TabsTrigger value="prompt">修复提示词</TabsTrigger>
            <TabsTrigger value="ext">接入 Beta / 版本</TabsTrigger>
          </TabsList>

          <TabsContent value="panel" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><MultiClientUIFitPanel result={result} /></div>
              <div className="space-y-4">
                <CognitiveLoadMeter result={result} />
                <ResponsivePreviewChecklist result={result} />
              </div>
            </div>
            <UIFitRecommendationBoard result={result} />
          </TabsContent>

          <TabsContent value="matrix" className="mt-4">
            <DeviceFitMatrix context={ctx} />
          </TabsContent>

          <TabsContent value="role" className="mt-4">
            <RoleUIAccessMatrix />
          </TabsContent>

          <TabsContent value="risk" className="mt-4">
            <UIExposureRiskPanel result={result} />
          </TabsContent>

          <TabsContent value="journey" className="mt-4">
            <ClientJourneyPreview clientId={clientId} />
          </TabsContent>

          <TabsContent value="prompt" className="mt-4">
            <UIFitPromptGenerator result={result} />
          </TabsContent>

          <TabsContent value="ext" className="mt-4 space-y-4">
            <div className="aether-card p-5">
              <div className="font-display text-base mb-2">Beta Launch 接入</div>
              <ul className="text-xs space-y-1 text-foreground/85">
                <li>· 公开 Demo 开放：{betaGates.openPublicDemo ? "允许" : "暂不开放"}</li>
                <li>· Creator Private Alpha：{betaGates.openCreatorAlpha ? "允许" : "暂不开放"}</li>
                <li>· 企业模式锁定：{betaGates.blockEnterpriseUnlessSafeMode ? "必须启用 Safe Mode" : "通过"}</li>
                <li>· 移动端内测：{betaGates.blockMobileSmall ? "不推荐 Mobile Small" : "可推进"}</li>
              </ul>
            </div>

            <div className="aether-card p-5">
              <div className="font-display text-base mb-2">Version Iteration 接入</div>
              <ul className="text-xs space-y-1 text-foreground/85">
                <li>· 核心用户端最低 Fit：{versionGates.minCoreScore}/100</li>
                <li>· 是否可进入 Guided Beta：{versionGates.canGuidedBeta ? "可以" : "保持 Private Beta"}</li>
                <li>· 提升 v1.0 Readiness：{versionGates.boostsV1Readiness ? "是（Demo/Light 路径 ≥ 75）" : "否"}</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-muted-foreground/70 italic">
          UI 适评不是审美评分，它衡量「不同人在不同设备上能否安全使用此系统」。
        </div>
      </div>
    </>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between gap-2 rounded border px-3 py-2 text-xs transition-colors ${
        value ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5" : "border-border/60 text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px]">{value ? "ON" : "OFF"}</span>
    </button>
  );
}
