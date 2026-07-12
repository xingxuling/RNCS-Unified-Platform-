// 变量编辑器 · Prompt Variable Editor
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface VarField {
  key: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

interface Props {
  fields: VarField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  missing?: string[];
}

export function PromptVariableEditor({ fields, values, onChange, missing = [] }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {fields.map((f) => {
        const isMissing = missing.includes(f.key);
        return (
          <label key={f.key} className="block">
            <div className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
              <span>{f.label}</span>
              <span className="text-muted-foreground/60">· {f.key}</span>
              {isMissing && <span className="text-red-400">必填</span>}
            </div>
            {f.multiline ? (
              <Textarea
                rows={3}
                value={values[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="aether-card border-border/40"
              />
            ) : (
              <Input
                value={values[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="aether-card border-border/40"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
