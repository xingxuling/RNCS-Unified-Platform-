import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasLocalDataToMigrate, runLocalToBackendMigration, type MigrationReport } from "@/lib/storage/localToBackendMigration";
import { toast } from "sonner";

export function LocalToBackendMigrationPanel() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<MigrationReport | null>(null);
  useEffect(() => setAvailable(hasLocalDataToMigrate()), []);

  if (!user) return null;

  const run = async () => {
    setBusy(true);
    try { setReport(await runLocalToBackendMigration()); toast.success("迁移完成"); setAvailable(false); }
    catch (e: any) { toast.error("迁移失败：" + e.message); }
    finally { setBusy(false); }
  };

  return (
    <section className="aether-card p-4 space-y-3">
      <div className="text-sm font-medium">本地数据迁移</div>
      {available ? (
        <p className="text-xs text-muted-foreground">检测到本地数据，是否迁移到你的账户工作区？</p>
      ) : (
        <p className="text-xs text-muted-foreground">没有需要迁移的本地数据。</p>
      )}
      {report && (
        <div className="text-xs text-muted-foreground">
          已迁移：对象 {report.objects}、运行 {report.runs}、能力包 {report.webxxm}、模型状态 {report.modelStates}。
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={!available || busy} onClick={run}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
          {busy ? "迁移中…" : "立即迁移"}
        </button>
        <button disabled={busy} onClick={() => setAvailable(false)} className="px-3 py-1.5 rounded-md border border-border/40 text-xs">稍后</button>
      </div>
    </section>
  );
}
