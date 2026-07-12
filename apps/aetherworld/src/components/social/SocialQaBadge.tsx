import { qaBadgeLabel, qaBadgeTone } from "@/lib/social/socialQaBridge";
import type { SocialQaStatus } from "@/lib/social/socialTypes";

export function SocialQaBadge({ status }: { status: SocialQaStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${qaBadgeTone(status)}`}>
      {qaBadgeLabel(status)}
    </span>
  );
}
