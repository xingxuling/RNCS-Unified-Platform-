import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { checkTranslationSafety } from "@/lib/i18n/safetyTranslationGuard";
import { SAFETY_TRANSLATION_RULES } from "@/constants/i18n/safetyTranslationRules";

export function SafetyTranslationCheck() {
  const [text, setText] = useState("运行 MSL 一定会改变现实，保证结果。");
  const r = checkTranslationSafety(text);
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="text-sm font-medium">Safety Translation Check · 安全翻译守卫</div>
      <Textarea rows={4} value={text} onChange={e => setText(e.target.value)} />
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={r.passed ? "default" : "destructive"}>{r.passed ? "PASS" : "FAIL"}</Badge>
        <span className="text-muted-foreground">命中 {r.violations.length} 条禁词规则</span>
      </div>
      <div className="space-y-1 text-xs">
        {r.violations.map((v, i) => (
          <div key={i} className="text-destructive">
            [{v.rule.severity}] {v.rule.description}（命中：{v.matched}）→ {v.rule.recommendation}
          </div>
        ))}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看全部规则（{SAFETY_TRANSLATION_RULES.length} 条）</summary>
        <ul className="mt-1 space-y-0.5 list-disc pl-4">
          {SAFETY_TRANSLATION_RULES.map(rule => (
            <li key={rule.id}><span className="text-muted-foreground">[{rule.severity}]</span> {rule.description}</li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
