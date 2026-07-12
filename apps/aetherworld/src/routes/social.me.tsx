import { createFileRoute, Link } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { SocialProfileCard } from "@/components/social/SocialProfileCard";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { ensureProfile, getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { getUserPosts, getDraftsAndPrivate } from "@/lib/social/socialFeedEngine";
import { useSocialTick } from "@/hooks/useSocialTick";

export const Route = createFileRoute("/social/me")({
  component: MePage,
});

function MePage() {
  useSocialTick();
  const userId = getCurrentUserId();
  const profile = ensureProfile(userId);
  const posts = getUserPosts(userId, userId);
  const drafts = getDraftsAndPrivate(userId);

  return (
    <SocialShell title="我的主页" subtitle="管理你的作品、草稿和私密对象。">
      <div className="space-y-6">
        <SocialProfileCard profile={profile} isMe />
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">我的作品 ({posts.length})</h2>
          <Link to="/social/publish" className="text-xs px-3 py-1 border border-border rounded-md hover:bg-muted">
            发布新作品
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            还没有作品。点击右上角「发布新作品」开始创作。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => <SocialPostCard key={p.postId} post={p} />)}
          </div>
        )}

        {drafts.length > 0 && (
          <>
            <h2 className="text-sm font-medium pt-4">私密 / 草稿 ({drafts.length})</h2>
            <div className="space-y-3">
              {drafts.map((p) => <SocialPostCard key={p.postId} post={p} />)}
            </div>
          </>
        )}
      </div>
    </SocialShell>
  );
}
