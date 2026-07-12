import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AbstractPromptForgePanel } from "@/components/AbstractPromptForgePanel";
import { PromptTemplateLibrary } from "@/components/PromptTemplateLibrary";
import { TemplateEffectivenessPanel } from "@/components/TemplateEffectivenessPanel";
import { CURATED_TEMPLATE_COUNT, TOTAL_TEMPLATE_FAMILY_COUNT } from "@/constants/promptTemplateFamilies";
import { PROMPT_DOMAINS } from "@/constants/promptDomains";

export const Route = createFileRoute("/abstract-prompt-forge")({
  head: () => ({
    meta: [
      { title: "抽象提示词锻造炉 · Abstract Prompt Forge · Aether Fate Engine" },
      { name: "description", content: "跨领域抽象迁移提示词系统：50 个领域 × 6 模板族 = 300 种模板，按目标、用户语言、回验结果动态生成。" },
    ],
  }),
  component: AbstractPromptForgePage,
});

type Tab = "forge" | "library" | "effectiveness";

function AbstractPromptForgePage() {
  const [tab, setTab] = useState<Tab>("forge");

  return (
    <>
      <PageHeader
        caption="Abstract Transfer Prompt Calculus · 抽象迁移化提示词计算引擎"
        title="抽象提示词锻造炉"
        subtitle={`跨领域抽象迁移：${PROMPT_DOMAINS.length} 个领域 × 6 模板族 = ${TOTAL_TEMPLATE_FAMILY_COUNT} 种模板族（已预置 ${CURATED_TEMPLATE_COUNT} 个核心模板）。`}
      />

      <div className="px-6 md:px-10 py-6 space-y-6">
        <div className="flex gap-2">
          {([
            ["forge", "抽象迁移生成"],
            ["library", "模板库 · Library"],
            ["effectiveness", "有效性回验"],
          ] as Array<[Tab, string]>).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`text-xs px-3 py-1.5 rounded border ${
                tab === k
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/40 hover:border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "forge" && <AbstractPromptForgePanel />}
        {tab === "library" && <PromptTemplateLibrary />}
        {tab === "effectiveness" && <TemplateEffectivenessPanel />}
      </div>
    </>
  );
}
