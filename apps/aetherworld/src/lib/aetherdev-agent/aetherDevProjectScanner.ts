// AetherDev · 项目状态扫描器（只读复用现有 store）
import { buildCompletenessReport, SYSTEM_ROUTE_REGISTRY } from "@/lib/system/systemPageCompletenessReport";
import { BUG_REPORT, bugSummary } from "@/lib/system/bugAuditReport";
import type { DevProjectSnapshot } from "./aetherDevTypes";

function detectLocalGateway(): DevProjectSnapshot["localGateway"] {
  if (typeof window === "undefined") {
    return { detected: false, statusLabel: "服务端环境", note: "SSR 阶段不检测本地网关" };
  }
  const w = window as unknown as {
    __AETHER_LOCAL_GATEWAY__?: unknown;
    __AETHER_ELECTRON_IPC__?: unknown;
  };
  if (w.__AETHER_ELECTRON_IPC__ || w.__AETHER_LOCAL_GATEWAY__) {
    return { detected: true, statusLabel: "已检测", note: "可执行只读检查命令" };
  }
  return {
    detected: false,
    statusLabel: "未连接",
    note: "未检测到 local-gateway / Electron IPC，命令将降级为 NEEDS_LOCAL_GATEWAY",
  };
}

export function scanProjectSnapshot(): DevProjectSnapshot {
  const completeness = buildCompletenessReport();
  const bug = bugSummary();
  return {
    generatedAt: new Date().toISOString(),
    projectRoot: typeof window !== "undefined" ? window.location.host : "(ssr)",
    pageCompleteness: {
      total: completeness.totalEntries,
      ready: completeness.ready,
      placeholder: completeness.placeholder,
      runtimeOnly: completeness.runtimeOnly,
      pageMissing: completeness.pageMissing,
      broken: completeness.broken,
    },
    bugAudit: {
      total: bug.total,
      blockers: bug.blockers,
      high: bug.high,
      needsReview: bug.needsReview,
    },
    localGateway: detectLocalGateway(),
  };
}

export function listBrokenOrMissingRoutes() {
  return SYSTEM_ROUTE_REGISTRY.filter(
    (r) => r.status === "PAGE_MISSING" || r.status === "BROKEN" || r.status === "PLACEHOLDER",
  );
}

export function listOpenBugs() {
  return BUG_REPORT.filter((b) => b.status !== "AUTO_FIXED" && b.status !== "WONT_FIX");
}
