import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAetherData } from "@/lib/useAetherData";
import { getSnapshot } from "@/lib/globalRecalculationEngine";
import type { RecalcModuleId } from "@/constants/recalculationScopes";
import { RECALC_MODULES } from "@/constants/recalculationScopes";
import { GlobalRecalculateButton } from "./GlobalRecalculateButton";

interface Props {
  /** 当前页面关心哪些模块 — 若其中任一过期则显示警告 */
  watch?: RecalcModuleId[];
  /** 是否允许 Ignore Once（高风险情况会忽略此参数） */
  allowIgnore?: boolean;
  /** 是否高风险（如删除主体后页面仍残留旧预测） — 禁止 Ignore */
  highRisk?: boolean;
  className?: string;
}

/**
 * 旧状态警告 — 当 watch 列表中存在 stale 模块时显示温和提示。
 * 用户可点击"重新计算"或"查看影响模块"。
 */
export function StaleStateWarning({
  watch,
  allowIgnore = true,
  highRisk = false,
  className,
}: Props) {
  const { active, feedback } = useAetherData();
  const [ignored, setIgnored] = useState(false);
  const snap = useMemo(() => getSnapshot(), [active, feedback]);

  const relevant = (watch ?? (Object.keys(RECALC_MODULES) as RecalcModuleId[]))
    .filter((id) => snap.modules[id].status === "stale");

  if (relevant.length === 0 || (ignored && !highRisk)) return null;

  return (
    <div
      className={`rounded-md border p-4 ${
        highRisk
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-500/40 bg-amber-500/5"
      } ${className ?? ""}`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className={`w-4 h-4 mt-0.5 ${highRisk ? "text-destructive" : "text-amber-400"}`} />
        <div className="flex-1 space-y-2">
          <div className={`text-xs font-display ${highRisk ? "text-destructive" : "text-amber-300"}`}>
            当前页面包含旧计算结果
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            底层数据已变化，建议重新计算。受影响模块：
            <span className="text-foreground">
              {" "}{relevant.map((id) => RECALC_MODULES[id].cn).join(" / ")}
            </span>
            {highRisk && (
              <span className="text-destructive"> · 高风险，禁止忽略</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <GlobalRecalculateButton
              scope="CURRENT_SUBJECT_ONLY"
              trigger="MANUAL"
              label="立即重算"
              size="sm"
              variant="default"
            />
            <Link
              to="/recalculation"
              className="text-[11px] underline text-muted-foreground hover:text-foreground"
            >
              查看受影响模块
            </Link>
            {allowIgnore && !highRisk && (
              <button
                onClick={() => setIgnored(true)}
                className="text-[11px] underline text-muted-foreground hover:text-foreground ml-auto"
              >
                暂时忽略
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
