import { socialStorage, newId, nowIso } from "./socialStorage";
import type { SocialComment } from "./socialTypes";
import { runSocialSafetyCheck } from "./socialSafetyGuard";

export function addComment(postId: string, userId: string, content: string): { ok: boolean; comment?: SocialComment; reason?: string } {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, reason: "评论内容不能为空。" };
  const safety = runSocialSafetyCheck(trimmed);
  if (!safety.ok) return { ok: false, reason: safety.risks[0]?.message || "评论被安全规则拦截。" };

  const c: SocialComment = {
    commentId: newId("cmt"),
    postId,
    userId,
    content: trimmed,
    status: "VISIBLE",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  socialStorage.setComments([...socialStorage.getComments(), c]);
  return { ok: true, comment: c };
}

export function listComments(postId: string): SocialComment[] {
  return socialStorage
    .getComments()
    .filter((c) => c.postId === postId && c.status === "VISIBLE")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function deleteComment(commentId: string) {
  socialStorage.setComments(socialStorage.getComments().filter((c) => c.commentId !== commentId));
}
