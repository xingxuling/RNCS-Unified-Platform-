import { createFileRoute } from "@tanstack/react-router";
import { TranslationPanel } from "@/components/i18n/TranslationPanel";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export const Route = createFileRoute("/translation-engine")({
  head: () => ({
    meta: [
      { title: "翻译引擎 · Translation Engine" },
      { name: "description", content: "Aether 翻译与概念转译引擎：术语字典 + 安全守卫 + 用户层级。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <LanguageSwitcher />
      <TranslationPanel />
    </div>
  ),
});
