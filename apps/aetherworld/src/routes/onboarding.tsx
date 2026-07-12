import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SimpleStartPanel } from "@/components/SimpleStartPanel";
import { FirstMinuteFlow } from "@/components/FirstMinuteFlow";
import { DemoFirstEntry } from "@/components/DemoFirstEntry";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingExplanationCard } from "@/components/OnboardingExplanationCard";
import { NextBestActionCard } from "@/components/NextBestActionCard";
import { BeginnerModeToggle } from "@/components/BeginnerModeToggle";
import { OnboardingFrictionAudit } from "@/components/OnboardingFrictionAudit";
import {
  getOnboardingStage,
  type OnboardingStage,
} from "@/constants/onboardingUserStates";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "快速开始 · Onboarding — Aether Fate Engine" },
      { name: "description", content: "入门使用流程简化引擎：1 分钟看一个示例判断，先体验 Demo，再创建个人模型。" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const [stage, setStage] = useState<OnboardingStage>("FRESH_VISITOR");
  useEffect(() => { setStage(getOnboardingStage()); }, []);

  return (
    <div>
      <PageHeader
        caption="Onboarding Flow Simplification Engine · 入门使用流程简化"
        title="快速开始"
        subtitle="新用户不必理解所有计算法，1 分钟内即可看到一个示例判断，再决定是否创建个人模型。"
      />
      <div className="px-6 md:px-10 py-6 space-y-6">
        <SimpleStartPanel compact />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="flow">
              <TabsList>
                <TabsTrigger value="flow">1 分钟流程</TabsTrigger>
                <TabsTrigger value="demo">Demo 示例</TabsTrigger>
                <TabsTrigger value="explain">这是什么</TabsTrigger>
                <TabsTrigger value="audit">摩擦审计</TabsTrigger>
              </TabsList>
              <TabsContent value="flow" className="pt-4">
                <FirstMinuteFlow />
              </TabsContent>
              <TabsContent value="demo" className="pt-4">
                <DemoFirstEntry />
              </TabsContent>
              <TabsContent value="explain" className="pt-4">
                <OnboardingExplanationCard />
              </TabsContent>
              <TabsContent value="audit" className="pt-4">
                <OnboardingFrictionAudit />
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-4">
            <NextBestActionCard stage={stage} />
            <OnboardingProgress stage={stage} />
            <BeginnerModeToggle />
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground/70">
          注：入门流畅度（Onboarding Simplicity Score）会被 Multi-Client UI Fit、Language Fit、
          Software QA、Beta Launch 与 Version Iteration 读取，用于判断是否可进入 Guided Beta / v1.0 Candidate。
        </div>
      </div>
    </div>
  );
}
