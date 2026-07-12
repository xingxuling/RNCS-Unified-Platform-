import type { RealityAnchor } from "@/lib/virtualRealityAnchorEngine";

export function VirtualRealityAnchorCard({ anchor }: { anchor: RealityAnchor }) {
  return (
    <div className="aether-card p-5 space-y-1 border-primary/30">
      <div className="text-xs uppercase tracking-wider text-primary">Reality Anchor · 现实锚点</div>
      <div className="text-sm text-foreground">{anchor.anchorText}</div>
      <div className="text-[11px] text-muted-foreground">类型：{anchor.anchorType}</div>
      <div className="text-[11px] text-muted-foreground">为什么重要：{anchor.whyItMatters}</div>
    </div>
  );
}
