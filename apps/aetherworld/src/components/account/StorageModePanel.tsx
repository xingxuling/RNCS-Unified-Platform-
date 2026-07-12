import { useEffect, useState } from "react";
import { getStorageMode, setStorageMode, STORAGE_MODE_LABELS, type StorageMode } from "@/lib/storage/storageModeResolver";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function StorageModePanel() {
  const { user } = useAuth();
  const [mode, setMode] = useState<StorageMode>("LOCAL_ONLY");
  useEffect(() => setMode(getStorageMode()), []);
  const choose = (m: StorageMode) => {
    if (!user && m !== "LOCAL_ONLY") return toast.error("登录后才能使用云端模式");
    setStorageMode(m); setMode(m); toast.success(`已切换到「${STORAGE_MODE_LABELS[m]}」`);
  };
  return (
    <section className="aether-card p-4 space-y-3">
      <div className="text-sm font-medium">存储模式</div>
      <p className="text-xs text-muted-foreground">未登录时仅本地。登录后可切换到云端或双端同步。</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {(Object.keys(STORAGE_MODE_LABELS) as StorageMode[]).map((m) => (
          <button key={m} onClick={() => choose(m)}
            className={`px-3 py-2 rounded-md text-xs border ${mode === m ? "border-primary text-foreground" : "border-border/40 text-muted-foreground"}`}>
            {STORAGE_MODE_LABELS[m]}
          </button>
        ))}
      </div>
    </section>
  );
}
