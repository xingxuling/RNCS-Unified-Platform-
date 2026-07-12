import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFounderState } from "@/hooks/useFounderState";

export function FounderModeBadge({ compact = false }: { compact?: boolean }) {
  const { active, remainingMinutes } = useFounderState();
  if (!active) return null;
  return (
    <Badge
      variant="outline"
      className="border-amber-500/50 text-amber-400 bg-amber-500/5 gap-1.5"
      title="创始人模式已激活 · 高阶功能已解锁"
    >
      <Crown className="w-3 h-3" />
      {compact ? "Founder" : `创始人模式 · 剩余 ${remainingMinutes} 分钟`}
    </Badge>
  );
}
