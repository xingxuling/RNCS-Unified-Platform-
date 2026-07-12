// 模板有效性面板 · Template Effectiveness Panel
import { useEffect, useState } from "react";
import { computeEffectiveness, loadUsage, type TemplateEffectivenessStats } from "@/lib/templateEffectivenessEngine";
import { findTemplate } from "@/constants/promptTemplateFamilies";
import { findDomain } from "@/constants/promptDomains";

export function TemplateEffectivenessPanel() {
  const [stats, setStats] = useState<TemplateEffectivenessStats[]>([]);
  useEffect(() => { setStats(computeEffectiveness(loadUsage())); }, []);

  if (!stats.length) {
    return (
      <div className="aether-card rounded-md p-4 text-xs text-muted-foreground">
        暂无使用记录。生成并保存提示词后，系统会回验每条模板的有效性。
      </div>
    );
  }

  return (
    <div className="aether-card rounded-md p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Template Effectiveness · 模板有效性回验
      </div>
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="text-left">
            <th className="py-1">模板</th>
            <th>领域</th>
            <th className="text-right">用</th>
            <th className="text-right">质量</th>
            <th className="text-right">漂移</th>
            <th className="text-right">命中</th>
            <th className="text-right">有效</th>
          </tr>
        </thead>
        <tbody>
          {stats.slice(0, 15).map((s) => {
            const tpl = findTemplate(s.templateFamilyId);
            return (
              <tr key={s.templateFamilyId} className="border-t border-border/30">
                <td className="py-1">{tpl?.name ?? s.templateFamilyId}</td>
                <td>{findDomain(s.domainId)?.name ?? s.domainId}</td>
                <td className="text-right">{s.uses}</td>
                <td className="text-right">{s.avgQuality.toFixed(0)}</td>
                <td className="text-right">{(s.driftRate * 100).toFixed(0)}%</td>
                <td className="text-right">{(s.matchRate * 100).toFixed(0)}%</td>
                <td className="text-right">{s.effectivenessScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
