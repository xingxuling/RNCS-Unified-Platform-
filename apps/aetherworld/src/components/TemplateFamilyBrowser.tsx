// 模板族浏览器 · Template Family Browser
import {
  PROMPT_TEMPLATE_FAMILIES, templatesByDomain, type PromptTemplateFamily,
} from "@/constants/promptTemplateFamilies";
import { TEMPLATE_FAMILY_LIST, TEMPLATE_FAMILY_META } from "@/constants/promptTemplateTypes";

interface Props {
  domainId: string;
  value?: string;
  onSelect: (tpl: PromptTemplateFamily) => void;
}

export function TemplateFamilyBrowser({ domainId, value, onSelect }: Props) {
  const list = domainId ? templatesByDomain(domainId) : PROMPT_TEMPLATE_FAMILIES.slice(0, 12);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {TEMPLATE_FAMILY_LIST.map((f) => {
        const tpl = list.find((t) => t.familyType === f);
        if (!tpl) return null;
        const active = tpl.id === value;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl)}
            className={`text-left aether-card p-3 rounded-md border transition ${
              active ? "border-primary/70 bg-primary/10" : "border-border/40 hover:border-border"
            }`}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {TEMPLATE_FAMILY_META[f].cn} · {TEMPLATE_FAMILY_META[f].en}
            </div>
            <div className="text-sm font-medium mt-1">{tpl.name}</div>
            <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tpl.description}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-2">
              {tpl.curated ? "★ 核心模板" : "扩展模板"} · 输出 {tpl.outputFormat}
            </div>
          </button>
        );
      })}
    </div>
  );
}
