import type { SocialPost } from "./socialTypes";

export interface ViewerContext {
  userId: string | null;
  isFounder?: boolean;
}

export function canViewPost(post: SocialPost, viewer: ViewerContext): boolean {
  if (post.qaStatus === "BLOCKED") return viewer.userId === post.authorUserId;
  switch (post.visibility) {
    case "PUBLIC":
      return true;
    case "UNLISTED":
      return true;
    case "PRIVATE":
      return viewer.userId === post.authorUserId;
    case "FOUNDER_ONLY":
      return !!viewer.isFounder || viewer.userId === post.authorUserId;
  }
}

export function canPublishPublic(viewer: ViewerContext): boolean {
  return !!viewer.userId;
}

export function canComment(post: SocialPost, viewer: ViewerContext): boolean {
  return !!viewer.userId && post.allowComments && canViewPost(post, viewer);
}

export function canManagePost(post: SocialPost, viewer: ViewerContext): boolean {
  return viewer.userId === post.authorUserId || !!viewer.isFounder;
}
