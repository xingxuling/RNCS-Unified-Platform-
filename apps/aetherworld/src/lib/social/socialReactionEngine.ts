import { socialStorage, newId, nowIso } from "./socialStorage";
import type { SocialReaction } from "./socialTypes";
import type { SocialReactionType } from "@/constants/social/socialReactionTypes";

export function toggleReaction(postId: string, userId: string, type: SocialReactionType): boolean {
  const all = socialStorage.getReactions();
  const existing = all.find((r) => r.postId === postId && r.userId === userId && r.reactionType === type);
  if (existing) {
    socialStorage.setReactions(all.filter((r) => r.reactionId !== existing.reactionId));
    return false;
  }
  const next: SocialReaction = {
    reactionId: newId("rx"),
    postId,
    userId,
    reactionType: type,
    createdAt: nowIso(),
  };
  socialStorage.setReactions([...all, next]);
  return true;
}

export function getReactionCount(postId: string, type: SocialReactionType): number {
  return socialStorage.getReactions().filter((r) => r.postId === postId && r.reactionType === type).length;
}

export function hasReacted(postId: string, userId: string, type: SocialReactionType): boolean {
  return socialStorage.getReactions().some((r) => r.postId === postId && r.userId === userId && r.reactionType === type);
}
