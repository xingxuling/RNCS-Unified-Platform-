import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { LanguageFitPanel } from "@/components/LanguageFitPanel";
import { JargonDensityMeter } from "@/components/JargonDensityMeter";
import { TerminologyTranslator } from "@/components/TerminologyTranslator";
import { UserLanguagePreview } from "@/components/UserLanguagePreview";
import { LanguageModeToggle } from "@/components/LanguageModeToggle";
import { TermGlossaryCard } from "@/components/TermGlossaryCard";
import { LanguageRewritePromptGenerator } from "@/components/LanguageRewritePromptGenerator";

import {
  evaluateLanguageFit,
  type ClientType,
  type PageType,
} from "@/lib/productUserLanguageEngine";
import type { UserLanguageLevel } from "@/constants/userLanguageLevels";
import { LANGUAGE_REWRITE_RULES } from "@/constants/languageRewriteRules";

const SAMPLE_TEXT = `本页将通过定数计算法判断本次预测是否进入已定状态，并结合分支塌缩与信号净化输出主体数列对应的行动许可。若回验显示风域奇点出现，请进入 Full 60 完整主体模式，并参考多计算法内核给出的事件算法结果。`;

const CLIENT_OPTIONS: { id: ClientType; cn: string }[] = [
  { id: "demo_visitor", cn: "Demo 访客" },
  { id: "light_user",   cn: "Light 用户" },
  { id: "full_subject", cn: "Full 用户" },
  { id: "creator_user", cn: "创作者" },
  { id: "research_user",cn: "研究者" },
  { id: "enterprise_user", cn: "企业用户" },
  { id: "admin_user",   cn: "Admin" },
  { id: "founder_user", cn: "Founder" },
];

const PAGE_OPTIONS: { id: PageType; cn: string }[] = [
  { id: "user_main",  cn: "主流程" },
  { id: "mobile",     cn: "移动端" },
  { id: "enterprise", cn: "企业端" },
  { id: "demo",       cn: "Demo" },
  { id: "docs",       cn: "文档页" },
  { id: "advanced",   cn: "高阶页" },
];

export const Route = createFileRoute("/language-fit")({
  head: () => ({
    meta: [
      { title: "产品与用户语言计算法 · Language Fit — Aether Fate Engine" },
      { name: "description", content: "Product–User Language Translation Engine：根据用户类型、设备、页面风险与认知负载，将系统术语翻译成合适的用户语言。" },
    ],
  }),
  component: LanguageFitPage,
});

function LanguageFitPage() {
  const [userType, setUserType] = useState<ClientType>("light_user");
  const [pageType, setPageType] = useState<PageType>("user_main");
  const [text, setText] = useState(SAMPLE_TEXT);
  const [level, setLevel] = useState<UserLanguageLevel>("USER_FRIENDLY");

  const result = useMemo(
    () => evaluateLanguageFit({ userType, pageType, pageText: text }),
    [userType, pageType, text],
  );

  return (
    <div>
      <PageHeader
        caption="Product–User Language Translation Engine"
        title="产品与用户语言计算法"
        subtitle="判断当前用户能否看懂系统术语，并自动选择合适的语言层级；为 Prompt Forge / QA / Multi-Client UI Fit 提供语言适配信号。"
      />
      <div className="px-6 md:px-10 py-6 space-y-6">

        <Card className="p-5 space-y-4 aether-card">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">User & Page Selector · 用户与页面</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">用户类型</div>
              <div className="flex flex-wrap gap-2">
                {CLIENT_OPTIONS.map((c) => (
                  <Button key={c.id} size="sm" variant={userType === c.id ? "default" : "outline"} onClick={() => setUserType(c.id)}>{c.cn}</Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">页面类型</div>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((p) => (
                  <Button key={p.id} size="sm" variant={pageType === p.id ? "default" : "outline"} onClick={() => setPageType(p.id)}>{p.cn}</Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <LanguageFitPanel result={result} />
          <JargonDensityMeter result={result} />
          <LanguageModeToggle active={level} onChange={setLevel} />
        </div>

        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">用户语言预览</TabsTrigger>
            <TabsTrigger value="translator">术语翻译器</TabsTrigger>
            <TabsTrigger value="glossary">术语解释卡</TabsTrigger>
            <TabsTrigger value="rules">重写规则</TabsTrigger>
            <TabsTrigger value="prompt">下一轮提示词</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="space-y-4">
            <UserLanguagePreview text={text} onTextChange={setText} level={level} />
          </TabsContent>
          <TabsContent value="translator">
            <TerminologyTranslator />
          </TabsContent>
          <TabsContent value="glossary">
            <TermGlossaryCard />
          </TabsContent>
          <TabsContent value="rules">
            <Card className="p-5 space-y-3 aether-card">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Rewrite Recommendation Board · 重写规则</div>
              <ul className="space-y-2 text-sm">
                {LANGUAGE_REWRITE_RULES.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2">
                    <span>{r.cn}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{r.severity}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
          <TabsContent value="prompt">
            <LanguageRewritePromptGenerator userType={userType} pageType={pageType} />
          </TabsContent>
        </Tabs>

        <div className="text-[10px] text-muted-foreground/70">
          注：本计算法只描述术语在不同用户下的合适表达，不改变系统真实判断结果；它服务于 Prompt Forge / QA / UI Fit / Manual Calculus / Beta Launch / Version Iteration。
        </div>
      </div>
    </div>
  );
}
