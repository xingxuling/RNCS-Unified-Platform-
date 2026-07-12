import type { SocialPost } from "./socialTypes";

const INSTALLABLE_TYPES = ["APP_PROJECT", "WEBXXM_PACKAGE", "WORLD_OBJECT", "UI_THEME", "PLUGIN", "CODE_TEMPLATE", "KNOWLEDGE_PACK"];

export function isStoreLinkable(post: SocialPost): boolean {
  return post.allowStoreLink && INSTALLABLE_TYPES.includes(post.postType);
}

export function buildStoreLink(post: SocialPost): string | null {
  if (!isStoreLinkable(post)) return null;
  if (post.storeItemId) return `/store/item/${post.storeItemId}`;
  return `/store`;
}
