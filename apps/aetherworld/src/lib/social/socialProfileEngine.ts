import { socialStorage, newId, nowIso } from "./socialStorage";
import type { SocialProfile } from "./socialTypes";

const CURRENT_USER_KEY = "aether.social.currentUser";

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "local-user";
  let id = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!id) {
    id = newId("user");
    window.localStorage.setItem(CURRENT_USER_KEY, id);
  }
  return id;
}

export function getProfile(userId: string): SocialProfile | null {
  return socialStorage.getProfiles().find((p) => p.userId === userId) || null;
}

export function ensureProfile(userId: string): SocialProfile {
  const existing = getProfile(userId);
  if (existing) return existing;
  const profile: SocialProfile = {
    userId,
    displayName: "未命名旅人",
    handle: userId.slice(-6),
    bio: "Aetherworld 内测用户",
    stats: { posts: 0, followers: 0, following: 0, likes: 0, collections: 0 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  socialStorage.setProfiles([...socialStorage.getProfiles(), profile]);
  return profile;
}

export function updateProfile(userId: string, patch: Partial<SocialProfile>): SocialProfile {
  const all = socialStorage.getProfiles();
  const idx = all.findIndex((p) => p.userId === userId);
  const base = idx >= 0 ? all[idx] : ensureProfile(userId);
  const next: SocialProfile = { ...base, ...patch, userId, updatedAt: nowIso() };
  const list = idx >= 0 ? all.map((p, i) => (i === idx ? next : p)) : [...all, next];
  socialStorage.setProfiles(list);
  return next;
}

export function listProfiles(): SocialProfile[] {
  return socialStorage.getProfiles();
}

export function recomputeStats(userId: string) {
  const posts = socialStorage.getPosts().filter((p) => p.authorUserId === userId);
  const likes = socialStorage.getReactions().filter(
    (r) => r.reactionType === "LIKE" && posts.some((p) => p.postId === r.postId),
  ).length;
  const collections = socialStorage.getCollections().filter((c) => c.userId === userId).length;
  updateProfile(userId, {
    stats: {
      ...ensureProfile(userId).stats,
      posts: posts.length,
      likes,
      collections,
    },
  });
}
