import { Badge } from "@/components/ui/badge";
import { getKnowledgeType, type KnowledgeTypeId } from "@/constants/knowledge/knowledgeTypes";

export function KnowledgeTypeBadge({ type }: { type: KnowledgeTypeId }) {
  const def = getKnowledgeType(type);
  const tone =
    type === "FICTIONAL_LORE" ? "default" :
    type === "USER_PERSONAL"  ? "destructive" :
    type === "DEMO_DATA"      ? "secondary" :
    "outline";
  return <Badge variant={tone as never} title={def.description}>{def.label}</Badge>;
}
