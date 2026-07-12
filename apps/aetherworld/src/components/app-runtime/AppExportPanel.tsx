import type { AppExportPackage } from "@/lib/app-runtime/appProjectObjectEngine";
import { exportPackageAsTextBlob } from "@/lib/app-runtime/appExportEngine";
import { APP_EXPORT_LABELS } from "@/constants/app-runtime/appExportTargets";

export function AppExportPanel({ packages }: { packages: AppExportPackage[] }) {
  const download = (pkg: AppExportPackage) => {
    const blob = new Blob([exportPackageAsTextBlob(pkg)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${pkg.exportTarget}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Export Packages</div>
      {packages.length === 0 && <div className="text-[12px] text-muted-foreground">尚未生成导出包。</div>}
      <ul className="space-y-1">
        {packages.map(p => (
          <li key={p.packageId} className="flex items-center justify-between border border-border/30 rounded p-2">
            <div>
              <div className="text-sm">{APP_EXPORT_LABELS[p.exportTarget]}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{p.files.length} 文件</div>
              {p.safetyNotes.length > 0 && <div className="text-[10px] text-amber-300">{p.safetyNotes.join("；")}</div>}
            </div>
            <button onClick={() => download(p)} className="text-[11px] px-2 py-1 border border-border/40 rounded hover:bg-muted/40">下载</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
