// Lovable Cloud Adapter：表结构已规划但需后端表配置后才可启用。
// 本轮仅作 stub，明确告知用户后端表未配置时不会真正同步。
import type { SocialBackendAdapter } from "./socialBackendAdapter";

// 期望的云端表（待迁移）：
// - social_profiles
// - social_posts
// - social_reactions
// - social_comments
// - social_collections
// - social_publish_audits

export const SOCIAL_CLOUD_TABLES = [
  "social_profiles",
  "social_posts",
  "social_reactions",
  "social_comments",
  "social_collections",
  "social_publish_audits",
] as const;

export const socialCloudAdapter: SocialBackendAdapter = {
  mode: "LOVABLE_CLOUD",
  available: false, // 云端表未配置之前默认不可用
  description: "Lovable Cloud 适配器已就绪，但社交相关表尚未在云端配置。配置后可启用真实公开发布。",
  async createPost() {
    return { ok: false, reason: "云端表未配置，已回退为本地草稿。" };
  },
  async updateVisibility() {
    return { ok: false, reason: "云端表未配置。" };
  },
  async deletePost() {
    return { ok: false, reason: "云端表未配置。" };
  },
};

// pickActiveSocialAdapter 在 socialPublishEngine 中直接组合，避免循环依赖。

