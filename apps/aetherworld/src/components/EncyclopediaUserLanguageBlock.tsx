import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { Card } from "@/components/ui/card";

export function EncyclopediaUserLanguageBlock({ entry }: { entry: EncyclopediaEntry }) {
  return (
    <Card className="p-4 border-primary/30">
      <div className="text-[10px] tracking-[0.18em] text-primary mb-1">用户语言解释</div>
      <p className="text-sm leading-relaxed">{entry.userFriendlyExplanation}</p>
      {entry.exampleUsage.length > 0 && (
        <ul className="mt-3 text-xs text-muted-foreground space-y-1">
          {entry.exampleUsage.map((x, i) => <li key={i}>· {x}</li>)}
        </ul>
      )}
    </Card>
  );
}
