import { PackageOpen, Download, Package, Power } from "lucide-react";
import { toast } from "sonner";
import {
  downloadPackage,
  installPackage,
  enablePackage,
} from "@/lib/webxxm-store/webXXMPackageRegistry";

type Stage = "NOT_DOWNLOADED" | "DOWNLOADED" | "INSTALLED" | "DISABLED" | "ENABLED" | "BLOCKED" | "BROKEN";

interface Props {
  capabilityId: string;
  installed: boolean;
  enabled: boolean;
  storeRoute: string;
  message?: string;
  /** 后端解析出的生命周期阶段（向后兼容：缺失时按 installed/enabled 推断） */
  lifecycleStage?: Stage;
  /** 能力包 ID，用于一键执行下一步 */
  packageId?: string;
  onOpen?: (route: string) => void;
}

export function ChatCapabilityInstallCard({
  capabilityId,
  installed,
  enabled,
  storeRoute,
  message,
  lifecycleStage,
  packageId,
  onOpen,
}: Props) {
  const stage: Stage =
    lifecycleStage ??
    (!installed ? "NOT_DOWNLOADED" : !enabled ? "INSTALLED" : "ENABLED");

  const conf = (() => {
    switch (stage) {
      case "NOT_DOWNLOADED":
        return {
          title: "需要下载能力模型",
          tone: "需先下载该能力模型。",
          primary: "去下载",
          icon: <Download className="w-3 h-3" />,
          action: () => {
            if (!packageId) { onOpen?.(storeRoute); return; }
            const r = downloadPackage(packageId);
            if (r.ok) toast.success("下载完成，请继续安装");
            else toast.error("下载失败", { description: r.reason });
          },
        };
      case "DOWNLOADED":
        return {
          title: "需要安装能力模型",
          tone: "已下载，但尚未安装。",
          primary: "立即安装",
          icon: <Package className="w-3 h-3" />,
          action: () => {
            if (!packageId) { onOpen?.(storeRoute); return; }
            const r = installPackage(packageId);
            if (r.ok) toast.success("安装完成，请继续启用");
            else toast.error("安装失败", { description: r.reason });
          },
        };
      case "INSTALLED":
      case "DISABLED":
        return {
          title: "需要启用能力模型",
          tone: "已安装但未启用，平台暂不可调用。",
          primary: "立即启用",
          icon: <Power className="w-3 h-3" />,
          action: () => {
            if (!packageId) { onOpen?.(storeRoute); return; }
            const r = enablePackage(packageId);
            if (r.ok) toast.success("已启用，可以在对话和运行时中调用");
            else toast.error("启用失败", { description: r.reason });
          },
        };
      case "BLOCKED":
        return {
          title: "能力模型已阻断",
          tone: "请查看阻断原因。",
          primary: "查看阻断原因",
          icon: <PackageOpen className="w-3 h-3" />,
          action: () => onOpen?.(storeRoute),
        };
      case "BROKEN":
        return {
          title: "能力模型损坏",
          tone: "请前往商店查看。",
          primary: "查看问题",
          icon: <PackageOpen className="w-3 h-3" />,
          action: () => onOpen?.(storeRoute),
        };
      default:
        return {
          title: "能力模型",
          tone: "",
          primary: "打开商店",
          icon: <PackageOpen className="w-3 h-3" />,
          action: () => onOpen?.("/webxxm-store"),
        };
    }
  })();

  const stageLabel: Record<Stage, string> = {
    NOT_DOWNLOADED: "未下载",
    DOWNLOADED: "已下载·未安装",
    INSTALLED: "已安装·未启用",
    DISABLED: "已禁用",
    ENABLED: "已启用",
    BLOCKED: "已阻断",
    BROKEN: "损坏",
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <PackageOpen className="w-3.5 h-3.5 text-amber-300" />
        <div className="text-sm font-medium">{conf.title}：{capabilityId}</div>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
          {stageLabel[stage]}
        </span>
      </div>
      {(message || conf.tone) && (
        <div className="text-xs text-muted-foreground">{message ?? conf.tone}</div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={conf.action}
          className="text-xs px-2.5 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1"
        >
          {conf.icon}
          {conf.primary}
        </button>
        <button
          onClick={() => onOpen?.("/webxxm-store")}
          className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:border-border"
        >
          打开能力商店
        </button>
      </div>
    </div>
  );
}
