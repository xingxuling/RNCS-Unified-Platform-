// Social Backend Adapter 抽象
import type { SocialPost, SocialPublishInput } from "./socialTypes";

export type SocialBackendMode = "LOCAL_MOCK" | "LOVABLE_CLOUD" | "DISABLED";

export interface SocialBackendAdapter {
  mode: SocialBackendMode;
  available: boolean;
  description: string;
  // 异步保留接口形态，本地实现可同步完成
  createPost(input: SocialPublishInput, post: SocialPost): Promise<{ ok: boolean; reason?: string }>;
  updateVisibility(postId: string, visibility: SocialPost["visibility"]): Promise<{ ok: boolean; reason?: string }>;
  deletePost(postId: string): Promise<{ ok: boolean; reason?: string }>;
}
