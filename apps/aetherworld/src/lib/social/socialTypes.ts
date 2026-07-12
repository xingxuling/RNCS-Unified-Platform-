import type { SocialObjectType } from "@/constants/social/socialObjectTypes";
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";
import type { SocialReactionType } from "@/constants/social/socialReactionTypes";
import type { SocialRiskType } from "@/constants/social/socialRiskTypes";

export type SocialQaStatus = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "NOT_CHECKED";

export interface SocialProfile {
  userId: string;
  displayName: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  links?: string[];
  stats: {
    posts: number;
    followers: number;
    following: number;
    likes: number;
    collections: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  postId: string;
  authorUserId: string;
  title: string;
  content: string;
  postType: SocialObjectType;
  linkedObjectId?: string;
  linkedObjectType?: string;
  visibility: SocialVisibility;
  qaStatus: SocialQaStatus;
  qaNotes?: string[];
  allowComments: boolean;
  allowRemix: boolean;
  allowStoreLink: boolean;
  storeItemId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialReaction {
  reactionId: string;
  postId: string;
  userId: string;
  reactionType: SocialReactionType;
  createdAt: string;
}

export interface SocialComment {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
}

export interface SocialCollection {
  collectionId: string;
  userId: string;
  name: string;
  description?: string;
  postIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialSafetyReport {
  ok: boolean;
  status: SocialQaStatus;
  risks: { id: SocialRiskType; message: string; severity: "BLOCK" | "WARN" }[];
}

export interface SocialPublishInput {
  authorUserId: string;
  title: string;
  content: string;
  postType: SocialObjectType;
  linkedObjectId?: string;
  linkedObjectType?: string;
  visibility: SocialVisibility;
  allowComments?: boolean;
  allowRemix?: boolean;
  allowStoreLink?: boolean;
  storeItemId?: string;
  tags?: string[];
}
