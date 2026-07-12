// 模板库 · Prompt Template Library
import { useMemo, useState } from "react";
import { PROMPT_DOMAINS } from "@/constants/promptDomains";
import { TEMPLATE_FAMILY_LIST, TEMPLATE_FAMILY_META } from "@/constants/promptTemplateTypes";
import { PROMPT_TEMPLATE_FAMILIES, CURATED_TEMPLATE_COUNT, TOTAL_TEMPLATE_FAMILY_COUNT } from "@/constants/promptTemplateFamilies";

interface Props {
  onSelect?: (templateId: string) => void;
}

export function PromptTemplateLibrary({ onSelect }: Props) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return PROMPT_DOMAINS;
    return PROMPT_DOMAINS.filter(
      (d) => d.name.toLowerCase().includes(f) || d.en.toLowerCase().includes(f),
    );
  }, [filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Template Library · {TOTAL_TEMPLATE_FAMILY_COUNT} families supported
          <span className="ml-2 text-primary">· {CURATED_TEMPLATE_COUNT} curated</span>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="按领域名 / English 过滤…"
          className="aether-card text-xs px-2 py-1 rounded border border-border/40 outline-none"
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-1 pr-2 sticky left-0 bg-background/80 backdrop-blur">领域</th>
              {TEMPLATE_FAMILY_LIST.map((f) => (
                <th key={f} className="px-1">{TEMPLATE_FAMILY_META[f].cn}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-border/30">
                <td className="py-1 pr-2 sticky left-0 bg-background/80 backdrop-blur">
                  <div className="leading-tight">
                    <div>{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.en}</div>
                  </div>
                </td>
                {TEMPLATE_FAMILY_LIST.map((f) => {
                  const tpl = PROMPT_TEMPLATE_FAMILIES.find(
                    (t) => t.domainId === d.id && t.familyType === f,
                  );
                  if (!tpl) return <td key={f} />;
                  return (
                    <td key={f} className="px-1 py-1">
                      <button
                        type="button"
                        onClick={() => onSelect?.(tpl.id)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border w-full text-left ${
                          tpl.curated
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/40 hover:border-border"
                        }`}
                        title={tpl.name}
                      >
                        {tpl.curated ? "★" : "·"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-muted-foreground">
        ★ = 核心预置模板，可直接使用；其余为按 Domain × Family 自动展开的骨架，可按需补齐。
      </div>
    </div>
  );
}
