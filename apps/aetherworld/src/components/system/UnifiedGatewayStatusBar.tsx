// Aetherworld · 本地网关统一状态条
// 所有训练 / 数据 / 工厂 / AGI 页面顶部共用，确保 6+ 页面状态完全一致。
import { useEffect, useState } from "react";
import {
  buildOfflineStatus,
  getUnifiedLocalGatewayStatus,
  type LocalGatewayStatus,
} from "@/lib/local-execution-gateway/localGatewayUnifiedState";

interface Props {
  /** 自定义提示前缀，例如 "训练前置：" */
  prefix?: string;
  /** 顶部留白 */
  className?: string;
}

export function UnifiedGatewayStatusBar({ prefix, className }: Props) {
  const [s, setS] = useState<LocalGatewayStatus>(() => buildOfflineStatus("尚未探测"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getUnifiedLocalGatewayStatus();
        if (alive) setS(r);
      } catch {
        if (alive) setS(buildOfflineStatus("探测失败"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tone =
    !s.connected
      ? "border-rose-500/40 bg-rose-500/5 text-rose-300"
      : s.readyToRun
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
      : "border-amber-500/30 bg-amber-500/5 text-amber-300";

  const label = !s.connected
    ? "本地网关未连接"
    : s.readyToRun
    ? "本地网关已连接 · 可执行"
    : "本地网关已连接 · 存在阻断";

  const pyLabel = s.python.ok
    ? `Python 可用（${s.python.command}${s.python.version ? " " + s.python.version : ""}）`
    : "Python 不可用";

  return (
    <div className={`rounded-md border px-3 py-2 text-[11px] ${tone} ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">
          {prefix ? `${prefix} ` : ""}
          {loading ? "正在探测本地网关…" : label}
        </span>
        {s.connected && (
          <>
            <span>· {pyLabel}</span>
            <span>· 守护器：{s.daemon.mode === "OFFLINE" ? "离线" : s.daemon.mode === "GATEWAY_COMPAT" ? "网关兼容" : "专用 daemon"}</span>
            <span>· {s.baseUrl}</span>
          </>
        )}
        {s.blockingReasons.length > 0 && (
          <span className="text-rose-300">· 阻断：{s.blockingReasons.join("；")}</span>
        )}
        {s.warnings.length > 0 && (
          <span className="text-amber-300">· 警告：{s.warnings.join("；")}</span>
        )}
        <span className="opacity-60">· 状态源：统一网关 v0.1</span>
      </div>
    </div>
  );
}
