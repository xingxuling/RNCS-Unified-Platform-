import { CONSTANT_VERSIONS, getCurrentVersion } from "@/lib/constants-universe/constantVersioningEngine";

export function ConstantVersionPanel() {
  const current = getCurrentVersion();
  return (
    <div className="space-y-2">
      <p className="text-sm">当前版本：<span className="font-mono">{current.version}</span></p>
      {CONSTANT_VERSIONS.slice().reverse().map((v) => (
        <div key={v.versionId} className="border rounded-md p-3">
          <div className="flex justify-between text-xs">
            <span className="font-mono">{v.version}</span>
            <span className="text-muted-foreground">{v.createdAt.slice(0, 10)} · {v.founderApproved ? "Founder 已批准" : "未批准"}</span>
          </div>
          <p className="text-sm mt-1">{v.summary}</p>
          <p className="text-xs text-muted-foreground mt-1">变更：{v.changedConstants.join("；")}</p>
          {v.migrationNotes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">迁移：{v.migrationNotes.join("；")}</p>
          )}
        </div>
      ))}
    </div>
  );
}
