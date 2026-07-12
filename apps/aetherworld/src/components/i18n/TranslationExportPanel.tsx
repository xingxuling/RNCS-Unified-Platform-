import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES } from "@/constants/i18n/supportedLanguages";
import { exportLanguageBundle, exportTerminologyJSON } from "@/lib/i18n/terminologyDictionary";
import { checkConsistency, checkTerminologyConsistency } from "@/lib/i18n/languageConsistencyChecker";

function download(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TranslationExportPanel() {
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="text-sm font-medium">导出 · Export</div>
      <div className="text-xs text-muted-foreground">本地化数据按术语字典生成，未翻译键会出现在 untranslated_keys_report.md。</div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => download("terminology.json", exportTerminologyJSON())}>
          terminology.json
        </Button>
        {SUPPORTED_LANGUAGES.map(l => (
          <Button key={l.code} size="sm" variant="outline"
            onClick={() => download(`${l.code}.json`, exportLanguageBundle(l.code))}>
            {l.code}.json
          </Button>
        ))}
        <Button size="sm" variant="outline"
          onClick={() => download("untranslated_keys_report.md", checkConsistency().markdown, "text/markdown")}>
          untranslated_keys_report.md
        </Button>
        <Button size="sm" variant="outline"
          onClick={() => download("terminology_consistency_report.md", checkTerminologyConsistency().markdown, "text/markdown")}>
          terminology_consistency_report.md
        </Button>
      </div>
    </Card>
  );
}
