import { socialStorage } from "./socialStorage";
import type { SocialPost } from "./socialTypes";
import type { SocialFeedFilterId } from "@/constants/social/socialFeedTypes";

export function getPublicFeed(filter: SocialFeedFilterId = "ALL"): SocialPost[] {
  const settings = socialStorage.getSettings();
  if (!settings.publicFeedEnabled) return [];
  return socialStorage
    .getPosts()
    .filter((p) => p.visibility === "PUBLIC" && p.qaStatus !== "BLOCKED")
    .filter((p) => (filter === "ALL" ? true : p.postType === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUserPosts(userId: string, viewerId?: string): SocialPost[] {
  const all = socialStorage.getPosts().filter((p) => p.authorUserId === userId);
  return all
    .filter((p) => {
      if (viewerId === userId) return true;
      return p.visibility === "PUBLIC" || p.visibility === "UNLISTED";
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDraftsAndPrivate(userId: string): SocialPost[] {
  return socialStorage
    .getPosts()
    .filter((p) => p.authorUserId === userId && p.visibility === "PRIVATE")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isPublicFeedEnabled(): boolean {
  return socialStorage.getSettings().publicFeedEnabled;
}

export function setPublicFeedEnabled(enabled: boolean) {
  socialStorage.setSettings({ publicFeedEnabled: enabled });
}
