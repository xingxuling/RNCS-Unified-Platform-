import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { Card } from "@/components/ui/card";
import { Crown } from "lucide-react";

export function EncyclopediaFounderNote({ entry }: { entry: EncyclopediaEntry }) {
  if (!entry.founderExplanation) return null;
  return (
    <Card className="p-4 border-amber-500/40 bg-amber-500/5">
      <div className="flex items-center gap-2 text-amber-300 text-[10px] tracking-[0.18em] mb-2">
        <Crown className="w-3 h-3" /> 创始人备注
      </div>
      <p className="text-sm leading-relaxed">{entry.founderExplanation}</p>
    </Card>
  );
}
