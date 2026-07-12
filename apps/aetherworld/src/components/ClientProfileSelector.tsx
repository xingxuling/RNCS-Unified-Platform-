import { CLIENT_PROFILES } from "@/constants/clientProfiles";

export function ClientProfileSelector({
  value, onChange,
}: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="aether-card p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
        Client Profile · 用户端
      </div>
      <div className="flex flex-wrap gap-2">
        {CLIENT_PROFILES.map(c => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`px-3 py-2 rounded-md border text-xs transition-colors ${
              value === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-foreground/80 hover:border-primary/40"
            }`}
            title={c.description}
          >
            <span className="font-medium">{c.name}</span>
            <span className="ml-1.5 text-[10px] text-muted-foreground">{c.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
