import { Badge } from "@/components/ui/badge";
import type { KnowledgeTrustLevel } from "@/constants/knowledge/knowledgeTrustLevels";

const LABEL: Record<KnowledgeTrustLevel, string> = {
  LOW: "信任·低",
  MEDIUM: "信任·中",
  HIGH: "信任·高",
  VERIFIED: "已验证",
  FOUNDER_LOCKED: "Founder 锁定",
};

export function KnowledgeTrustBadge({ level }: { level: KnowledgeTrustLevel }) {
  const variant =
    level === "FOUNDER_LOCKED" ? "default" :
    level === "VERIFIED" ? "default" :
    level === "HIGH" ? "outline" :
    level === "MEDIUM" ? "secondary" :
    "destructive";
  return <Badge variant={variant as never}>{LABEL[level]}</Badge>;
}
