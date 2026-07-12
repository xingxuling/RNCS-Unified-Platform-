import { DEVICE_PROFILES } from "@/constants/deviceProfiles";

export function DeviceProfileSelector({
  value, onChange,
}: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="aether-card p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
        Device Profile · 设备端
      </div>
      <div className="flex flex-wrap gap-2">
        {DEVICE_PROFILES.map(d => (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            className={`px-3 py-2 rounded-md border text-xs transition-colors ${
              value === d.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-foreground/80 hover:border-primary/40"
            }`}
            title={d.layoutMode}
          >
            <span className="font-medium">{d.name}</span>
            <span className="ml-1.5 text-[10px] text-muted-foreground">{d.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
