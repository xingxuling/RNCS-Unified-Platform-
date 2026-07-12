import { useState } from "react";
import { addComment, listComments } from "@/lib/social/socialCommentEngine";
import { getCurrentUserId, getProfile } from "@/lib/social/socialProfileEngine";
import { useSocialTick } from "@/hooks/useSocialTick";
import { toast } from "sonner";

export function SocialCommentList({ postId, allowComments }: { postId: string; allowComments: boolean }) {
  useSocialTick();
  const [text, setText] = useState("");
  const comments = listComments(postId);
  const userId = getCurrentUserId();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">评论 ({comments.length})</h3>

      {allowComments ? (
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的想法…"
            className="flex-1 min-h-[60px] text-sm bg-background border border-border rounded-md px-3 py-2 resize-none"
          />
          <button
            onClick={() => {
              const r = addComment(postId, userId, text);
              if (r.ok) { setText(""); toast.success("评论已发布"); }
              else toast.error(r.reason || "评论失败");
            }}
            className="px-4 self-end h-9 text-sm bg-foreground text-background rounded-md hover:opacity-90"
          >
            发布
          </button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-2">
          作者已关闭评论。
        </div>
      )}

      <div className="space-y-2">
        {comments.length === 0 ? (
          <div className="text-xs text-muted-foreground">暂无评论。</div>
        ) : (
          comments.map((c) => {
            const author = getProfile(c.userId);
            return (
              <div key={c.commentId} className="border border-border rounded-md px-3 py-2 space-y-1">
                <div className="text-xs text-muted-foreground">
                  {author?.displayName || "匿名旅人"} · {new Date(c.createdAt).toLocaleString("zh-CN")}
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
