import { SOCIAL_REACTION_LIST } from "@/constants/social/socialReactionTypes";
import type { SocialReactionType } from "@/constants/social/socialReactionTypes";
import { getReactionCount, hasReacted, toggleReaction } from "@/lib/social/socialReactionEngine";
import { getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { notifyReacted } from "@/lib/social/socialNoticeBridge";
import { useSocialTick } from "@/hooks/useSocialTick";

export function SocialReactionBar({ postId }: { postId: string }) {
  useSocialTick();
  const userId = getCurrentUserId();
  return (
    <div className="flex items-center gap-3">
      {SOCIAL_REACTION_LIST.map((r) => {
        const active = hasReacted(postId, userId, r.id as SocialReactionType);
        const count = getReactionCount(postId, r.id as SocialReactionType);
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => notifyReacted(toggleReaction(postId, userId, r.id as SocialReactionType), r.label)}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition ${
              active ? "border-foreground/40 bg-muted/40" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{r.emoji}</span>
            <span>{r.label}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
