import { socialStorage, newId, nowIso } from "./socialStorage";
import type { SocialCollection } from "./socialTypes";

export function listCollections(userId: string): SocialCollection[] {
  return socialStorage.getCollections().filter((c) => c.userId === userId);
}

export function getOrCreateDefaultCollection(userId: string): SocialCollection {
  const found = listCollections(userId).find((c) => c.name === "默认收藏");
  if (found) return found;
  const c: SocialCollection = {
    collectionId: newId("col"),
    userId,
    name: "默认收藏",
    description: "默认收藏夹",
    postIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  socialStorage.setCollections([...socialStorage.getCollections(), c]);
  return c;
}

export function toggleCollect(userId: string, postId: string): boolean {
  const col = getOrCreateDefaultCollection(userId);
  const all = socialStorage.getCollections();
  const has = col.postIds.includes(postId);
  const nextIds = has ? col.postIds.filter((id) => id !== postId) : [...col.postIds, postId];
  const next: SocialCollection = { ...col, postIds: nextIds, updatedAt: nowIso() };
  socialStorage.setCollections(all.map((c) => (c.collectionId === col.collectionId ? next : c)));
  return !has;
}

export function isCollected(userId: string, postId: string): boolean {
  return listCollections(userId).some((c) => c.postIds.includes(postId));
}
