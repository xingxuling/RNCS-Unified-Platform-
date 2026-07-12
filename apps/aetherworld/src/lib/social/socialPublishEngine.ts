import { socialStorage, newId, nowIso } from "./socialStorage";
import type { SocialPost, SocialPublishInput, SocialSafetyReport } from "./socialTypes";
import { runSocialSafetyCheck } from "./socialSafetyGuard";
import { ensureProfile, recomputeStats } from "./socialProfileEngine";
import { evaluatePublishPermission } from "./socialPublishPermissionGuard";
import { appendPublishAudit } from "./socialPublishAuditLogger";
import { socialCloudAdapter } from "./socialCloudAdapter";
import { socialLocalAdapter } from "./socialLocalAdapter";

export interface PublishResult {
  ok: boolean;
  post?: SocialPost;
  safety: SocialSafetyReport;
  reason?: string;
  blockedReasons?: string[];
  warnings?: string[];
  forcedVisibility?: SocialPost["visibility"];
  backendMode?: string;
  backendNote?: string;
}

function activeAdapter() {
  return socialCloudAdapter.available ? socialCloudAdapter : socialLocalAdapter;
}

export function publishPost(input: SocialPublishInput): PublishResult {
  const text = `${input.title}\n${input.content}\n${(input.tags || []).join(" ")}`;
  const safety = runSocialSafetyCheck(text);
  const permission = evaluatePublishPermission(input);

  // 高优阻断：内容含 BLOCK 级风险或密钥
  if (permission.blockedReasons.length > 0 && input.visibility !== "PRIVATE") {
    appendPublishAudit({
      userId: input.authorUserId,
      linkedObjectId: input.linkedObjectId,
      visibility: input.visibility,
      action: "BLOCK",
      qaStatus: permission.qaStatus,
      safetyStatus: permission.safetyStatus,
      blockedReasons: permission.blockedReasons,
    });
    return {
      ok: false,
      safety,
      reason: permission.blockedReasons[0] || "内容触发安全规则，无法公开发布。",
      blockedReasons: permission.blockedReasons,
      warnings: permission.warnings,
      forcedVisibility: "PRIVATE",
    };
  }

  ensureProfile(input.authorUserId);

  const adapter = activeAdapter();

  const post: SocialPost = {
    postId: newId("post"),
    authorUserId: input.authorUserId,
    title: input.title.trim() || "未命名作品",
    content: input.content,
    postType: input.postType,
    linkedObjectId: input.linkedObjectId,
    linkedObjectType: input.linkedObjectType,
    visibility: input.visibility,
    qaStatus: permission.qaStatus === "BLOCKED" ? "BLOCKED" : permission.qaStatus === "WARN" ? "WARN" : "PASS",
    qaNotes: [...safety.risks.map((r) => r.message), ...permission.warnings],
    allowComments: input.allowComments ?? true,
    allowRemix: input.allowRemix ?? false,
    allowStoreLink: input.allowStoreLink ?? false,
    storeItemId: input.storeItemId,
    tags: input.tags || [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  socialStorage.setPosts([post, ...socialStorage.getPosts()]);
  recomputeStats(input.authorUserId);

  // 异步通知后端（不阻塞 UI）
  void adapter.createPost(input, post).catch(() => undefined);

  appendPublishAudit({
    userId: input.authorUserId,
    postId: post.postId,
    linkedObjectId: input.linkedObjectId,
    visibility: post.visibility,
    action: post.visibility === "PRIVATE" ? "CREATE" : "PUBLISH",
    qaStatus: permission.qaStatus,
    safetyStatus: permission.safetyStatus,
    blockedReasons: [],
  });

  return {
    ok: true,
    post,
    safety,
    warnings: permission.warnings,
    backendMode: adapter.mode,
    backendNote: adapter.description,
  };
}

export function updatePostVisibility(postId: string, visibility: SocialPost["visibility"]) {
  const posts = socialStorage.getPosts();
  const next = posts.map((p) => (p.postId === postId ? { ...p, visibility, updatedAt: nowIso() } : p));
  socialStorage.setPosts(next);
  const target = next.find((p) => p.postId === postId);
  if (target) {
    appendPublishAudit({
      userId: target.authorUserId,
      postId,
      visibility,
      action: visibility === "PRIVATE" ? "UNPUBLISH" : "UPDATE",
      qaStatus: target.qaStatus,
      safetyStatus: target.qaStatus === "BLOCKED" ? "BLOCK" : target.qaStatus === "WARN" ? "WARN" : "PASS",
      blockedReasons: [],
    });
    void activeAdapter().updateVisibility(postId, visibility).catch(() => undefined);
  }
}

export function deletePost(postId: string) {
  const target = socialStorage.getPosts().find((p) => p.postId === postId);
  socialStorage.setPosts(socialStorage.getPosts().filter((p) => p.postId !== postId));
  socialStorage.setReactions(socialStorage.getReactions().filter((r) => r.postId !== postId));
  socialStorage.setComments(socialStorage.getComments().filter((c) => c.postId !== postId));
  if (target) void activeAdapter().deletePost(postId).catch(() => undefined);
}

export function getPost(postId: string): SocialPost | null {
  return socialStorage.getPosts().find((p) => p.postId === postId) || null;
}
