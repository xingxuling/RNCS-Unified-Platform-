import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/constants/i18n/supportedLanguages";
import { localizeConcept } from "@/lib/i18n/conceptLocalizationEngine";
import { ConceptTranslationLevel } from "@/constants/i18n/conceptTranslationLevels";
import { PRODUCT_TERMS } from "@/constants/i18n/productTerminology";

export function LanguagePreviewTabs({ termId = "thing-itself-calculus", level = "PLAIN_USER" as ConceptTranslationLevel }) {
  const [active, setActive] = useState<LanguageCode>("zh-CN");
  const [tid, setTid] = useState(termId);
  const result = localizeConcept(tid, active, level);

  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm font-medium">语言预览 · Language Preview</div>
          <div className="text-xs text-muted-foreground">同一概念在不同语言下的呈现</div>
        </div>
        <select
          value={tid}
          onChange={e => setTid(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-background"
        >
          {PRODUCT_TERMS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-1">
        {SUPPORTED_LANGUAGES.map(l => (
          <Badge
            key={l.code}
            variant={active === l.code ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActive(l.code)}
          >
            {l.nativeName}
          </Badge>
        ))}
      </div>

      <Card className="p-3 bg-muted/30 space-y-1">
        <div className="text-base font-medium">{result.recommendedUIName}</div>
        <div className="text-xs text-muted-foreground">{result.plainExplanation}</div>
        <div className="text-xs">{result.advancedExplanation}</div>
        {result.fallbackUsed && <Badge variant="outline">fallback</Badge>}
      </Card>
    </Card>
  );
}
