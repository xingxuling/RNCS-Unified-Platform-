import { SOCIAL_VISIBILITY_LIST } from "@/constants/social/socialVisibilityTypes";
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";

export function SocialVisibilitySelector({
  value,
  onChange,
}: {
  value: SocialVisibility;
  onChange: (v: SocialVisibility) => void;
}) {
  return (
    <div className="space-y-2">
      {SOCIAL_VISIBILITY_LIST.map((v) => (
        <label
          key={v.id}
          className={`flex items-start gap-3 px-3 py-2 rounded-md border cursor-pointer transition ${
            value === v.id ? "border-foreground/40 bg-muted/40" : "border-border hover:border-foreground/20"
          }`}
        >
          <input
            type="radio"
            name="social-visibility"
            className="mt-1"
            checked={value === v.id}
            onChange={() => onChange(v.id as SocialVisibility)}
          />
          <div>
            <div className="text-sm font-medium">{v.label}</div>
            <div className="text-xs text-muted-foreground">{v.description}</div>
          </div>
        </label>
      ))}
      <p className="text-[11px] text-muted-foreground">默认为「仅自己」，公开前会执行安全检查。</p>
    </div>
  );
}
