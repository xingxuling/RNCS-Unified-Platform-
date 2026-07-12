import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { USER_LANGUAGE_LEVEL_META, type UserLanguageLevel } from "@/constants/userLanguageLevels";

const SIMPLE_MODES: { id: string; cn: string; levels: UserLanguageLevel[] }[] = [
  { id: "simple",    cn: "简单模式",  levels: ["USER_FRIENDLY", "ACTION_ORIENTED"] },
  { id: "professional", cn: "专业模式", levels: ["PROFESSIONAL"] },
  { id: "advanced", cn: "高阶模式", levels: ["RAW_SYSTEM", "EDUCATIONAL"] },
  { id: "enterprise", cn: "企业模式", levels: ["ENTERPRISE_SAFE"] },
  { id: "learning",  cn: "学习模式",  levels: ["RAW_SYSTEM", "USER_FRIENDLY", "EDUCATIONAL"] },
];

export function LanguageModeToggle({
  active,
  onChange,
}: {
  active: UserLanguageLevel;
  onChange: (lv: UserLanguageLevel) => void;
}) {
  return (
    <Card className="p-4 space-y-3 aether-card">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Language Mode · 语言模式</div>
      <div className="flex flex-wrap gap-2">
        {SIMPLE_MODES.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={m.levels.includes(active) ? "default" : "outline"}
            onClick={() => onChange(m.levels[0])}
          >
            {m.cn}
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        当前层级：{active} · {USER_LANGUAGE_LEVEL_META[active].cn} · 目标人群：{USER_LANGUAGE_LEVEL_META[active].audience}
      </div>
    </Card>
  );
}
