import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/constants/i18n/supportedLanguages";
import {
  getCurrentLanguage, setCurrentLanguage, onLanguageChange,
  getLockedLanguage,
} from "@/lib/i18n/languageProfileEngine";

interface Props {
  compact?: boolean;
  onChange?: (code: LanguageCode) => void;
}

export function LanguageSwitcher({ compact, onChange }: Props) {
  const [lang, setLang] = useState<LanguageCode>("zh-CN");
  const [locked, setLocked] = useState<LanguageCode | null>(null);

  useEffect(() => {
    setLang(getCurrentLanguage());
    setLocked(getLockedLanguage());
    const off = onLanguageChange(c => setLang(c));
    return () => { off; };
  }, []);

  const handle = (v: string) => {
    const code = v as LanguageCode;
    setCurrentLanguage(code);
    setLang(code);
    onChange?.(code);
  };

  return (
    <div className={compact ? "" : "flex items-center gap-2"}>
      {!compact && <span className="text-xs text-muted-foreground">语言 / Language</span>}
      <Select value={lang} onValueChange={handle}>
        <SelectTrigger className={compact ? "h-8 w-36 text-xs" : "w-56"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map(l => (
            <SelectItem key={l.code} value={l.code}>
              {l.nativeName} <span className="text-muted-foreground text-xs">· {l.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {locked && (
        <span className="text-[10px] text-amber-500">Founder 锁定：{locked}</span>
      )}
    </div>
  );
}
