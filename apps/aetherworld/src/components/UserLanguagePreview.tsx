import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { translateText, plainRewrite } from "@/lib/productUserLanguageEngine";
import type { UserLanguageLevel } from "@/constants/userLanguageLevels";

export function UserLanguagePreview({
  text,
  onTextChange,
  level,
}: {
  text: string;
  onTextChange: (s: string) => void;
  level: UserLanguageLevel;
}) {
  const translated = translateText(text, level);
  const plain = plainRewrite(text);

  return (
    <Card className="p-5 space-y-4 aether-card">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">User Language Preview · 用户语言预览</div>
      <Textarea
        rows={4}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="粘贴页面文案，预览不同语言层级版本…"
      />
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{level} 版本</div>
          <div>{translated || <span className="text-muted-foreground">（空）</span>}</div>
        </div>
        <div className="rounded-md border border-border/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">默认普通主流程降级</div>
          <div>{plain || <span className="text-muted-foreground">（空）</span>}</div>
        </div>
      </div>
    </Card>
  );
}
