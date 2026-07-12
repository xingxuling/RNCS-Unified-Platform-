import { BETA_ACCESS_LEVEL_LIST, type BetaAccessLevelId } from "@/constants/betaAccessLevels";
import { BETA_USER_SEGMENT_LIST } from "@/constants/betaUserSegments";
import { Check, Minus } from "lucide-react";

interface Props {
  recommendedAccessLevels: BetaAccessLevelId[];
}

export function BetaAccessMatrix({ recommendedAccessLevels }: Props) {
  const allowed = new Set(recommendedAccessLevels);
  return (
    <div className="aether-card p-5 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beta Access Matrix</div>
        <div className="font-display text-lg gold-text">访问等级矩阵</div>
        <div className="text-xs text-muted-foreground mt-1">不同用户群对应的推荐访问等级；✓ 表示该等级当前阶段对该群体开放。</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 pr-3">用户群体</th>
              {BETA_ACCESS_LEVEL_LIST.map((lvl) => (
                <th key={lvl.id} className="text-center py-2 px-2 whitespace-nowrap">
                  <div className="font-display text-[11px]">{lvl.label}</div>
                  <div className="text-[10px] text-muted-foreground">{lvl.cn}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BETA_USER_SEGMENT_LIST.map((seg) => (
              <tr key={seg.id} className="border-b border-border/40">
                <td className="py-2 pr-3">
                  <div className="font-display text-[12px]">{seg.cn}</div>
                  <div className="text-[10px] text-muted-foreground tracking-wider">{seg.en}</div>
                </td>
                {BETA_ACCESS_LEVEL_LIST.map((lvl) => {
                  const matched = seg.recommendedAccessLevels.includes(lvl.id);
                  const gated = matched && !allowed.has(lvl.id);
                  return (
                    <td key={lvl.id} className="text-center py-2 px-2">
                      {matched ? (
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded ${
                            gated ? "text-amber-400/70" : "text-emerald-400"
                          }`}
                          title={gated ? "用户匹配，但当前阶段尚未开放" : "已开放"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <Minus className="w-3 h-3 inline text-muted-foreground/40" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-muted-foreground/70 italic leading-relaxed">
        · 绿色 ✓：当前内测阶段允许开放。 <br />
        · 琥珀色 ✓：用户群匹配该等级，但当前阶段尚未达到开放条件。
      </div>
    </div>
  );
}
