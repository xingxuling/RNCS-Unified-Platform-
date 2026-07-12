import { createFileRoute } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { SocialProfileCard } from "@/components/social/SocialProfileCard";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { ensureProfile, getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { getUserPosts } from "@/lib/social/socialFeedEngine";
import { useSocialTick } from "@/hooks/useSocialTick";

export const Route = createFileRoute("/social/profile/$userId")({
  component: ProfilePage,
});

function ProfilePage() {
  useSocialTick();
  const { userId } = Route.useParams();
  const viewerId = getCurrentUserId();
  const profile = ensureProfile(userId);
  const posts = getUserPosts(userId, viewerId);
  const isMe = viewerId === userId;

  return (
    <SocialShell title={isMe ? "我的主页" : `${profile.displayName} 的主页`} subtitle={`@${profile.handle}`}>
      <div className="space-y-6">
        <SocialProfileCard profile={profile} isMe={isMe} />
        <h2 className="text-sm font-medium">作品 ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            这位旅人还没有公开作品。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => <SocialPostCard key={p.postId} post={p} />)}
          </div>
        )}
      </div>
    </SocialShell>
  );
}
