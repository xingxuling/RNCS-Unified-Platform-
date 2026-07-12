import { Link } from "@tanstack/react-router";
import type { WebXXMPackageManifest } from "@/lib/webxxm-store/webXXMStoreTypes";
import { WebXXMPackageStatusBadge } from "./WebXXMPackageStatusBadge";
import {
  downloadPackage, installPackage, enablePackage,
  disablePackage, uninstallPackage, updatePackage,
} from "@/lib/webxxm-store/webXXMPackageRegistry";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "未下载",
  DOWNLOADING: "下载中…",
  DOWNLOADED: "已下载",
  INSTALLING: "安装中…",
  INSTALLED: "已安装",
  ENABLED: "已启用",
  DISABLED: "已禁用",
  UPDATE_AVAILABLE: "有更新",
  BROKEN: "损坏",
  BLOCKED: "已阻断",
  UNINSTALLED: "未下载",
};

export function WebXXMPackageCard({ m, onChange }: { m: WebXXMPackageManifest; onChange?: () => void }) {
  const [busy, setBusy] = useState(false);
  const status = m.status.status;

  const promptInstallAfterDownload = () => {
    toast("下载完成", {
      description: `「${m.chineseName}」已下载。还需要安装后才能使用。`,
      action: {
        label: "立即安装",
        onClick: () => {
          const r = installPackage(m.packageId);
          if (r.ok) promptEnableAfterInstall();
          else toast.error("安装失败", { description: r.reason });
          onChange?.();
        },
      },
      cancel: { label: "稍后", onClick: () => {} },
      duration: 8000,
    });
  };

  const promptEnableAfterInstall = () => {
    toast("安装完成", {
      description: `「${m.chineseName}」已安装。启用后，Aetherworld 才能在对话和运行时中调用它。`,
      action: {
        label: "立即启用",
        onClick: () => {
          const r = enablePackage(m.packageId);
          if (r.ok) toast.success("已启用", { description: `「${m.chineseName}」现在可以在对话和运行时中调用。` });
          else toast.error("启用失败", { description: r.reason });
          onChange?.();
        },
      },
      cancel: { label: "稍后", onClick: () => {} },
      duration: 8000,
    });
  };

  const wrap = (fn: () => { ok: boolean; status: string; reason?: string }, name: string, onOk?: () => void) => () => {
    setBusy(true);
    try {
      const r = fn();
      if (r.ok) {
        toast.success(`${name} 成功 · ${m.chineseName}`);
        onOk?.();
      } else {
        toast.error(`${name} 失败`, { description: r.reason });
      }
      onChange?.();
    } finally { setBusy(false); }
  };

  // 单一主按钮，按状态变化
  let primary: { label: string; run: () => void } | null = null;
  let secondary: { label: string; run: () => void } | null = null;

  switch (status) {
    case "AVAILABLE":
    case "UNINSTALLED":
      primary = { label: "下载", run: wrap(() => downloadPackage(m.packageId), "下载", promptInstallAfterDownload) };
      break;
    case "DOWNLOADING":
      primary = { label: "下载中…", run: () => {} };
      break;
    case "DOWNLOADED":
      primary = { label: "安装", run: wrap(() => installPackage(m.packageId), "安装", promptEnableAfterInstall) };
      break;
    case "INSTALLING":
      primary = { label: "安装中…", run: () => {} };
      break;
    case "INSTALLED":
      primary = { label: "启用", run: wrap(() => enablePackage(m.packageId), "启用") };
      secondary = { label: "卸载", run: wrap(() => uninstallPackage(m.packageId), "卸载") };
      break;
    case "DISABLED":
      primary = { label: "启用", run: wrap(() => enablePackage(m.packageId), "启用") };
      break;
    case "ENABLED":
      primary = { label: "打开", run: () => { window.location.href = m.providedRoutes?.[0] ?? "/web-capability-run"; } };
      secondary = { label: "禁用", run: wrap(() => disablePackage(m.packageId), "禁用") };
      break;
    case "UPDATE_AVAILABLE":
      primary = { label: "更新", run: wrap(() => updatePackage(m.packageId), "更新") };
      break;
    case "BROKEN":
      primary = { label: "查看问题", run: () => { window.location.href = `/webxxm-package-audit/${m.packageId}`; } };
      break;
    case "BLOCKED":
      primary = { label: "查看阻断原因", run: () => { window.location.href = `/webxxm-package-audit/${m.packageId}`; } };
      break;
  }

  return (
    <div className="aether-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {m.chineseName} <span className="text-muted-foreground text-[11px] ml-1">{m.name}</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{m.description}</div>
        </div>
        <WebXXMPackageStatusBadge status={status} />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>v{m.version}</span>
        <span>·</span>
        <span>{m.packageType}</span>
        <span>·</span>
        <span>状态：{STATUS_LABEL[status] ?? status}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Link to="/webxxm-package/$id" params={{ id: m.packageId }} className="text-[11px] text-muted-foreground hover:text-foreground">
          更多 →
        </Link>
        <div className="ml-auto flex gap-1.5">
          {secondary && (
            <button
              disabled={busy}
              onClick={secondary.run}
              className="text-[11px] px-2.5 py-1 rounded border border-border/60 text-foreground hover:bg-muted/30 disabled:opacity-40"
            >
              {secondary.label}
            </button>
          )}
          {primary && (
            <button
              disabled={busy || status === "DOWNLOADING" || status === "INSTALLING"}
              onClick={primary.run}
              className="text-[11px] px-2.5 py-1 rounded border bg-foreground text-background border-foreground disabled:opacity-40"
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
