// 畅想式融合 · 结果卡片
import type { ChatImaginativeFusionInfo } from "@/lib/imaginative-fusion/imaginativeFusionChatBridge";

interface Props {
  info: ChatImaginativeFusionInfo;
}

const MODE_LABEL: Record<string, string> = {
  PRODUCT_FUSION:  "产品融合",
  WORKFLOW_FUSION: "工作流融合",
  AGENT_FUSION:    "Agent 融合",
  WORLD_FUSION:    "世界融合",
  STORE_FUSION:    "能力包融合",
  BUSINESS_FUSION: "商业融合",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "border-emerald-500/40 text-emerald-500",
  P1: "border-sky-500/40 text-sky-500",
  P2: "border-amber-500/40 text-amber-500",
  P3: "border-border/60 text-muted-foreground",
};

export function ChatImaginativeFusionCard({ info }: Props) {
  const { output } = info;
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          畅想融合 · Top 5
        </div>
        <a
          href="/system/imaginative-fusion"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开畅想工作台
        </a>
      </div>

      <div className="text-sm text-foreground/90">{info.summary}</div>

      <div className="space-y-2">
        {output.report.topIdeas.map((i) => (
          <div key={i.id} className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs font-medium text-foreground/90">{i.cnTitle}</div>
              <div className="flex gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                  {MODE_LABEL[i.fusionMode] ?? i.fusionMode}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    PRIORITY_COLOR[i.recommendedPriority] ?? "border-border/60 text-muted-foreground"
                  }`}
                >
                  {i.recommendedPriority}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">{i.description}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span>价值 {i.potentialValue}</span>
              <span>难度 {i.implementationDifficulty}</span>
              <span>契合 {i.strategicFit}</span>
              <span>新颖 {i.novelty}</span>
              <span>风险 {i.riskLevel}</span>
              <span>→ {i.suggestedNextStep}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              目标：{i.targetAetherSystems.join(" / ")}
            </div>
          </div>
        ))}
      </div>

      {output.packageIdeas.length > 0 && (
        <details className="text-[11px]">
          <summary className="cursor-pointer text-muted-foreground">
            WebXXM 能力包草案 · {output.packageIdeas.length} 个
          </summary>
          <ul className="mt-1 space-y-1 text-muted-foreground">
            {output.packageIdeas.map((p) => (
              <li key={p.packageName}>· <span className="text-foreground/80">{p.packageName}</span>：{p.capability}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="text-[10px] text-muted-foreground">
        说明：本卡片仅为畅想阶段产物。不自动修改代码 / 合并项目 / 引入依赖 / 创建后端表 / 调用外部 API / 公开发布 / 上架商店 / 部署。
      </div>
    </div>
  );
}
