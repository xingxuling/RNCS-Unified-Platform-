// Local Mock Adapter：复用 localStorage，明确标注非云端。
import type { SocialBackendAdapter } from "./socialBackendAdapter";

export const socialLocalAdapter: SocialBackendAdapter = {
  mode: "LOCAL_MOCK",
  available: true,
  description: "当前为本地内测模式，公开发布不会真正同步到云端。",
  async createPost() {
    return { ok: true };
  },
  async updateVisibility() {
    return { ok: true };
  },
  async deletePost() {
    return { ok: true };
  },
};
