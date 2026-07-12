import { createFileRoute, Link } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { SocialQaBadge } from "@/components/social/SocialQaBadge";
import { SocialReactionBar } from "@/components/social/SocialReactionBar";
import { SocialCollectionButton } from "@/components/social/SocialCollectionButton";
import { SocialCommentList } from "@/components/social/SocialCommentList";
import { SocialObjectPreview } from "@/components/social/SocialObjectPreview";
import { getPost, deletePost, updatePostVisibility } from "@/lib/social/socialPublishEngine";
import { getCurrentUserId, getProfile } from "@/lib/social/socialProfileEngine";
import { canViewPost, canManagePost } from "@/lib/social/socialPermissionEngine";
import { SOCIAL_VISIBILITY_LIST } from "@/constants/social/socialVisibilityTypes";
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";
import { useSocialTick } from "@/hooks/useSocialTick";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/social/object/$id")({
  component: ObjectDetail,
});

function ObjectDetail() {
  useSocialTick();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const post = getPost(id);
  const viewerId = getCurrentUserId();

  if (!post) {
    return (
      <SocialShell title="作品不存在">
        <div className="text-sm text-muted-foreground">未找到该作品，可能已被删除或链接错误。</div>
        <Link to="/social/feed" className="text-xs text-foreground hover:underline">返回动态</Link>
      </SocialShell>
    );
  }

  if (!canViewPost(post, { userId: viewerId })) {
    return (
      <SocialShell title="无权查看">
        <div className="text-sm text-muted-foreground">你没有权限查看此作品。</div>
      </SocialShell>
    );
  }

  const author = getProfile(post.authorUserId);
  const manageable = canManagePost(post, { userId: viewerId });

  return (
    <SocialShell title={post.title} subtitle={`由 ${author?.displayName || "匿名旅人"} 发布`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/social/profile/$userId" params={{ userId: post.authorUserId }} className="hover:underline">
            @{author?.handle || "anon"}
          </Link>
          <SocialQaBadge status={post.qaStatus} />
        </div>

        {post.qaNotes && post.qaNotes.length > 0 && (
          <div className="text-xs border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded-md px-3 py-2 space-y-1">
            <div className="font-medium">安全检查备注</div>
            <ul className="list-disc pl-5">
              {post.qaNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}

        {post.content && (
          <article className="text-sm whitespace-pre-wrap leading-relaxed border border-border rounded-md p-4 bg-background/40">
            {post.content}
          </article>
        )}

        <SocialObjectPreview post={post} />

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <SocialReactionBar postId={post.postId} />
          <SocialCollectionButton postId={post.postId} />
        </div>

        {manageable && (
          <div className="border border-border rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium">作者管理</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">可见性</span>
              <select
                value={post.visibility}
                onChange={(e) => { updatePostVisibility(post.postId, e.target.value as SocialVisibility); toast.success("已更新可见性"); }}
                className="bg-background border border-border rounded px-2 py-1"
              >
                {SOCIAL_VISIBILITY_LIST.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (confirm("确定要撤回并删除该作品吗？")) {
                    deletePost(post.postId);
                    toast.success("已撤回");
                    navigate({ to: "/social/me" });
                  }
                }}
                className="ml-auto text-rose-500 hover:underline"
              >
                撤回作品
              </button>
            </div>
          </div>
        )}

        <SocialCommentList postId={post.postId} allowComments={post.allowComments} />
      </div>
    </SocialShell>
  );
}
