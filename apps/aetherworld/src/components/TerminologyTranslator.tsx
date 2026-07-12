import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { translateTerm } from "@/lib/productUserLanguageEngine";
import { USER_LANGUAGE_LEVEL_META, type UserLanguageLevel } from "@/constants/userLanguageLevels";
import { findTerm } from "@/constants/productTerminologyMap";

const LEVELS: UserLanguageLevel[] = [
  "RAW_SYSTEM","PROFESSIONAL","USER_FRIENDLY","ACTION_ORIENTED","ENTERPRISE_SAFE","EDUCATIONAL","MICROCOPY"
];

export function TerminologyTranslator() {
  const [term, setTerm] = useState("定数计算法");
  const entry = findTerm(term);

  return (
    <Card className="p-5 space-y-4 aether-card">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Terminology Translator · 术语翻译器</div>
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="输入系统术语，例如：定数计算法" />
      </div>
      {!entry && (
        <div className="text-xs text-muted-foreground">未在术语表中找到「{term}」。</div>
      )}
      {entry && (
        <div className="grid gap-3">
          {LEVELS.map((lv) => (
            <div key={lv} className="rounded-md border border-border/60 px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {USER_LANGUAGE_LEVEL_META[lv].en} · {USER_LANGUAGE_LEVEL_META[lv].cn}
                </span>
                <span className="text-[10px] text-muted-foreground/60">{USER_LANGUAGE_LEVEL_META[lv].audience}</span>
              </div>
              <div className="text-sm">{translateTerm(term, lv)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
