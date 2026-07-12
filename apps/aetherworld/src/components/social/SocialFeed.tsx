import { useMemo, useState } from "react";
import { SOCIAL_FEED_FILTERS } from "@/constants/social/socialFeedTypes";
import type { SocialFeedFilterId } from "@/constants/social/socialFeedTypes";
import { getPublicFeed, isPublicFeedEnabled } from "@/lib/social/socialFeedEngine";
import { SocialPostCard } from "./SocialPostCard";
import { useSocialTick } from "@/hooks/useSocialTick";

export function SocialFeed() {
  useSocialTick();
  const [filter, setFilter] = useState<SocialFeedFilterId>("ALL");
  const enabled = isPublicFeedEnabled();
  const posts = useMemo(() => getPublicFeed(filter), [filter, enabled]);

  if (!enabled) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
        公共动态暂未开放，当前为内测模式。
        <div className="mt-2 text-xs">你仍可创建私密 / 凭链接可见的作品，并通过链接分享。</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SOCIAL_FEED_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              filter === f.id ? "border-foreground/40 bg-muted" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          暂无公开作品。试着发布你的第一个作品吧。
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <SocialPostCard key={p.postId} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
