// Secret 存储策略
// Demo 模式下不持久化；普通对象内不允许保留 raw secret。

export type SecretStoreMode = "DEMO_NO_PERSIST" | "LOCAL_MASKED_ONLY" | "BACKEND_SECRET_STORAGE";

export function getSecretStoreMode(): SecretStoreMode {
  if (typeof window === "undefined") return "LOCAL_MASKED_ONLY";
  try {
    const raw = localStorage.getItem("aether.subject.mode");
    if (raw && raw.includes("DEMO")) return "DEMO_NO_PERSIST";
  } catch {}
  return "LOCAL_MASKED_ONLY";
}

export const SECRET_STORAGE_POLICY = {
  DEMO_NO_PERSIST: "Demo 模式：密钥不持久化，仅当前会话有效。",
  LOCAL_MASKED_ONLY: "本地存储：仅保存脱敏值（masked），原始 secret 不进入普通对象。",
  BACKEND_SECRET_STORAGE: "后端安全存储：原始 secret 保存于服务端 Secret Storage。",
} as const;
