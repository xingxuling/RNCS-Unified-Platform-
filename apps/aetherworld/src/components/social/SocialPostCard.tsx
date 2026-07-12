import { Link } from "@tanstack/react-router";
import type { SocialPost } from "@/lib/social/socialTypes";
import { SOCIAL_OBJECT_TYPES } from "@/constants/social/socialObjectTypes";
import { SOCIAL_VISIBILITY_TYPES } from "@/constants/social/socialVisibilityTypes";
import { SocialQaBadge } from "./SocialQaBadge";
import { SocialReactionBar } from "./SocialReactionBar";
import { SocialCollectionButton } from "./SocialCollectionButton";
import { getProfile } from "@/lib/social/socialProfileEngine";
import { Share2 } from "lucide-react";

/**
 * SocialPostCard
 * 三段式：作者头条区 · 内容预览区（含可选封面 / 缩略图） · 互动 / 操作浮层
 * 桌面端悬停显示「分享」浮层；移动端常驻关键操作。
 */
export function SocialPostCard({ post }: { post: SocialPost }) {
  const profile = getProfile(post.authorUserId);
  const typeLabel = SOCIAL_OBJECT_TYPES[post.postType]?.label || "动态";
  const visLabel = SOCIAL_VISIBILITY_TYPES[post.visibility]?.label || post.visibility;
  const cover = (post as unknown as { coverUrl?: string }).coverUrl;

  return (
    <article className="group relative border border-border/60 rounded-xl p-4 space-y-3 bg-background/40 hover:border-border transition-colors">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
            {(profile?.displayName || "匿").slice(0, 1)}
          </span>
          <span className="truncate">{profile?.displayName || "匿名旅人"}</span>
          <span>·</span>
          <span className="shrink-0">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span>{visLabel}</span>
          <SocialQaBadge status={post.qaStatus} />
        </div>
      </header>

      <div className="space-y-2">
        <Link
          to="/social/object/$id"
          params={{ id: post.postId }}
          className="text-base font-medium hover:underline block"
        >
          {post.title}
        </Link>
        {cover && (
          <Link
            to="/social/object/$id"
            params={{ id: post.postId }}
            className="block overflow-hidden rounded-lg border border-border/40 aspect-[16/9] bg-muted/30"
          >
            <img
              src={cover}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>
        )}
        {post.content && (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}

      <footer className="flex items-center justify-between pt-2 border-t border-border/50">
        <SocialReactionBar postId={post.postId} />
        <div className="flex items-center gap-2">
          <SocialCollectionButton postId={post.postId} />
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(`${location.origin}/social/object/${post.postId}`);
              }
            }}
            aria-label="复制链接"
            title="复制链接"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Share2 className="w-3 h-3" /> 分享
          </button>
          <Link
            to="/social/object/$id"
            params={{ id: post.postId }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            打开
          </Link>
        </div>
      </footer>
    </article>
  );
}
