// Saves a publish event into the workspace via a soft event bus.
import type { SocialPost } from "./socialTypes";

export function emitWorkspaceSocialEvent(post: SocialPost) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("aether-workspace:social-publish", {
        detail: { postId: post.postId, title: post.title, type: post.postType, at: post.createdAt },
      }),
    );
  } catch {}
}
