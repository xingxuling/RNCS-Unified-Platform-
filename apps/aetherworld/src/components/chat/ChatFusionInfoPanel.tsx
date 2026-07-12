import { useState } from "react";
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import { CALCULUS_LABEL } from "@/lib/chat/calculusRouteResultTypes";

interface Props {
  info: FusionRuntimeInfo;
}

export function ChatFusionInfoPanel({ info }: Props) {
  const [open, setOpen] = useState(false);
  const chainLabels = info.chain.steps.map((s) => CALCULUS_LABEL[s.calculusId]);

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 text-[10px] text-muted-foreground">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-2 py-1.5 flex items-center justify-between gap-2 hover:text-foreground"
      >
        <span className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span>融合层：</span>
          <span>主导域 {info.fiveDomain.dominantDomain}</span>
          <span>·</span>
          <span>{info.engineProfile.chineseName}</span>
          {chainLabels.length > 0 && (
            <>
              <span>·</span>
              <span>链 {chainLabels.length} 步</span>
            </>
          )}
          <span>·</span>
          <span>概念 {info.conceptGraph.nodes.length}</span>
        </span>
        <span>{open ? "收起" : "展开"}</span>
      </button>

      {open && (
        <div className="px-2 pb-2 space-y-2 border-t border-border/40 pt-2">
          {/* 计算法链 */}
          <div>
            <div className="text-foreground/80 mb-0.5">计算法链</div>
            <div>{chainLabels.length ? chainLabels.join(" → ") : "—"}</div>
            <div className="opacity-70">{info.chain.reason}</div>
          </div>

          {/* 引擎权重 */}
          <div>
            <div className="text-foreground/80 mb-0.5">引擎权重</div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {info.engineProfile.primaryTop.map((e) => (
                <span key={e.engineId}>
                  {e.engineId} {e.weight.toFixed(2)}
                </span>
              ))}
              <span>· 安全 {info.engineProfile.safetyWeight.toFixed(2)}</span>
            </div>
          </div>

          {/* 五域 */}
          <div>
            <div className="text-foreground/80 mb-0.5">五域坐标</div>
            <div className="space-y-0.5">
              {info.fiveDomain.coordinates.map((c) => (
                <div key={c.domain}>
                  <span className="text-foreground/80">{c.label}</span>
                  <span className="opacity-70">
                    （{(c.weight * 100).toFixed(0)}%）：{c.interpretation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 常数约束 */}
          <div>
            <div className="text-foreground/80 mb-0.5">常数约束</div>
            <div>已应用：{info.appliedConstantGroups.join(" / ")}</div>
            {info.drift && info.drift.severity !== "NONE" && (
              <div className="text-amber-500">
                漂移：{info.drift.severity}（{info.drift.notes.join("；")}）
              </div>
            )}
          </div>

          {/* WebLCM 概念图 */}
          <div>
            <div className="text-foreground/80 mb-0.5">
              WebLCM 概念图（置信度 {info.conceptGraph.confidence.toFixed(2)}）
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {info.conceptGraph.nodes.slice(0, 8).map((n) => (
                <span key={n.id}>
                  {n.label}[{n.type}]
                </span>
              ))}
            </div>
            <div className="opacity-70">{info.conceptGraph.summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}
