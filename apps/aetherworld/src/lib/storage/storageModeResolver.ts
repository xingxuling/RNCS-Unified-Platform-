export type StorageMode = "LOCAL_ONLY" | "BACKEND_ONLY" | "HYBRID_SYNC";
const KEY = "aether.storage.mode";

export function getStorageMode(): StorageMode {
  if (typeof window === "undefined") return "LOCAL_ONLY";
  return (localStorage.getItem(KEY) as StorageMode) || "LOCAL_ONLY";
}
export function setStorageMode(m: StorageMode) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, m);
}
export const STORAGE_MODE_LABELS: Record<StorageMode, string> = {
  LOCAL_ONLY: "仅本地",
  BACKEND_ONLY: "仅云端",
  HYBRID_SYNC: "本地 + 云端",
};
