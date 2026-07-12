import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleCollect, isCollected } from "@/lib/social/socialCollectionEngine";
import { getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { notifyCollected } from "@/lib/social/socialNoticeBridge";
import { useSocialTick } from "@/hooks/useSocialTick";

export function SocialCollectionButton({ postId }: { postId: string }) {
  useSocialTick();
  const userId = getCurrentUserId();
  const collected = isCollected(userId, postId);
  return (
    <button
      type="button"
      onClick={() => notifyCollected(toggleCollect(userId, postId))}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {collected ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5" />}
      {collected ? "已收藏" : "收藏"}
    </button>
  );
}
