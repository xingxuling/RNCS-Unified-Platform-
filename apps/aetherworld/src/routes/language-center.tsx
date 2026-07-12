import { createFileRoute } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LanguagePreviewTabs } from "@/components/i18n/LanguagePreviewTabs";
import { TranslationExportPanel } from "@/components/i18n/TranslationExportPanel";
import { SafetyTranslationCheck } from "@/components/i18n/SafetyTranslationCheck";

export const Route = createFileRoute("/language-center")({
  head: () => ({
    meta: [
      { title: "语言中心 · Language Center" },
      { name: "description", content: "Aether 多语言中心：语言切换、概念本地化预览、安全翻译检查与导出。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <LanguageSwitcher />
      <LanguagePreviewTabs />
      <SafetyTranslationCheck />
      <TranslationExportPanel />
    </div>
  ),
});
