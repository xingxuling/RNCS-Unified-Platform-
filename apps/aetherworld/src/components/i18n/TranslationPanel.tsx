import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/constants/i18n/supportedLanguages";
import { CONCEPT_TRANSLATION_LEVELS, ConceptTranslationLevel } from "@/constants/i18n/conceptTranslationLevels";
import { translate } from "@/lib/i18n/translationEngine";
import { checkTranslationSafety } from "@/lib/i18n/safetyTranslationGuard";

export function TranslationPanel() {
  const [text, setText] = useState("万物本身计算法 是用来看清一个东西本质的工具。");
  const [src, setSrc] = useState<LanguageCode>("zh-CN");
  const [tgt, setTgt] = useState<LanguageCode>("en");
  const [level, setLevel] = useState<ConceptTranslationLevel>("PLAIN_USER");
  const [safetySensitive, setSafetySensitive] = useState(true);

  const result = useMemo(
    () => translate({ sourceText: text, sourceLanguage: src, targetLanguage: tgt, userLevel: level, safetySensitive }),
    [text, src, tgt, level, safetySensitive],
  );
  const safety = useMemo(() => checkTranslationSafety(result.translatedText), [result.translatedText]);

  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="text-sm font-medium">Translation Engine · 翻译引擎</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <LangSelect label="源语言" value={src} onChange={setSrc} />
        <LangSelect label="目标语言" value={tgt} onChange={setTgt} />
        <LevelSelect value={level} onChange={setLevel} />
      </div>

      <Textarea rows={5} value={text} onChange={e => setText(e.target.value)} className="text-sm" />

      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={safetySensitive} onChange={e => setSafetySensitive(e.target.checked)} />
          安全敏感（开启时进行翻译禁词扫描）
        </label>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.translatedText).catch(() => {})}>
          复制译文
        </Button>
      </div>

      <Card className="p-3 bg-muted/40">
        <div className="text-xs text-muted-foreground mb-1">译文（目标语言：{result.targetLanguage} · {result.userLevel}）</div>
        <div className="text-sm whitespace-pre-wrap">{result.translatedText}</div>
      </Card>

      {result.appliedTerms.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground mr-2">命中术语：</span>
          {result.appliedTerms.map(t => <Badge key={t} variant="outline" className="mr-1">{t}</Badge>)}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="text-xs text-amber-500 space-y-0.5">
          {result.warnings.map((w, i) => <div key={i}>! {w}</div>)}
        </div>
      )}

      {safety.violations.length > 0 && (
        <div className="text-xs text-destructive space-y-0.5">
          <div className="font-medium">⚠ 安全翻译违规：</div>
          {safety.violations.map((v, i) => (
            <div key={i}>[{v.rule.severity}] {v.rule.description}（命中：{v.matched}） → {v.rule.recommendation}</div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LangSelect({ label, value, onChange }: { label: string; value: LanguageCode; onChange: (v: LanguageCode) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={(v) => onChange(v as LanguageCode)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map(l => (
            <SelectItem key={l.code} value={l.code}>{l.nativeName} · {l.code}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LevelSelect({ value, onChange }: { value: ConceptTranslationLevel; onChange: (v: ConceptTranslationLevel) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">用户层级</div>
      <Select value={value} onValueChange={(v) => onChange(v as ConceptTranslationLevel)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {CONCEPT_TRANSLATION_LEVELS.map(l => (
            <SelectItem key={l.level} value={l.level}>{l.zh}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
